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

/**
 * Custom MongoDB Auth Store for Baileys
 * This allows 1000+ sessions to be stored in the DB instead of as separate files.
 */
const useMongoDBAuthState = async (userId, tenantId, initAuthCreds) => {
    let data = await WhatsAppAuth.findOne({ userId });
    
    let creds;
    if (!data) {
        creds = initAuthCreds();
        data = await WhatsAppAuth.create({ userId, tenantId, creds, keys: {} });
    } else if (!data.creds || !data.creds.noiseKey) {
        // If creds is empty or corrupted, re-initialize
        creds = initAuthCreds();
        await WhatsAppAuth.updateOne({ userId }, { creds });
        data.creds = creds;
    } else {
        // Fix Buffer conversions if stored in MongoDB as binary objects
        creds = data.creds;
    }

    const state = {
        creds,
        keys: {
            get: (type, ids) => {
                const keyData = data.keys || {};
                const result = {};
                ids.forEach(id => {
                    const value = keyData[`${type}-${id}`];
                    if (value) result[id] = value;
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
                data.keys = currentKeys; // Keep local ref updated
                await WhatsAppAuth.updateOne({ userId }, { keys: currentKeys });
            }
        }
    };

    const saveCreds = async () => {
        await WhatsAppAuth.updateOne({ userId }, { creds: state.creds });
    };

    return { state, saveCreds };
};

const initWhatsAppSession = async (userId, tenantId, isAutoReconnect = false) => {
    if (initializingUsers.has(userId.toString())) return;
    initializingUsers.add(userId.toString());

    try {
        const { 
            default: makeWASocket, 
            DisconnectReason, 
            fetchLatestBaileysVersion, 
            makeCacheableSignalKeyStore,
            initAuthCreds,
            Browsers
        } = await getBaileys();

        logger.info(`[Baileys] Initializing session for user ${userId}`);
        socketService.emitToUser(userId, 'whatsapp:status', { status: 'connecting', message: 'Connecting to WhatsApp...' });

        logger.debug(`[Baileys] Debug: Setting up auth state`);
        // 1. Setup Auth using MongoDB instead of file system to scale to 1000+ vendors
        const { state, saveCreds } = await useMongoDBAuthState(userId, tenantId, initAuthCreds);
        logger.debug(`[Baileys] Debug: Fetching latest version`);
        const { version } = await fetchLatestBaileysVersion();

        logger.debug(`[Baileys] Debug: Creating socket`);
        
        // Pass Pino logger to Baileys explicitly to prevent Winston incompatibilities
        const pinoLogger = pino({ level: 'error' }); // Only log errors to save CPU

        // Optimize Database load by caching the MongoDB key stores in-memory for fast crypto handshakes
        const auth = {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pinoLogger)
        };

        // 2. Create Socket with extreme memory flags
        const sock = makeWASocket({
            version,
            printQRInTerminal: false,
            auth,
            logger: pinoLogger,
            browser: Browsers.ubuntu('Chrome'), 
            retryRequestDelayMs: 5000, // Be more patient to reduce reconnect CPU spikes
            connectTimeoutMs: 60000,
            markOnlineOnConnect: false, // Save bandwidth
            syncFullHistory: false, // Save memory/disk by not downloading 1000s of old messages
        });

        logger.debug(`[Baileys] Debug: Tracking socket`);
        // 3. Keep track of socket and activity
        sessions.set(userId.toString(), sock);
        lastActive.set(userId.toString(), Date.now());

        logger.debug(`[Baileys] Debug: Setting up event listeners`);
        // 4. Handle Connection Updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            lastActive.set(userId.toString(), Date.now());

            if (qr) {
                logger.info(`[Baileys] QR Received for user ${userId}`);
                await WhatsAppSession.findOneAndUpdate(
                    { userId },
                    { userId, tenantId, status: 'qr_pending', qrCode: qr },
                    { upsert: true }
                );
                socketService.emitToUser(userId, 'whatsapp:qr', { qr });
                socketService.emitToUser(userId, 'whatsapp:status', { status: 'qr_pending', message: 'QR Code Generated' });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.warn(`[Baileys] Connection closed for ${userId}. Reconnect: ${shouldReconnect}`);
                
                if (!shouldReconnect) {
                    await WhatsAppSession.findOneAndUpdate({ userId }, { status: 'disconnected' });
                    socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected' });
                    sessions.delete(userId.toString());
                } else {
                    // Reconnect logic
                    setTimeout(() => initWhatsAppSession(userId, tenantId, true), 3000);
                }
            } else if (connection === 'open') {
                logger.info(`[Baileys] Connection opened for ${userId}`);
                await WhatsAppSession.findOneAndUpdate(
                    { userId },
                    { status: 'connected', qrCode: null, lastConnectedAt: new Date() }
                );
                socketService.emitToUser(userId, 'whatsapp:status', { status: 'connected', message: 'WhatsApp Connected!' });
            }
        });

        // 5. Handle Creds Update (Critical for persistence)
        sock.ev.on('creds.update', saveCreds);

        // 6. Monitor Activity
        sock.ev.on('messages.upsert', () => {
            lastActive.set(userId.toString(), Date.now());
        });

    } catch (err) {
        logger.error(`[Baileys] Fatal error for ${userId}: ${err.message}`);
        socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected', error: err.message });
    } finally {
        initializingUsers.delete(userId.toString());
    }

    return { status: 'connecting', userId };
};

const sendMessage = async (phone, message, userId, media = null) => {
    const sock = sessions.get(userId.toString());
    if (!sock) throw new Error('WhatsApp session not found. Please connect in your dashboard.');

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
        return true;
    } catch (err) {
        logger.error(`[Baileys] Send error for user ${userId}: ${err.message}`);
        throw err;
    }
};

const logout = async (userId) => {
    const sock = sessions.get(userId.toString());
    if (sock) {
        await sock.logout();
        sessions.delete(userId.toString());
    }
    await WhatsAppSession.findOneAndDelete({ userId });
    await WhatsAppAuth.findOneAndDelete({ userId });
    return { success: true };
};

const reconnectSessions = async () => {
    try {
        const connectedSessions = await WhatsAppSession.find({ status: 'connected' });
        logger.info(`[Baileys] Auto-reconnecting ${connectedSessions.length} sessions...`);
        
        // Use a staggered reconnection to prevent CPU/Network spikes for 1000+ users
        for (let i = 0; i < connectedSessions.length; i++) {
            const session = connectedSessions[i];
            setTimeout(() => {
                initWhatsAppSession(session.userId, session.tenantId, true).catch(() => {});
            }, i * 500); // 500ms delay between each connection
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
    const IDLE_TIMEOUT = 45 * 60 * 1000;
    const now = Date.now();
    
    for (const [userId, lastTime] of lastActive.entries()) {
        if (now - lastTime > IDLE_TIMEOUT) {
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
    initWhatsAppSession,
    reconnectSessions,
    sendMessage,
    logout
};
