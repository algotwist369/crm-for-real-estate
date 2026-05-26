const { Server } = require('socket.io');
const { verifyToken } = require('../utils/generateToken');
const cookie = require('cookie');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redisConfig, getRedisConnection } = require('./queue.service');
const Redis = require('ioredis');
const logger = require('../utils/logger');
const User = require('../model/user.model');

class SocketService {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // userId -> Set of socketIds
    }

    init(server) {
        const allowedOrigins = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) 
            : ['https://real-crm-two.vercel.app', 'http://localhost:5173'];

        this.io = new Server(server, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin) return callback(null, true);
                    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
                        callback(null, true);
                    } else {
                        callback(new Error('CORS not allowed for origin: ' + origin));
                    }
                },
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling'], // Explicitly allow both
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Socket Redis adapter is only needed for multi-process/socket fanout.
        // Keep it opt-in to avoid exhausting small Redis plans during local/single-worker runs.
        if (process.env.SOCKET_REDIS_ADAPTER !== 'true') {
            logger.info('Socket.io Redis adapter disabled; using in-memory sockets.');
        } else {
        try {
            const pubClient = getRedisConnection();
            this.subClient = pubClient.duplicate(); // Sub requires a dedicated connection because it blocks
            
            let fallbackTriggered = false;
            const activateFallback = (err) => {
                if (fallbackTriggered) return;
                fallbackTriggered = true;
                logger.warn(`Redis Adapter Failed (${err.message}). Falling back to In-Memory Sockets.`);
                
                // Disconnect failing redis sub client securely
                if (this.subClient) {
                    this.subClient.quit().catch(() => {}).finally(() => { this.subClient = null; });
                }
                
                // Nullify adapter to allow Socket.io to route locally (Standard memory mode)
                this.io.adapter(require('socket.io-adapter').Adapter); 
            };

            this.subClient.on('error', (err) => {
                logger.error('Socket.io Redis Sub Error: ' + err.message);
                if (err.message.includes('max number of clients reached') || err.message.includes('ECONNREFUSED')) {
                    activateFallback(err);
                }
            });

            pubClient.on('error', (err) => {
                if (err.message.includes('max number of clients reached') || err.message.includes('ECONNREFUSED')) {
                    activateFallback(err);
                }
            });

            this.io.adapter(createAdapter(pubClient, this.subClient));
        } catch (setupErr) {
            logger.error(`Critical error configuring Redis Sockets: ${setupErr.message}. Defaulting to Memory Sockets.`);
        }
        }

        // Authentication Middleware
        this.io.use((socket, next) => {
            try {
                const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                // The auth system sets 'token' cookie, not 'accessToken'
                // Fallback to handshake.auth.token if cookie is missing (e.g. cross-domain issues)
                const token = cookies.token || socket.handshake.auth?.token;

                if (!token) {
                    return next(new Error('Authentication error: Token missing'));
                }

                // Use the custom verifyToken from our utils for consistency with the rest of the backend
                const decoded = verifyToken(token);
                socket.user = decoded;
                next();
            } catch (err) {
                logger.error('Socket authentication failed: ' + err.message);
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', async (socket) => {
            // Our JWT payload uses 'sub' for userId, not 'id' or '_id'
            const userId = String(socket.user.sub);
            
            if (!userId || userId === 'undefined') {
                logger.error('Socket connected with undefined sub in token');
                return socket.disconnect();
            }

            // Join a private room for this user
            socket.join(`user:${userId}`);

            const dbUser = await User.findOne({ _id: userId, is_active: true, is_deleted: false })
                .select('_id role tenant_id')
                .lean()
                .catch(() => null);
            if (!dbUser) return socket.disconnect();

            const tenantId = String(dbUser.tenant_id || (['admin', 'super_admin'].includes(dbUser.role) ? dbUser._id : ''));
            socket.authUser = { ...dbUser, tenantId };
            if (tenantId) socket.join(`tenant:${tenantId}`);
            
            // Track socket for this user
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(socket.id);

            socket.to(`tenant:${tenantId}`).emit('presence:update', { userId, online: true });

            this.registerCollaborationHandlers(socket);

            // console.log(`User ${userId} connected via socket ${socket.id}`);

            socket.on('disconnect', () => {
                const userSocks = this.userSockets.get(userId);
                if (userSocks) {
                    userSocks.delete(socket.id);
                    if (userSocks.size === 0) {
                        this.userSockets.delete(userId);
                        socket.to(`tenant:${tenantId}`).emit('presence:update', { userId, online: false });
                    }
                }
                // console.log(`User ${userId} disconnected from socket ${socket.id}`);
            });
        });

        return this.io;
    }

    emitToUser(userId, event, data) {
        if (!this.io) return false;
        this.io.to(`user:${String(userId)}`).emit(event, data);
        return true;
    }

    emitToMultipleUsers(userIds, event, data) {
        if (!this.io || !Array.isArray(userIds)) return false;
        userIds.forEach(id => {
            this.io.to(`user:${String(id)}`).emit(event, data);
        });
        return true;
    }

    emitToRoom(room, event, data) {
        if (!this.io || !room) return false;
        this.io.to(room).emit(event, data);
        return true;
    }

    getOnlineUserIds() {
        return Array.from(this.userSockets.keys());
    }

    registerCollaborationHandlers(socket) {
        socket.on('chat:join', async ({ conversationId } = {}) => {
            try {
                if (!conversationId) return;
                const ChatConversation = require('../model/chatConversation.model');
                const conversation = await ChatConversation.findOne({
                    _id: conversationId,
                    tenantId: socket.authUser.tenantId,
                    'members.userId': socket.user.sub,
                    isArchived: false
                }).select('_id').lean();
                if (conversation) socket.join(`chat:${conversationId}`);
            } catch (err) {
                logger.debug(`chat:join ignored: ${err.message}`);
            }
        });

        socket.on('chat:typing', async ({ conversationId, typing } = {}) => {
            try {
                if (!conversationId) return;
                const ChatConversation = require('../model/chatConversation.model');
                const conversation = await ChatConversation.findOne({
                    _id: conversationId,
                    tenantId: socket.authUser.tenantId,
                    'members.userId': socket.user.sub,
                    isArchived: false
                }).select('_id').lean();
                if (!conversation) return;
                socket.to(`chat:${conversationId}`).emit('chat:typing', {
                    conversationId,
                    userId: socket.user.sub,
                    typing: Boolean(typing)
                });
            } catch (err) {
                logger.debug(`chat:typing ignored: ${err.message}`);
            }
        });

        socket.on('task:join-workspace', async ({ workspaceId } = {}) => {
            try {
                if (!workspaceId) return;
                const TaskWorkspace = require('../model/taskWorkspace.model');
                const workspace = await TaskWorkspace.findOne({
                    _id: workspaceId,
                    tenantId: socket.authUser.tenantId,
                    isArchived: false,
                    $or: [
                        { members: socket.user.sub },
                        { createdBy: socket.user.sub }
                    ]
                }).select('_id').lean();
                if (workspace) socket.join(`task-workspace:${workspaceId}`);
            } catch (err) {
                logger.debug(`task:join-workspace ignored: ${err.message}`);
            }
        });
    }

    // For later implementation with Redis if needed
    emitToTenant(tenantId, event, data) {
        // Implementation would require users to join a tenant room on connection
    }

    async close() {
        if (this.io) {
            this.io.close();
            this.io = null;
        }
        if (this.subClient) {
            try {
                await this.subClient.quit();
                this.subClient = null;
            } catch (err) {
                logger.error('Error closing Socket.io Redis Sub Client: ' + err.message);
            }
        }
    }
}

const socketService = new SocketService();
module.exports = socketService;
