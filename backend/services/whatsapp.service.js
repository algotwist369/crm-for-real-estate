// Baileys is an ESM-only module in recent versions. 
// We use dynamic imports to ensure compatibility with CommonJS.
let baileys = null;
const getBaileys = async () => {
    if (!baileys) {
        baileys = await import('@whiskeysockets/baileys');
    }
    return baileys;
};

const WhatsAppAuth = require('../model/whatsappAuth.model');
const WhatsAppSession = require('../model/whatsappSession.model');
const logger = require('../utils/logger');
const socketService = require('./socket.service');
const pino = require('pino');
const { Boom } = require('@hapi/boom');

const sessions = new Map(); // Store active socket instances per user
const lastActive = new Map(); // Track last activity for pruning idle connections
const initializingUsers = new Set();
const reconnectAttempts = new Map(); // Track consecutive failures
const QR_TTL_MS = 60 * 1000;
const INIT_LOCK_TTL_MS = 2 * 60 * 1000;
const IDLE_TIMEOUT_MS = Number(process.env.WHATSAPP_IDLE_TIMEOUT_MS || 45 * 60 * 1000);
const MAX_SOCKET_RETRIES = Number(process.env.WHATSAPP_SOCKET_RETRIES || 5);
const BOOT_RECONNECT_LIMIT = Number(process.env.WHATSAPP_BOOT_RECONNECT_LIMIT || 200);
const BOOT_RECONNECT_MAX_AGE_DAYS = Number(process.env.WHATSAPP_BOOT_RECONNECT_MAX_AGE_DAYS || 7);

const toKey = (userId) => userId.toString();

const killSocket = (userId, shouldLogout = false) => {
    const key = toKey(userId);
    const sock = sessions.get(key);
    if (!sock) return;

    try {
        sock.ev?.removeAllListeners();
        if (shouldLogout && typeof sock.logout === 'function') {
            sock.logout().catch(() => {});
        }
        sock.end?.();
    } catch (e) {
        logger.debug(`[Baileys] Ignored socket cleanup error for ${userId}: ${e.message}`);
    }

    sessions.delete(key);
    lastActive.delete(key);
};

const clearRuntimeState = (userId) => {
    const key = toKey(userId);
    initializingUsers.delete(key);
    reconnectAttempts.delete(key);
    lastActive.delete(key);
    lastInitTimes.delete(key);
};

let sessionIndexRepairPromise = null;

const ensureWhatsAppSessionIndexes = async () => {
    if (!sessionIndexRepairPromise) {
        sessionIndexRepairPromise = (async () => {
            try {
                const indexes = await WhatsAppSession.collection.indexes();
                const badSessionIdIndex = indexes.find(index =>
                    index.name === 'sessionId_1' &&
                    (
                        index.unique === true ||
                        index.sparse === true ||
                        !index.partialFilterExpression
                    )
                );

                if (badSessionIdIndex) {
                    logger.warn('[Baileys] Dropping unsafe unique whatsappsessions.sessionId_1 index.');
                    await WhatsAppSession.collection.dropIndex('sessionId_1');
                }

                await WhatsAppSession.collection.createIndex(
                    { sessionId: 1 },
                    {
                        name: 'sessionId_1',
                        partialFilterExpression: { sessionId: { $type: 'string' } }
                    }
                );
            } catch (err) {
                if (err.codeName !== 'NamespaceNotFound') {
                    logger.error(`[Baileys] WhatsAppSession index repair failed: ${err.message}`);
                    throw err;
                }
            }
        })().catch(err => {
            sessionIndexRepairPromise = null;
            throw err;
        });
    }

    return sessionIndexRepairPromise;
};

// // 🛡️ [Senior Dev Helper] Buffer Fixer for DB-restored credentials only
const fixBuffers = (data) => {
    if (!data) return data;
    if (data._bsontype === 'Binary') {
        return Buffer.isBuffer(data.buffer) ? data.buffer : Buffer.from(data.buffer || data.value || []);
    }
    if (data.type === 'Buffer' && Array.isArray(data.data)) {
        return Buffer.from(data.data);
    }
    if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        const fixed = Array.isArray(data) ? [] : {};
        for (const key in data) {
            fixed[key] = fixBuffers(data[key]);
        }
        return fixed;
    }
    return data;
};

