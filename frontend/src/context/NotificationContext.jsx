import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const socketRef = useRef(null);
    const seenNotifications = useRef(new Set());

    const API_URL = import.meta.env.VITE_API_URL || '';

    // -- Queries --
    const { 
        data: notificationData, 
        isLoading, 
        refetch 
    } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/notifications?limit=50`, {
                credentials: 'include'
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const notifications = notificationData?.notifications || [];
    const unreadCount = notificationData?.pagination?.unread || 0;

    // -- Mutations --
    const markAsReadMutation = useMutation({
        mutationFn: async (id) => {
            const res = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                credentials: 'include'
            });
            return res.json();
        },
        onSuccess: (result, id) => {
            if (result.success) {
                queryClient.setQueryData(['notifications'], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        notifications: old.notifications.map(n => n._id === id ? { ...n, is_read: true } : n),
                        pagination: { ...old.pagination, unread: Math.max(0, old.pagination.unread - 1) }
                    };
                });
            }
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PATCH',
                credentials: 'include'
            });
            return res.json();
        },
        onSuccess: (result) => {
            if (result.success) {
                queryClient.setQueryData(['notifications'], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        notifications: old.notifications.map(n => ({ ...n, is_read: true })),
                        pagination: { ...old.pagination, unread: 0 }
                    };
                });
                toast.success('All marked as read');
            }
        }
    });

    const clearAllMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/notifications/clear-all`, {
                method: 'DELETE',
                credentials: 'include'
            });
            return res.json();
        },
        onSuccess: (result) => {
            if (result.success) {
                queryClient.setQueryData(['notifications'], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        notifications: [],
                        pagination: { ...old.pagination, unread: 0, total: 0 }
                    };
                });
                toast.success('Notifications cleared');
            }
        }
    });

    const deleteOneMutation = useMutation({
        mutationFn: async (id) => {
            const res = await fetch(`${API_URL}/notifications/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            return res.json();
        },
        onSuccess: (result, id) => {
            if (result.success) {
                queryClient.setQueryData(['notifications'], (old) => {
                    if (!old) return old;
                    const deletedNotif = old.notifications.find(n => n._id === id);
                    const isUnread = deletedNotif?.is_read === false;
                    return {
                        ...old,
                        notifications: old.notifications.filter(n => n._id !== id),
                        pagination: { 
                            ...old.pagination, 
                            unread: isUnread ? Math.max(0, old.pagination.unread - 1) : old.pagination.unread,
                            total: Math.max(0, old.pagination.total - 1)
                        }
                    };
                });
            }
        }
    });

    // -- Socket Lifecycle --
    useEffect(() => {
        if (user) {
            if (!socketRef.current || !socketRef.current.connected) {
                socketRef.current = io(API_URL, {
                    withCredentials: true,
                    transports: ['websocket', 'polling']
                });
            }

            const socket = socketRef.current;
            socket.off('new_notification');
            socket.on('new_notification', (notification) => {
                if (seenNotifications.current.has(notification._id)) return;
                seenNotifications.current.add(notification._id);

                // Update Query Cache instantly
                queryClient.setQueryData(['notifications'], (old) => {
                    if (!old) return { notifications: [notification], pagination: { unread: 1, total: 1 } };
                    if (old.notifications.some(n => n._id === notification._id)) return old;
                    return {
                        ...old,
                        notifications: [notification, ...old.notifications],
                        pagination: { 
                            ...old.pagination, 
                            unread: (old.pagination.unread || 0) + 1,
                            total: (old.pagination.total || 0) + 1
                        }
                    };
                });
                
                toast.success(notification.title, {
                    id: notification._id, 
                    description: notification.message,
                    duration: 5000,
                    position: 'top-right',
                    style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' }
                });

                if (Notification.permission === 'granted') {
                    new Notification(notification.title, { body: notification.message });
                }
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
            };
        }
    }, [user, API_URL, queryClient]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading: isLoading,
            markAsRead: (id) => markAsReadMutation.mutate(id),
            markAllRead: () => markAllReadMutation.mutate(),
            clearAll: () => clearAllMutation.mutate(),
            deleteOne: (id) => deleteOneMutation.mutate(id),
            refresh: refetch
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};
