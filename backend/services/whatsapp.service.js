const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const WhatsAppSession = require('../model/whatsappSession.model');
const logger = require('../utils/logger');
const socketService = require('./socket.service');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const clients = new Map(); // Store client instances per user
const initializingUsers = new Set(); // Simple lock to prevent double-init in same worker

const cleanupSessionLock = (sessionId) => {
    const sessionPath = path.resolve(process.cwd(), '.wwebjs_auth', `session-${sessionId}`);
    const filesToCleanup = ['lockfile', 'DevToolsActivePort', 'SingletonLock'];
    
    logger.info(`Checking for session locks at: ${sessionPath}`);

    if (!fs.existsSync(sessionPath)) {
        return;
    }

    filesToCleanup.forEach(file => {
        const filePath = path.join(sessionPath, file);
        if (fs.existsSync(filePath)) {
            try {
                logger.info(`Attempting to remove lock file: ${filePath}`);
                fs.chmodSync(filePath, 0o666);
                fs.unlinkSync(filePath);
                logger.info(`Successfully removed lock file: ${file}`);
            } catch (err) {
                logger.warn(`Failed to remove lock file ${file}: ${err.message}.`);
                
                if (process.platform === 'win32' && err.code === 'EBUSY') {
                    logger.info(`Resource busy. Attempting force-kill chrome.`);
                    try {
                        exec('taskkill /F /IM chrome.exe /T', (killErr) => {
                            if (killErr) logger.debug(`taskkill failed: ${killErr.message}`);
                            else logger.info(`Force-killed chrome processes.`);
                        });
                    } catch (e) {
                        logger.error(`Error during taskkill: ${e.message}`);
                    }
                }
            }
        }
    });
};

const initWhatsAppSession = async (userId, tenantId, isAutoReconnect = false) => {
    const sessionId = `session_${userId}`;
    const dataPath = path.resolve(process.cwd(), '.wwebjs_auth');
    
    if (initializingUsers.has(userId.toString())) {
        logger.warn(`User ${userId} is already initializing. Skipping.`);
        return { status: 'connecting', userId };
    }

    initializingUsers.add(userId.toString());

    try {
        socketService.emitToUser(userId, 'whatsapp:status', { status: 'connecting', message: 'Starting WhatsApp browser...' });
        logger.info(`[Worker ${process.pid}] Init WhatsApp for user ${userId}`);

        if (clients.has(userId.toString())) {
            const existingClient = clients.get(userId.toString());
            try {
                await existingClient.destroy();
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (err) {
                logger.error(`Error destroying existing client: ${err.message}`);
            }
            clients.delete(userId.toString());
        }

        cleanupSessionLock(sessionId);

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: sessionId,
                dataPath: dataPath
            }),
            puppeteer: {
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process', // Can help in low-resource/restricted environments
                    '--disable-crash-reporter', // Fixes "chrome_crashpad_handler: --database is required"
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--allow-pre-commit-input',
                    '--disable-background-networking',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-breakpad',
                    '--disable-client-side-phishing-detection',
                    '--disable-component-update',
                    '--disable-default-apps',
                    '--disable-domain-reliability',
                    '--disable-extensions',
                    '--disable-features=AudioServiceOutOfProcess,HttpsFirstBalancedModeAutoEnable',
                    '--disable-hang-monitor',
                    '--disable-ipc-flooding-protection',
                    '--disable-notifications',
                    '--disable-offer-store-unmasked-wallet-cards',
                    '--disable-popup-blocking',
                    '--disable-print-preview',
                    '--disable-prompt-on-repost',
                    '--disable-renderer-backgrounding',
                    '--disable-speech-api',
                    '--disable-sync',
                    '--hide-scrollbars',
                    '--ignore-gpu-blacklist',
                    '--metrics-recording-only',
                    '--mute-audio',
                    '--no-default-browser-check',
                    '--no-pings',
                    '--password-store=basic',
                    '--use-gl=swiftshader',
                    '--use-mock-keychain',
                    '--window-size=1280,720',
                    '--disable-web-security'
                ],
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
            }
        });

        let qrCount = 0;

        client.on('qr', async (qr) => {
            if (isAutoReconnect) {
                logger.warn(`Auto-reconnect failed for ${userId} (session expired/invalid). Destroying client to save memory.`);
                await WhatsAppSession.findOneAndUpdate({ userId }, { status: 'disconnected', qrCode: null });
                socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected', error: 'Session expired. Please manually regenerate QR code.' });
                try {
                    await client.destroy();
                } catch (e) {}
                clients.delete(userId.toString());
                return;
            }

            qrCount++;
            if (qrCount > 4) {
                logger.warn(`User ${userId} ignored the QR code. Tearing down browser instance to save CPU.`);
                await WhatsAppSession.findOneAndUpdate({ userId }, { status: 'disconnected', qrCode: null });
                socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected', error: 'QR Code expired. Please click regenerate.' });
                try {
                    await client.destroy();
                } catch (e) {}
                clients.delete(userId.toString());
                return;
            }

            logger.info(`QR RECEIVED for user ${userId}. Prompting via socket... (Attempt ${qrCount} / 4)`);
            
            await WhatsAppSession.findOneAndUpdate(
                { userId },
                { userId, tenantId, sessionId, status: 'qr_pending', qrCode: qr },
                { upsert: true }
            );
            socketService.emitToUser(userId, 'whatsapp:qr', { qr });
            socketService.emitToUser(userId, 'whatsapp:status', { status: 'qr_pending', message: 'QR Code generated!' });
        });

        client.on('ready', async () => {
            logger.info(`WhatsApp READY for user ${userId}`);
            await WhatsAppSession.findOneAndUpdate(
                { userId },
                { status: 'connected', qrCode: null, lastConnectedAt: new Date() }
            );
            socketService.emitToUser(userId, 'whatsapp:status', { status: 'connected', message: 'WhatsApp is ready!' });
        });

        client.on('authenticated', () => {
            logger.info(`WhatsApp AUTHENTICATED for user ${userId}`);
            socketService.emitToUser(userId, 'whatsapp:status', { status: 'authenticated', message: 'Session authenticated!' });
        });

        client.on('auth_failure', async (msg) => {
            logger.error(`WhatsApp AUTH FAILURE for user ${userId}: ${msg}`);
            await WhatsAppSession.findOneAndUpdate({ userId }, { status: 'disconnected', error: msg });
            socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected', error: msg });
        });

        client.on('disconnected', async (reason) => {
            logger.info(`WhatsApp DISCONNECTED for user ${userId}: ${reason}`);
            await WhatsAppSession.findOneAndUpdate({ userId }, { status: 'disconnected', lastDisconnectedAt: new Date() });
            socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected' });
            clients.delete(userId.toString());
        });

        clients.set(userId.toString(), client);
        
        logger.info(`Initializing WhatsApp client for ${userId}...`);
        
        const initTimeout = setTimeout(() => {
            if (initializingUsers.has(userId.toString())) {
                logger.error(`Init TIMEOUT for user ${userId}`);
                socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected', error: 'Init timed out.' });
                initializingUsers.delete(userId.toString());
            }
        }, 60000);

        await client.initialize();
        clearTimeout(initTimeout);
        logger.info(`Client.initialize() finished for ${userId}`);
        
    } catch (err) {
        logger.error(`FATAL: Failed to initialize WhatsApp client for ${userId}: ${err.message}`);
        socketService.emitToUser(userId, 'whatsapp:status', { status: 'disconnected', error: err.message });
        clients.delete(userId.toString());
    } finally {
        initializingUsers.delete(userId.toString());
    }

    return { status: 'connecting', userId };
};