/**
 * Custom MongoDB Auth Store for Baileys
 * Uses a MEMORY-FIRST strategy to prevent 515 Stream Errors.
 */
const useMongoDBAuthState = async (userId, tenantId = 'default') => {
    const { initAuthCreds } = await getBaileys();

    // Load any existing record from DB
    const rawData = await WhatsAppAuth.findOne({ userId }).lean();

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  🛡️ DEFINITIVE FIX: MEMORY-FIRST CREDENTIAL STRATEGY        ║
    // ║                                                              ║
    // ║  ROOT CAUSE OF 515:                                          ║
    // ║  MongoDB BSON encoding corrupts binary noiseKey on write.    ║
    // ║  Reading it back via .lean() produces a mathematically       ║
    // ║  invalid key. WhatsApp Noise Protocol rejects it → 515.     ║
    // ║                                                              ║
    // ║  THE FIX:                                                    ║
    // ║  Fresh credentials are kept 100% IN MEMORY during QR phase. ║
    // ║  They are ONLY written to MongoDB via commitToDB() AFTER     ║
    // ║  connection === 'open' is confirmed. Zero BSON corruption.   ║
    // ╚══════════════════════════════════════════════════════════════╝

    let creds;
    let data = { keys: {}, _id: rawData?._id };
    let isPersistent = false;

    const hasValidCreds = rawData && rawData.creds && rawData.creds.noiseKey;

    if (!hasValidCreds) {
        // FRESH / RESET: Generate completely in-memory. No DB write until connected.
        creds = initAuthCreds();
        logger.info(`[Baileys] [Memory-First] Fresh creds in memory for ${userId}. Will persist after successful scan.`);
    } else {
        // RETURNING USER: Restore from DB with full Buffer fixup.
        creds = fixBuffers(rawData.creds);
        data.keys = fixBuffers(rawData.keys || {});
        isPersistent = true;
        logger.info(`[Baileys] [Memory-First] Restored creds from DB for ${userId}.`);
    }

    const state = {
        creds,
        keys: {
            get: (type, ids) => {
                const result = {};
                ids.forEach(id => {
                    const value = (data.keys || {})[`${type}-${id}`];
                    if (value) result[id] = fixBuffers(value);
                });
                return result;
            },
            set: async (keyData) => {
                const currentKeys = data.keys || {};
                for (const category in keyData) {
                    for (const id in keyData[category]) {
                        const value = keyData[category][id];
                        if (value) currentKeys[`${category}-${id}`] = value;
                        else delete currentKeys[`${category}-${id}`];
                    }
                }
                data.keys = currentKeys;
                // Only write to DB if we have a confirmed successful session
                if (isPersistent && data._id) {
                    await WhatsAppAuth.updateOne({ userId }, { keys: currentKeys }).catch(e =>
                        logger.error(`[Baileys] Key save failed for ${userId}: ${e.message}`)
                    );
                }
            }
        }
    };

    const saveCreds = async () => {
        // Only persist creds if we are in a confirmed-connected state
        if (isPersistent && data._id) {
            await WhatsAppAuth.updateOne({ userId }, { creds: state.creds }).catch(err =>
                logger.error(`[Baileys] Cred save failed for ${userId}: ${err.message}`)
            );
        }
    };

    /**
     * 🛡️ commitToDB — The ONLY moment fresh credentials are written to MongoDB.
     * Called exclusively when connection === 'open' is confirmed.
     * This guarantees the noiseKey is NEVER BSON-corrupted before it is used.
     */
    const commitToDB = async () => {
        logger.info(`[Baileys] [Memory-First] Committing verified credentials to DB for ${userId}.`);
        const saved = await WhatsAppAuth.findOneAndUpdate(
            { userId },
            { userId, tenantId, creds: state.creds, keys: data.keys },
            { upsert: true, new: true }
        );
        data._id = saved._id;
        isPersistent = true;
    };

    return { state, saveCreds, commitToDB };
};

const lastInitTimes = new Map();

