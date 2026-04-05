import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';
import campaignService from '../api/campaign.service';

const OutreachContext = createContext();

export const OutreachProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
    const [qrCode, setQrCode] = useState(null);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [logs, setLogs] = useState([]); // 🛡️ Diagnostic History

    const whatsappStatusRef = React.useRef('disconnected'); // 🛡️ Ref to fix closure bugs inside socket listeners
    const lastToastRef = React.useRef(null); // 🛡️ Ref to debounce duplicate toasts
    const isInitialMountRef = React.useRef(true); // 🛡️ Ref to silence toasts on login

    // Helper to add timestamped logs
    const addLog = React.useCallback((message) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [{ time, message }, ...prev].slice(0, 15));
    }, []);

    const fetchStatus = React.useCallback(() => {
        if (!user) return;
        campaignService.getWhatsAppStatus()
            .then(res => {
                if (res.success) {
                    whatsappStatusRef.current = res.status;
                    setWhatsappStatus(res.status);
                    
                    if (isInitialMountRef.current) {
                        lastToastRef.current = res.status;
                        isInitialMountRef.current = false;
                    }

                    if (res.status === 'qr_pending') {
                        setQrCode(res.qrCode);
                    } else if (res.status === 'connected') {
                        setQrCode(null);
                    }
                }
            })
            .catch(err => console.error('Failed to fetch WhatsApp status:', err));
    }, [user]);

    useEffect(() => {
        if (socket && user) {
            fetchStatus();

            socket.on('whatsapp:status', (data) => {
                const nextStatus = data.status;
                
                if (data.message && lastToastRef.current !== nextStatus) {
                    toast.success(data.message, {
                        icon: data.status === 'connected' ? '✅' : '📲',
                        id: 'whatsapp-status-toast'
                    });
                    lastToastRef.current = nextStatus;
                }

                whatsappStatusRef.current = nextStatus;
                setWhatsappStatus(nextStatus);
                
                if (nextStatus === 'connected' || nextStatus === 'disconnected') {
                    setQrCode(null);
                }
            });

            socket.on('whatsapp:qr', (data) => {
                setQrCode(data.qr);
                setWhatsappStatus('qr_pending');
                whatsappStatusRef.current = 'qr_pending';
            });

            socket.on('whatsapp:log', (data) => {
                addLog(data.message);
            });

            return () => {
                socket.off('whatsapp:status');
                socket.off('whatsapp:qr');
                socket.off('whatsapp:log');
            };
        }
    }, [socket, user, fetchStatus, addLog]);

    const value = {
        qrCode,
        whatsappStatus,
        isSocketConnected: !!socket?.connected,
        isSyncing: syncStatus === 'syncing',
        syncStatus,
        logs,
        addLog,
        fetchStatus
    };

    return (
        <OutreachContext.Provider value={value}>
            {children}
        </OutreachContext.Provider>
    );
};

export const useOutreach = () => {
    const context = useContext(OutreachContext);
    if (!context) {
        throw new Error('useOutreach must be used within an OutreachProvider');
    }
    return context;
};