const reconnectSessions = async () => {
    try {
        const connectedSessions = await WhatsAppSession.find({ status: 'connected' });
        logger.info(`Reconnecting ${connectedSessions.length} WhatsApp sessions...`);
        
        for (const session of connectedSessions) {
            initWhatsAppSession(session.userId, session.tenantId, true).catch(err => {
                logger.error(`Auto-reconnect failed for user ${session.userId}: ${err.message}`);
            });
        }
    } catch (err) {
        logger.error(`Error in reconnectSessions: ${err.message}`);
    }
};

const sendMessage = async (phone, message, userId, media = null) => {
    const client = clients.get(userId.toString());
    if (!client) throw new Error('WhatsApp session not found or not connected');

    // Enhanced phone number formatting for international compatibility
    let cleanPhone = phone.toString().replace(/\D/g, '');
    const formattedPhone = `${cleanPhone}@c.us`;
    
    try {
        if (media && media.url) {
            logger.info(`Sending media to ${formattedPhone} from URL: ${media.url}`);
            
            // Fetch media manually to be more robust than fromUrl
            const response = await axios.get(media.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            const base64 = buffer.toString('base64');
            const mimeType = response.headers['content-type'];
            
            const mediaObj = new MessageMedia(mimeType, base64);
            await client.sendMessage(formattedPhone, mediaObj, { caption: message });
        } else {
            await client.sendMessage(formattedPhone, message);
        }
        return true;
    } catch (error) {
        logger.error(`Error sending WhatsApp message to ${formattedPhone}: ${error.message}`);
        throw error;
    }
};

const logout = async (userId) => {
    const client = clients.get(userId.toString());
    if (client) {
        await client.logout();
        await client.destroy();
        clients.delete(userId.toString());
    }
    await WhatsAppSession.findOneAndDelete({ userId });
    return { success: true };
};

module.exports = {
    initWhatsAppSession,
    reconnectSessions,
    sendMessage,
    logout
};
