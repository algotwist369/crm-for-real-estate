import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || '';
    
    // Improved robust URL resolution
    const getSocketUrl = () => {
        if (API_URL && API_URL.startsWith('http')) {
            return API_URL.replace(/\/api\/?$/, '');
        }
        
        // Development fallback
        if (window.location.port === '5173') {
            return 'http://localhost:5001';
        }
        
        return window.location.origin;
    };

    const SOCKET_URL = getSocketUrl();

    useEffect(() => {
        if (user) {
            console.log('Attempting Socket Connection to:', SOCKET_URL);
            if (!socketRef.current) {
                socketRef.current = io(SOCKET_URL, {
                    withCredentials: true,
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 1000,
                });
            }

            const socket = socketRef.current;

            socket.on('connect', () => {
                setIsConnected(true);
                console.log('Socket Connected:', socket.id);
            });

            socket.on('disconnect', () => {
                setIsConnected(false);
                console.log('Socket Disconnected');
            });

            socket.on('connect_error', (err) => {
                console.error('Socket Connection Error:', err.message);
                setIsConnected(false);
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
            };
        }
    }, [user, API_URL]);

    return (
        <SocketContext.Provider value={{
            socket: socketRef.current,
            isConnected
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
