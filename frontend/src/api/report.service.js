import axiosInstance from "./axiosInstance";

export const reportService = {
    getStats: async () => {
        const response = await axiosInstance.get("/admin/report/stats");
        return response.data;
    },

    getOverview: async () => {
        const response = await axiosInstance.get("/admin/report/overview");
        return response.data;
    },

    getAgentPerformance: async (params) => {
        const response = await axiosInstance.get("/admin/report/agent-performance", { params });
        return response.data;
    },

    getLeadInsights: async () => {
        const response = await axiosInstance.get("/admin/report/lead-insights");
        return response.data;
    },

    exportReport: async (type = "excel") => {
        const response = await axiosInstance.get("/admin/report/export", {
            params: { type },
            responseType: "blob"
        });
        return response;
    }
};
