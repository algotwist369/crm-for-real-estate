import axiosInstance from "./axiosInstance";

export const taskService = {
    getWorkspaces: async () => {
        const response = await axiosInstance.get("/tasks/workspaces");
        return response.data;
    },
    createWorkspace: async (data) => {
        const response = await axiosInstance.post("/tasks/workspaces", data);
        return response.data;
    },
    updateWorkspace: async (id, data) => {
        const response = await axiosInstance.patch(`/tasks/workspaces/${id}`, data);
        return response.data;
    },
    getBoard: async (workspaceId, params = {}) => {
        const response = await axiosInstance.get(`/tasks/workspaces/${workspaceId}/board`, { params });
        return response.data;
    },
    createTask: async (workspaceId, data) => {
        const response = await axiosInstance.post(`/tasks/workspaces/${workspaceId}/tasks`, data);
        return response.data;
    },
    updateTask: async (id, data) => {
        const response = await axiosInstance.patch(`/tasks/tasks/${id}`, data);
        return response.data;
    },
    moveTask: async (id, data) => {
        const response = await axiosInstance.patch(`/tasks/tasks/${id}/move`, data);
        return response.data;
    },
    addComment: async (id, text) => {
        const response = await axiosInstance.post(`/tasks/tasks/${id}/comments`, { text });
        return response.data;
    },
    uploadAttachment: async (id, formData) => {
        const response = await axiosInstance.post(`/tasks/tasks/${id}/attachments`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },
    getAnalytics: async () => {
        const response = await axiosInstance.get("/tasks/analytics");
        return response.data;
    }
};