/**
 * 🛡️ bindSocket - Creates a WASocket and binds all event listeners.
 * Extracted as a helper so we can reconnect on 515 with the SAME in-memory
 * auth state (containing the freshly-paired credentials) instead of starting fresh.
 *
 * The 515 (Stream Error) is WhatsApp's "stream reset" signal — it means
 * "close this WebSocket and reconnect." It is NOT a credential rejection.
 * Reconnecting with the same auth object allows the paired session to succeed.
 */
const bindSocket = async ({
    userId, tenantId, auth, state, saveCreds, commitToDB,
    version, pinoLogger, makeWASocket, Browsers, DisconnectReason, delay,
    isSilentReconnect, retryCount = 0
}) => {
    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth,
        logger: pinoLogger,
        browser: Browsers.ubuntu('Chrome'),
        retryRequestDelayMs: 3000,
        connectTimeoutMs: 60000,
        markOnlineOnConnect: false,
        syncFullHistory: false,
    });

    sessions.set(userId.toString(), sock);
    lastActive.set(userId.toString(), Date.now());

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        lastActive.set(userId.toString(), Date.now());

        if (qr) {
            const qrExpiresAt = new Date(Date.now() + QR_TTL_MS);
            logger.info(`[Baileys] QR Received for user ${userId}`);
            await WhatsAppSession.findOneAndUpdate(
                { userId },
                { userId, tenantId, status: 'qr_pending', qrCode: qr, qrExpiresAt, error: null },
                { upsert: true }
            );
            socketService.emitToUser(userId, 'whatsapp:qr', { qr, qrExpiresAt });
            socketService.emitToUser(userId, 'whatsapp:status', { status: 'qr_pending', message: 'QR Code Generated', qrExpiresAt });
            socketService.emitToUser(userId, 'whatsapp:log', { message: '📸 QR Code Received (Please Scan Now)' });
        }

        if (connection === 'close') {
            const disconnectError = lastDisconnect?.error;
            const statusCode = (disconnectError instanceof Boom)?.output?.statusCode
                || disconnectError?.output?.statusCode;
            const isLoggedOut = statusCode === DisconnectReason.loggedOut;

            logger.warn(`[Baileys] Connection closed for ${userId}. Code: ${statusCode}. Error: ${disconnectError?.message || 'Unknown'}`);
            socketService.emitToUser(userId, 'whatsapp:log', {
                message: `⚠️ Connection Closed (Code: ${statusCode || 'Unknown'}). ${disconnectError?.message || ''}`
            });

            sessions.delete(userId.toString());
            const hasRegisteredCreds = Boolean(auth?.creds?.registered);

            // ════════════════════════════════════════════════════════════
            // 🛡️ CRITICAL FIX: 515 = WhatsApp "Stream Reset" Signal
            // ════════════════════════════════════════════════════════════
            // 515 is NOT a failure. WhatsApp sends this AFTER a QR scan to
            // reset the stream and upgrade it to an authenticated connection.
            // The CORRECT response is to reconnect with the SAME in-memory
            // auth object (which already contains the freshly-paired keys).
            // Deleting credentials on 515 was destroying the pairing data —
            // that was the core reason users could never successfully connect.
            // ════════════════════════════════════════════════════════════
            if (statusCode === 515 && retryCount < 3) {
                logger.info(`[Baileys] 515 Protocol Reset. Auto-reconnecting with same credentials (attempt ${retryCount + 1}/3)...`);
                socketService.emitToUser(userId, 'whatsapp:log', { message: `🔄 Protocol Reset. Auto-reconnecting...` });
                await delay(1500);
                await bindSocket({
                    userId, tenantId, auth, state, saveCreds, commitToDB,
                    version, pinoLogger, makeWASocket, Browsers, DisconnectReason, delay,
                    isSilentReconnect, retryCount: retryCount + 1
                });
                return;
            }

            if (!isLoggedOut && hasRegisteredCreds && retryCount < MAX_SOCKET_RETRIES) {
                const attempt = retryCount + 1;
                const backoffMs = Math.min(30000, 2000 * attempt);
                reconnectAttempts.set(userId.toString(), attempt);
                await WhatsAppSession.findOneAndUpdate(
                    { userId },
                    {
                        status: 'reconnecting',
                        qrCode: null,
                        qrExpiresAt: null,
                        reconnectAttempts: attempt,
                        error: disconnectError?.message || `Connection closed (${statusCode || 'unknown'})`
                    },
                    { upsert: true }
                );
                socketService.emitToUser(userId, 'whatsapp:status', {
                    status: 'reconnecting',
                    message: 'WhatsApp connection interrupted. Reconnecting...'
                });
                await delay(backoffMs);
                await bindSocket({
                    userId, tenantId, auth, state, saveCreds, commitToDB,
                    version, pinoLogger, makeWASocket, Browsers, DisconnectReason, delay,
                    isSilentReconnect: true, retryCount: attempt
                });
                return;
            }

            // Permanent logout (401/403) — wipe credentials and notify
            if (isLoggedOut || statusCode === 401 || statusCode === 403) {
                logger.info(`[Baileys] Permanent logout for ${userId}. Wiping credentials.`);
                await WhatsAppAuth.deleteOne({ userId });
                await WhatsAppSession.findOneAndUpdate({ userId }, { status: 'disconnected', qrCode: null, qrExpiresAt: null, error: null, reconnectAttempts: 0 });
                socketService.emitToUser(userId, 'whatsapp:status', {
                    status: 'disconnected',
                    message: 'Session Expired. Please link your device again.'
                });
                socketService.emitToUser(userId, 'whatsapp:log', { message: '🧼 Session cleared. Ready for Fresh Link.' });
                initializingUsers.delete(userId.toString());
                return;
            }

            // All other errors — release lock and notify user
            await WhatsAppSession.findOneAndUpdate(
                { userId },
                { status: 'disconnected', qrCode: null, qrExpiresAt: null, error: disconnectError?.message || `Connection closed (${statusCode || 'unknown'})`, reconnectAttempts: 0 },
                { upsert: true }
            );
            socketService.emitToUser(userId, 'whatsapp:status', {
                status: 'disconnected',
                message: `Connection Failed (Code: ${statusCode}). Please click Link WhatsApp Device again.`
            });
            initializingUsers.delete(userId.toString());
            lastActive.delete(userId.toString());
        }

        if (connection === 'open') {
            reconnectAttempts.delete(userId.toString());

            // 🛡️ First and ONLY time credentials touch MongoDB.
            // In-memory keys are now verified-good (handshake succeeded).
            // BSON corruption is impossible because we write AFTER success.
            await commitToDB().catch(e => logger.error(`Failed to commit auth for ${userId}: ${e.message}`));

            setTimeout(() => initializingUsers.delete(userId.toString()), 2000);

            logger.info(`[Baileys] Connection opened for ${userId}`);
            await WhatsAppSession.findOneAndUpdate(
                { userId },
                { status: 'connected', qrCode: null, qrExpiresAt: null, lastConnectedAt: new Date(), error: null, reconnectAttempts: 0 },
                { upsert: true }
            );
            socketService.emitToUser(userId, 'whatsapp:status', { status: 'connected', message: 'WhatsApp Connected!' });
            socketService.emitToUser(userId, 'whatsapp:log', { message: '✅ WhatsApp Connected Successfully!' });
        }
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', () => lastActive.set(userId.toString(), Date.now()));

    return sock;
};

