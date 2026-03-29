const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

class SocketService {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // userId -> Set of socketIds
    }

    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : true,
                credentials: true
            }
        });

        // Authentication Middleware
        this.io.use((socket, next) => {
            try {
                const cookies = cookie.parse(socket.handshake.headers.cookie || '');
                const token = cookies.accessToken || socket.handshake.auth?.token;

                if (!token) {
                    return next(new Error('Authentication error: Token missing'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.TOKEN_SECRET);
                socket.user = decoded;
                next();
            } catch (err) {
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket) => {
            const userId = String(socket.user.id || socket.user._id);
            
            // Join a private room for this user
            socket.join(`user:${userId}`);
            
            // Track socket for this user
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(socket.id);

            // console.log(`User ${userId} connected via socket ${socket.id}`);

            socket.on('disconnect', () => {
                const userSocks = this.userSockets.get(userId);
                if (userSocks) {
                    userSocks.delete(socket.id);
                    if (userSocks.size === 0) {
                        this.userSockets.delete(userId);
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

    // For later implementation with Redis if needed
    emitToTenant(tenantId, event, data) {
        // Implementation would require users to join a tenant room on connection
    }
}

const socketService = new SocketService();
module.exports = socketService;
