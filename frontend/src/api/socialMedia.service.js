import axiosInstance from './axiosInstance';

const socialMediaService = {
    getOAuthUrl: async () => {
        const response = await axiosInstance.get('/social-media/oauth/url');
        return response.data;
    },
    getAccounts: async () => {
        const response = await axiosInstance.get('/social-media/accounts');
        return response.data;
    },
    disconnectAccount: async (id) => {
        const response = await axiosInstance.delete(`/social-media/accounts/${id}`);
        return response.data;
    },
    getPosts: async (params = {}) => {
        const response = await axiosInstance.get('/social-media/posts', { params });
        return response.data;
    },
    createPost: async (formData) => {
        const response = await axiosInstance.post('/social-media/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    retryPost: async (id) => {
        const response = await axiosInstance.post(`/social-media/posts/${id}/retry`);
        return response.data;
    },
    deletePost: async (id) => {
        const response = await axiosInstance.delete(`/social-media/posts/${id}`);
        return response.data;
    },
    generateCaption: async (payload) => {
        const response = await axiosInstance.post('/social-media/caption/generate', payload);
        return response.data;
    },
    getWorkerHealth: async () => {
        const response = await axiosInstance.get('/social-media/health');
        return response.data;
    }
};

export default socialMediaService;