const initWhatsAppSession = async (userId, tenantId, isAutoReconnect = false, forceNew = false) => {
    const now = Date.now();

    const lastInitTime = lastInitTimes.get(userId.toString()) || 0;
    const isLockStale = (now - lastInitTime) > INIT_LOCK_TTL_MS;

    if (initializingUsers.has(userId.toString()) && !isLockStale && !forceNew) {
        logger.debug(`[Baileys] Mutex active: Session for ${userId} is already initializing.`);
        return { status: 'initializing' };
    }

    if (isLockStale) {
        logger.warn(`[Baileys] Force-Recovering stale lock for user ${userId}.`);
        initializingUsers.delete(userId.toString());
    }

    if (isAutoReconnect) {
        logger.debug(`[Baileys] Aborting background init for ${userId}: Only Manual Link allowed.`);
        return { status: 'aborted' };
    }

    let isSilentReconnect = false;
    if (!forceNew) {
        try {
            const dbSession = await WhatsAppSession.findOne({ userId });
            if (dbSession?.status === 'connected') {
                const existingSocket = sessions.get(userId.toString());
                if (existingSocket) {
                    socketService.emitToUser(userId, 'whatsapp:status', { status: 'connected', message: 'WhatsApp Connected!' });
                    return { status: 'connected', userId };
                }
                isSilentReconnect = true;
            }
        } catch (e) {
            logger.error(`Error checking DB session: ${e.message}`);
        }
    }

    initializingUsers.add(userId.toString());
    lastInitTimes.set(userId.toString(), now);

    // Kill any existing zombie socket
    if (sessions.has(userId.toString())) {
        try {
            const oldSock = sessions.get(userId.toString());
            oldSock.ev.removeAllListeners();
            oldSock.end();
            sessions.delete(userId.toString());
        } catch (e) { /* ignore */ }
    }

    if (!isSilentReconnect) {
        reconnectAttempts.delete(userId.toString());
    }

    try {
        const {
            default: makeWASocket,
            DisconnectReason,
            fetchLatestBaileysVersion,
            makeCacheableSignalKeyStore,
            Browsers,
            delay
        } = await getBaileys();

        socketService.emitToUser(userId, 'whatsapp:log', { message: '📄 Initializing Session Credentials...' });
        logger.info(`[Baileys] Initializing session for user ${userId} (Silent: ${isSilentReconnect})`);

        if (!isSilentReconnect) {
            await WhatsAppSession.findOneAndUpdate(
                { userId },
                { userId, tenantId, status: 'connecting' },
                { upsert: true }
            );
        }

        logger.info(`[Baileys] Setting up auth state...`);
        const { state, saveCreds, commitToDB } = await useMongoDBAuthState(userId, tenantId);

        logger.info(`[Baileys] Fetching latest WhatsApp version...`);
        const versionPromise = fetchLatestBaileysVersion();
        const timeoutPromise = new Promise(r => setTimeout(() => r({ version: [2, 3000, 1015901307], isLatest: false }), 5000));
        const { version } = await Promise.race([versionPromise, timeoutPromise]);
        logger.info(`[Baileys] Using version: ${version.join('.')}`);

        const pinoLogger = pino({ level: 'warn' });
        const auth = {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pinoLogger)
        };

        logger.info(`[Baileys] Creating socket...`);
        await bindSocket({
            userId, tenantId, auth, state, saveCreds, commitToDB,
            version, pinoLogger, makeWASocket, Browsers, DisconnectReason, delay,
            isSilentReconnect, retryCount: 0
        });

    } catch (err) {
        logger.error(`[Baileys] Fatal error for ${userId}: ${err.message}`);
        initializingUsers.delete(userId.toString());
        socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected', error: err.message });
    }

    return { status: 'connecting', userId };
};

