import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';
import campaignService from '../api/campaign.service';

const OutreachContext = createContext();

export const OutreachProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket, isConnected: isSocketConnected } = useSocket();
    const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
    const [qrCode, setQrCode] = useState(null);

    useEffect(() => {
        if (user) {
            // Fetch initial status from DB
            campaignService.getWhatsAppStatus()
                .then(res => {
                    if (res.success) {
                        setWhatsappStatus(res.status);
                        if (res.status === 'qr_pending') {
                            setQrCode(res.qrCode);
                        }
                    }
                })
                .catch(err => console.error('Failed to fetch WhatsApp status:', err));
        }
    }, [user]);

    useEffect(() => {
        if (socket && isSocketConnected) {
            const handleQr = (data) => {
                console.log('Outreach Socket: QR Received');
                setQrCode(data.qr);
                setWhatsappStatus('qr_pending');
            };

            const handleStatus = (data) => {
                console.log('Outreach Socket: Status Update', data.status, data.message || '');
                setWhatsappStatus(data.status);
                
                if (data.message) {
                    toast.success(data.message, {
                        style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' }
                    });
                }

                if (data.error) {
                    toast.error(data.error, {
                        style: { background: '#18181b', color: '#fff', border: '1px solid #ef4444' }
                    });
                }

                if (data.status === 'connected') {
                    setQrCode(null);
                }
                if (data.status === 'disconnected') {
                    setQrCode(null);
                }
            };

            socket.on('whatsapp:qr', handleQr);
            socket.on('whatsapp:status', handleStatus);

            return () => {
                socket.off('whatsapp:qr', handleQr);
                socket.off('whatsapp:status', handleStatus);
            };
        }
    }, [socket, isSocketConnected]);

    return (
        <OutreachContext.Provider value={{
            whatsappStatus,
            qrCode,
            setWhatsappStatus,
            setQrCode,
            isSocketConnected
        }}>
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
