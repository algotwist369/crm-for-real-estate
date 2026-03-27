import axiosInstance from "./axiosInstance";

export const leadService = {
    getAllLeads: async (params) => {
        const response = await axiosInstance.get("/leads", { params });
        return response.data;
    },

    getLeadById: async (id) => {
        const response = await axiosInstance.get(`/leads/${id}`);
        return response.data;
    },

    createLead: async (leadData) => {
        const response = await axiosInstance.post("/leads", leadData);
        return response.data;
    },

    updateLead: async (id, leadData) => {
        const response = await axiosInstance.patch(`/leads/${id}`, leadData);
        return response.data;
    },

    addLeadNote: async (id, noteData) => {
        const response = await axiosInstance.post(`/leads/${id}/notes`, noteData);
        return response.data;
    },

    setFollowUp: async (id, followUpData) => {
        const response = await axiosInstance.post(`/leads/${id}/followup`, followUpData);
        return response.data;
    },

    completeFollowUp: async (id, data) => {
        const response = await axiosInstance.post(`/leads/${id}/followup/complete`, data);
        return response.data;
    },

    rescheduleFollowUp: async (id, followUpData) => {
        const response = await axiosInstance.post(`/leads/${id}/followup/reschedule`, followUpData);
        return response.data;
    },

    markLeadConverted: async (id) => {
        const response = await axiosInstance.post(`/leads/${id}/convert`);
        return response.data;
    },

    markLeadLost: async (id, data) => {
        const response = await axiosInstance.post(`/leads/${id}/lost`, data);
        return response.data;
    },

    getMyFollowups: async (params) => {
        const response = await axiosInstance.get("/followups", { params });
        return response.data;
    },

    getAgentDashboardSummary: async () => {
        const response = await axiosInstance.get("/dashboard/agent-summary");
        return response.data;
    },

    getAgentActivityTimeline: async (params) => {
        const response = await axiosInstance.get("/dashboard/activity", { params });
        return response.data;
    }
};
