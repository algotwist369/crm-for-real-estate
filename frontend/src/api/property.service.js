import axiosInstance from "./axiosInstance";

export const propertyService = {
    getAllProperties: async (params) => {
        const response = await axiosInstance.get("/properties", { params });
        return response.data;
    },

    getPropertyById: async (id) => {
        const response = await axiosInstance.get(`/properties/${id}`);
        return response.data;
    },

    createProperty: async (propertyData) => {
        // Handle multipart/form-data if images are present as files
        // Backend handles both JSON and Multipart based on routes
        const response = await axiosInstance.post("/properties", propertyData);
        return response.data;
    },

    updateProperty: async (id, propertyData) => {
        const response = await axiosInstance.patch(`/properties/${id}`, propertyData);
        return response.data;
    },

    updatePropertyStatus: async (id, statusData) => {
        const response = await axiosInstance.patch(`/properties/${id}/status`, statusData);
        return response.data;
    },

    deleteProperty: async (id) => {
        const response = await axiosInstance.delete(`/properties/${id}`);
        return response.data;
    }
};