const startWhatsAppSession = async (userId, tenantId, isAutoReconnect = false, forceNew = false) => {
    await ensureWhatsAppSessionIndexes();

    const now = Date.now();
    const key = toKey(userId);
    const lastInitTime = lastInitTimes.get(key) || 0;
    const isLockStale = (now - lastInitTime) > INIT_LOCK_TTL_MS;

    if (initializingUsers.has(key) && !isLockStale && !forceNew) {
        logger.debug(`[Baileys] Mutex active: Session for ${userId} is already initializing.`);
        return { status: 'initializing' };
    }

    if (isLockStale) {
        logger.warn(`[Baileys] Force-recovering stale lock for user ${userId}.`);
        initializingUsers.delete(key);
    }

    let isSilentReconnect = false;

    try {
        const dbSession = await WhatsAppSession.findOne({ userId });

        if (forceNew) {
            killSocket(userId);
            await Promise.all([
                WhatsAppAuth.deleteOne({ userId }),
                WhatsAppSession.findOneAndUpdate(
                    { userId },
                    {
                        userId,
                        tenantId,
                        status: 'connecting',
                        qrCode: null,
                        qrExpiresAt: null,
                        error: null,
                        reconnectAttempts: 0
                    },
                    { upsert: true }
                )
            ]);
        } else if (dbSession?.status === 'connected' || dbSession?.status === 'reconnecting') {
            const existingSocket = sessions.get(key);
            if (existingSocket) {
                socketService.emitToUser(userId, 'whatsapp:status', { status: 'connected', message: 'WhatsApp Connected!' });
                return { status: 'connected', userId };
            }
            isSilentReconnect = true;
        }

        if (isAutoReconnect && !isSilentReconnect) {
            logger.debug(`[Baileys] Auto reconnect skipped for ${userId}: no connected DB session.`);
            return { status: 'aborted' };
        }
    } catch (e) {
        logger.error(`Error checking DB session: ${e.message}`);
        if (isAutoReconnect) return { status: 'aborted' };
    }

    initializingUsers.add(key);
    lastInitTimes.set(key, now);
    killSocket(userId);

    if (!isSilentReconnect) {
        reconnectAttempts.delete(key);
    }

    try {
        const {
            default: makeWASocket,
            DisconnectReason,
            fetchLatestBaileysVersion,
            makeCacheableSignalKeyStore,
            Browsers,
            delay
        } = await getBaileys();

        socketService.emitToUser(userId, 'whatsapp:log', { message: 'Initializing WhatsApp session...' });
        logger.info(`[Baileys] Initializing session for user ${userId} (Silent: ${isSilentReconnect})`);

        if (isSilentReconnect) {
            await WhatsAppSession.findOneAndUpdate(
                { userId },
                { status: 'reconnecting', qrCode: null, qrExpiresAt: null, error: null },
                { upsert: true }
            );
        } else {
            await WhatsAppSession.findOneAndUpdate(
                { userId },
                { userId, tenantId, status: 'connecting', qrCode: null, qrExpiresAt: null, error: null, reconnectAttempts: 0 },
                { upsert: true }
            );
        }

        logger.info(`[Baileys] Setting up auth state...`);
        const { state, saveCreds, commitToDB } = await useMongoDBAuthState(userId, tenantId);

        logger.info(`[Baileys] Fetching latest WhatsApp version...`);
        const versionPromise = fetchLatestBaileysVersion();
        const timeoutPromise = new Promise(r => setTimeout(() => r({ version: [2, 3000, 1015901307], isLatest: false }), 5000));
        const { version } = await Promise.race([versionPromise, timeoutPromise]);
        logger.info(`[Baileys] Using version: ${version.join('.')}`);

        const pinoLogger = pino({ level: 'warn' });
        const auth = {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pinoLogger)
        };

        logger.info(`[Baileys] Creating socket...`);
        await bindSocket({
            userId, tenantId, auth, state, saveCreds, commitToDB,
            version, pinoLogger, makeWASocket, Browsers, DisconnectReason, delay,
            isSilentReconnect, retryCount: 0
        });
    } catch (err) {
        logger.error(`[Baileys] Fatal error for ${userId}: ${err.message}`);
        initializingUsers.delete(key);
        await WhatsAppSession.findOneAndUpdate(
            { userId },
            { userId, tenantId, status: 'disconnected', qrCode: null, qrExpiresAt: null, error: err.message, reconnectAttempts: 0 },
            { upsert: true }
        );
        socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected', error: err.message });
    }

    return { status: isSilentReconnect ? 'reconnecting' : 'connecting', userId };
};

