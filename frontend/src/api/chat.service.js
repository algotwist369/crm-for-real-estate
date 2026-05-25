import axiosInstance from "./axiosInstance";

export const chatService = {
    getUsers: async () => {
        const response = await axiosInstance.get("/chat/users");
        return response.data;
    },
    getConversations: async () => {
        const response = await axiosInstance.get("/chat/conversations");
        return response.data;
    },
    startDirectConversation: async (participantId) => {
        const response = await axiosInstance.post("/chat/conversations/direct", { participantId });
        return response.data;
    },
    createGroup: async (data) => {
        const response = await axiosInstance.post("/chat/conversations/group", data);
        return response.data;
    },
    getMessages: async (conversationId, params = {}) => {
        const response = await axiosInstance.get(`/chat/conversations/${conversationId}/messages`, { params });
        return response.data;
    },
    sendMessage: async (conversationId, formData, options = {}) => {
        const response = await axiosInstance.post(`/chat/conversations/${conversationId}/messages`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: options.onUploadProgress
        });
        return response.data;
    },
    markSeen: async (conversationId) => {
        const response = await axiosInstance.post(`/chat/conversations/${conversationId}/seen`);
        return response.data;
    },
    editMessage: async (messageId, text) => {
        const response = await axiosInstance.patch(`/chat/messages/${messageId}`, { text });
        return response.data;
    },
    pinMessage: async (messageId) => {
        const response = await axiosInstance.post(`/chat/messages/${messageId}/pin`);
        return response.data;
    }
};
