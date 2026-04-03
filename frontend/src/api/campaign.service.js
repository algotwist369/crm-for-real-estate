import axiosInstance from './axiosInstance';

const campaignService = {
    getCampaigns: async () => {
        const response = await axiosInstance.get('/campaigns');
        return response.data;
    },
    getCampaignStats: async (campaignId) => {
        const response = await axiosInstance.get(`/campaigns/${campaignId}/stats`);
        return response.data;
    },
    createCampaign: async (campaignData) => {
        const response = await axiosInstance.post('/campaigns', campaignData);
        return response.data;
    },
    getWhatsAppStatus: async () => {
        const response = await axiosInstance.get('/campaigns/whatsapp/status');
        return response.data;
    },
    initWhatsApp: async () => {
        const response = await axiosInstance.post('/campaigns/whatsapp/init');
        return response.data;
    },
    regenerateWhatsAppQR: async () => {
        const response = await axiosInstance.post('/campaigns/whatsapp/regenerate');
        return response.data;
    },
    logoutWhatsApp: async () => {
        const response = await axiosInstance.post('/campaigns/whatsapp/logout');
        return response.data;
    },
    getEmailConfig: async () => {
        const response = await axiosInstance.get('/campaigns/email/config');
        return response.data;
    },
    updateEmailConfig: async (configData) => {
        const response = await axiosInstance.post('/campaigns/email/config', configData);
        return response.data;
    },
    uploadMedia: async (formData) => {
        const response = await axiosInstance.post('/campaigns/upload-media', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export default campaignService;
