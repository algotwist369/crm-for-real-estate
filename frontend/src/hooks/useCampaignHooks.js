import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import campaignService from '../api/campaign.service';
import toast from 'react-hot-toast';

export const useCampaigns = () => {
    return useQuery({
        queryKey: ['campaigns'],
        queryFn: campaignService.getCampaigns,
    });
};

export const useCampaignStats = (campaignId) => {
    return useQuery({
        queryKey: ['campaign-stats', campaignId],
        queryFn: () => campaignService.getCampaignStats(campaignId),
        enabled: !!campaignId,
        refetchInterval: 5000, // Poll stats every 5 seconds for live updates
    });
};

export const useCreateCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: campaignService.createCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries(['campaigns']);
            toast.success('Campaign created successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create campaign');
        }
    });
};

export const useWhatsAppStatus = () => {
    return useQuery({
        queryKey: ['whatsapp-status'],
        queryFn: campaignService.getWhatsAppStatus,
        refetchOnWindowFocus: false, // 🛡️ [Performance] No more spam when clicking back to browser
        refetchOnMount: true,
        retry: 1,
        staleTime: 5000 // 🛡️ Keep status fresh but don't hammer the API
    });
};

export const useWhatsAppInit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: campaignService.initWhatsApp,
        onMutate: async () => {
            // Optimistically update the UI to "connecting" state
            await queryClient.cancelQueries(['whatsapp-status']);
            queryClient.setQueryData(['whatsapp-status'], (old) => ({
                ...old,
                status: 'connecting'
            }));
            toast.loading('Initializing WhatsApp Handshake...', { id: 'whatsapp-init' });
        },
        onSuccess: () => {
            toast.success('Handshake Request Sent', { id: 'whatsapp-init' });
            queryClient.invalidateQueries(['whatsapp-status']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to initialize WhatsApp', { id: 'whatsapp-init' });
        }
    });
};

export const useWhatsAppRegenerate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: campaignService.regenerateWhatsAppQR,
        onMutate: async () => {
            await queryClient.cancelQueries(['whatsapp-status']);
            queryClient.setQueryData(['whatsapp-status'], (old) => ({
                ...old,
                status: 'connecting'
            }));
            toast.loading('Regenerating Handshake...', { id: 'whatsapp-regen' });
        },
        onSuccess: () => {
            toast.success('Regeneration Requested', { id: 'whatsapp-regen' });
            queryClient.invalidateQueries(['whatsapp-status']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to regenerate WhatsApp QR', { id: 'whatsapp-regen' });
        }
    });
};

export const useWhatsAppLogout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: campaignService.logoutWhatsApp,
        onSuccess: () => {
            queryClient.setQueryData(['whatsapp-status'], (old) => ({
                ...old,
                status: 'disconnected'
            }));
            queryClient.invalidateQueries(['whatsapp-status']);
            toast.success('Logged out from WhatsApp');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to logout WhatsApp');
        }
    });
};

export const useEmailConfig = (enabled = true) => {
    return useQuery({
        queryKey: ['email-config'],
        queryFn: campaignService.getEmailConfig,
        enabled: enabled, // 🛡️ [Lazy Loading] Only fetch when tab is active
        refetchOnWindowFocus: false,
        staleTime: 60000 // Configuration doesn't change often
    });
};

export const useUpdateEmailConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: campaignService.updateEmailConfig,
        onSuccess: () => {
            queryClient.invalidateQueries(['email-config']);
            toast.success('Email configuration updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update email configuration');
        }
    });
};

export const useUploadCampaignMedia = () => {
    return useMutation({
        mutationFn: campaignService.uploadMedia,
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to upload media');
        }
    });
};
