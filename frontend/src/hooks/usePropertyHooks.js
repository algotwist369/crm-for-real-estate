import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyService } from "../api/property.service";
import toast from "react-hot-toast";

export const useProperties = (filters = {}) => {
    return useQuery({
        queryKey: ["properties", filters],
        queryFn: () => propertyService.getAllProperties(filters),
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 15, // 15 minutes
        refetchOnWindowFocus: false,
    });
};

export const useProperty = (id) => {
    return useQuery({
        queryKey: ["property", id],
        queryFn: () => propertyService.getPropertyById(id),
        enabled: !!id,
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 15, // 15 minutes
        refetchOnWindowFocus: false,
    });
};

export const useCreateProperty = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => propertyService.createProperty(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries(["properties"]);
            toast.success(response.message || "Property created successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create property");
        },
    });
};

export const useUpdateProperty = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => propertyService.updateProperty(id, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries(["properties"]);
            queryClient.invalidateQueries(["property", response.data._id]);
            toast.success(response.message || "Property updated successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update property");
        },
    });
};

export const useUpdatePropertyStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, statusData }) => propertyService.updatePropertyStatus(id, statusData),
        onSuccess: (response) => {
            queryClient.invalidateQueries(["properties"]);
            toast.success(response.message || "Status updated");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update status");
        },
    });
};

export const useDeleteProperty = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => propertyService.deleteProperty(id),
        onSuccess: (response) => {
            queryClient.invalidateQueries(["properties"]);
            toast.success(response.message || "Property deleted");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete property");
        },
    });
};
