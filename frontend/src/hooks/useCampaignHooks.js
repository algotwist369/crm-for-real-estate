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

export const useWhatsAppInit = () => {
    return useMutation({
        mutationFn: campaignService.initWhatsApp,
        onSuccess: () => {
            toast.success('WhatsApp initialization started');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to initialize WhatsApp');
        }
    });
};

export const useWhatsAppRegenerate = () => {
    return useMutation({
        mutationFn: campaignService.regenerateWhatsAppQR,
        onSuccess: () => {
            toast.success('WhatsApp QR regeneration started');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to regenerate WhatsApp QR');
        }
    });
};

export const useWhatsAppLogout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: campaignService.logoutWhatsApp,
        onSuccess: () => {
            queryClient.invalidateQueries(['whatsapp-session']);
            toast.success('Logged out from WhatsApp');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to logout WhatsApp');
        }
    });
};

export const useEmailConfig = () => {
    return useQuery({
        queryKey: ['email-config'],
        queryFn: campaignService.getEmailConfig,
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
