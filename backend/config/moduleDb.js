const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connections = {};

function getModuleConnection(name, envKeys = []) {
    if (connections[name]) return connections[name];

    const moduleUri = envKeys.map(key => process.env[key]).find(Boolean);
    if (String(process.env.NODE_ENV || '').toLowerCase() === 'test' && !moduleUri) {
        connections[name] = mongoose.connection;
        return connections[name];
    }

    const uri = moduleUri || process.env.MONGO_URI || process.env.MONGODB_URI;

    const connection = mongoose.createConnection(uri, {
        maxPoolSize: Number(process.env.MODULE_DB_POOL_SIZE || 10),
        serverSelectionTimeoutMS: 10000
    });

    connection.on('connected', () => logger.info(`[${name}] MongoDB connected`));
    connection.on('error', err => logger.error(`[${name}] MongoDB error: ${err.message}`));

    connections[name] = connection;
    return connection;
}

function getChatConnection() {
    return getModuleConnection('chat', ['MONDO_DB_URL_CHAT', 'MONGO_DB_URL_CHAT', 'MONGO_URI_CHAT']);
}

function getTaskConnection() {
    return getModuleConnection('task', ['MONDO_DB_URL_TASK', 'MONGO_DB_URL_TASK', 'MONGO_URI_TASK']);
}

function getSocialMediaConnection() {
    return getModuleConnection('social_media', ['MONGO_DB_URL_SOCIAL_MEDIA', 'MONGO_URI_SOCIAL_MEDIA']);
}

async function closeModuleConnections() {
    await Promise.allSettled(Object.values(connections).map(connection => connection.close()));
    Object.keys(connections).forEach(key => delete connections[key]);
}

module.exports = {
    getChatConnection,
    getTaskConnection,
    getSocialMediaConnection,
    closeModuleConnections
};