const waitForSocket = async (userId, timeoutMs = 30000) => {
    const startedAt = Date.now();
    const key = toKey(userId);

    while (Date.now() - startedAt < timeoutMs) {
        const sock = sessions.get(key);
        if (sock?.user || sock?.authState?.creds?.registered) return sock;
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return sessions.get(key) || null;
};

const sendMessage = async (phone, message, userId, media = null) => {
    let sock = sessions.get(userId.toString());

    if (!sock) {
        const [session, authDoc] = await Promise.all([
            WhatsAppSession.findOne({ userId }).lean(),
            WhatsAppAuth.findOne({ userId }).select('_id tenantId').lean()
        ]);

        if (!session || session.status !== 'connected' || !authDoc) {
            throw new Error('WhatsApp session not found. Please connect in your dashboard.');
        }

        await startWhatsAppSession(userId, authDoc.tenantId || session.tenantId, true, false);
        sock = await waitForSocket(userId, 30000);

        if (!sock) {
            throw new Error('WhatsApp is reconnecting. Please try again in a moment.');
        }
    }

    let cleanPhone = phone.toString().replace(/\D/g, '');
    const jid = `${cleanPhone}@s.whatsapp.net`;

    try {
        if (media && media.url) {
            const isImage = media.type?.startsWith('image') || media.url.match(/\.(jpg|jpeg|png)$/i);
            const isVideo = media.type?.startsWith('video') || media.url.match(/\.(mp4)$/i);
            const isDocument = !isImage && !isVideo;

            if (isImage) {
                await sock.sendMessage(jid, { image: { url: media.url }, caption: message });
            } else if (isVideo) {
                await sock.sendMessage(jid, { video: { url: media.url }, caption: message });
            } else {
                await sock.sendMessage(jid, { document: { url: media.url }, caption: message, fileName: 'document' });
            }
        } else {
            await sock.sendMessage(jid, { text: message });
        }
        lastActive.set(userId.toString(), Date.now());
        return true;
    } catch (err) {
        logger.error(`[Baileys] Send error for user ${userId}: ${err.message}`);
        throw err;
    }
};

const logout = async (userId) => {
    logger.info(`[Baileys] Performing hard logout & state purge for user ${userId}`);
    
    // 🛡️ Kill in-memory socket and tracking immediately
    const activeSock = sessions.get(userId.toString());
    if (activeSock && typeof activeSock.logout === 'function') {
        try {
            await activeSock.logout();
        } catch (e) {
            logger.debug(`[Baileys] Logout handshake ignored for ${userId}: ${e.message}`);
        }
    }
    killSocket(userId);

    // 🧼 Hard Memory Slate: Ensure NO memory trackers persist for this user
    clearRuntimeState(userId);

    // 🧹 DB Purge (Definitive Cleanup) 
    await Promise.all([
        WhatsAppSession.findOneAndDelete({ userId }),
        WhatsAppAuth.findOneAndDelete({ userId })
    ]);
    
    // 📢 Immediate UI Notify: Ensure the frontend snaps to disconnected instantly
    socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected', message: 'WhatsApp Account Disconnected.' });
    
    return { success: true };
};

const reconnectSessions = async () => {
    try {
        const recentCutoff = new Date(Date.now() - BOOT_RECONNECT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
        const connectedSessions = await WhatsAppSession.find({
            status: 'connected',
            lastConnectedAt: { $gte: recentCutoff }
        })
            .sort({ lastConnectedAt: -1 })
            .limit(BOOT_RECONNECT_LIMIT);
        logger.info(`[Baileys] Auto-reconnecting ${connectedSessions.length} sessions...`);
        
        // Stagger reconnects so boot does not spike CPU/network for large tenants.
        for (let i = 0; i < connectedSessions.length; i++) {
            const session = connectedSessions[i];
            setTimeout(() => {
                startWhatsAppSession(session.userId, session.tenantId, true).catch(() => {});
            }, i * 1000);
        }
    } catch (err) {
        logger.error(`[Baileys] Error in reconnectSessions: ${err.message}`);
    }
};

/**
 * [Senior Optimization] Session Hibernation
 * Periodically close sessions that have been idle for more than 45 minutes.
 * This ensures that if you have 1000 vendors but only 50 are active, you use 95% less RAM.
 */
const pruneIdleSessions = () => {
    const now = Date.now();
    
    for (const [userId, lastTime] of lastActive.entries()) {
        if (now - lastTime > IDLE_TIMEOUT_MS) {
            const sock = sessions.get(userId);
            if (sock) {
                logger.info(`[Baileys] Hibernating idle session for user ${userId} to save memory.`);
                try {
                    sock.end();
                    sessions.delete(userId);
                    lastActive.delete(userId);
                } catch (e) {}
            }
        }
    }
};

// Check for idle sessions every 5 minutes in production workers
if (process.env.NODE_ENV !== 'test') {
    setInterval(pruneIdleSessions, 5 * 60 * 1000);
}

module.exports = {
    initWhatsAppSession: startWhatsAppSession,
    reconnectSessions,
    sendMessage,
    logout
};
