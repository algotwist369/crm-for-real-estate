import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadService } from "../api/lead.service";
import toast from "react-hot-toast";

export const useLeads = (filters = {}) => {
    return useQuery({
        queryKey: ["leads", filters],
        queryFn: () => leadService.getLeads(filters),
        staleTime: 1000 * 30, // 30 seconds
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false
    });
};

export const useLeadsMinimal = () => {
    return useQuery({
        queryKey: ["leads-minimal"],
        queryFn: () => leadService.getLeadsMinimal(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useLead = (id) => {
    return useQuery({
        queryKey: ["lead", id],
        queryFn: () => leadService.getLeadById(id),
        enabled: !!id,
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false
    });
};

export const useCreateLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => leadService.createLead(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries(["leads"]);
            queryClient.invalidateQueries(["dashboard", "agent-summary"]);
            toast.success(response.message || "Lead created successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create lead");
        },
    });
};

export const useUpdateLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => leadService.updateLead(id, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries(["leads"]);
            queryClient.invalidateQueries(["lead", variables.id]);
            toast.success(response.message || "Lead updated successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update lead");
        },
    });
};

export const useAddLeadNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => leadService.addLeadNote(id, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries(["leads"]);
            queryClient.invalidateQueries(["lead", variables.id]);
            toast.success(response.message || "Note added");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to add note");
        },
    });
};

export const useSetFollowUp = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => leadService.setFollowUp(id, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries(["leads"]);
            queryClient.invalidateQueries(["followups"]);
            queryClient.invalidateQueries(["lead", variables.id]);
            toast.success(response.message || "Follow-up set successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to set follow-up");
        },
    });
};

export const useCompleteFollowUp = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => leadService.completeFollowUp(id, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries(["leads"]);
            queryClient.invalidateQueries(["followups"]);
            queryClient.invalidateQueries(["lead", variables.id]);
            toast.success(response.message || "Follow-up completed");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to complete follow-up");
        },
    });
};

export const useMarkLeadConverted = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => leadService.markLeadConverted(id),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries(["leads"]);
            queryClient.invalidateQueries(["dashboard", "agent-summary"]);
            queryClient.invalidateQueries(["lead", variables]);
            toast.success(response.message || "Lead successfully marked as converted!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to mark lead as converted");
        },
    });
};

export const useMarkLeadLost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => leadService.markLeadLost(id, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries(["leads"]);
            queryClient.invalidateQueries(["dashboard", "agent-summary"]);
            queryClient.invalidateQueries(["lead", variables.id]);
            toast.success(response.message || "Lead marked as lost");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to mark lead as lost");
        },
    });
};

export const useMyFollowups = (filters = {}) => {
    return useQuery({
        queryKey: ["followups", filters],
        queryFn: () => leadService.getMyFollowups(filters),
        staleTime: 1000 * 30, // 30 seconds
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false
    });
};

export const useAgentDashboardSummary = () => {
    return useQuery({
        queryKey: ["dashboard", "agent-summary"],
        queryFn: () => leadService.getAgentDashboardSummary(),
        staleTime: 1000 * 30, // 30 seconds
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false
    });
};

export const useAgentActivityTimeline = (filters = {}) => {
    return useQuery({
        queryKey: ["dashboard", "activity-timeline", filters],
        queryFn: () => leadService.getAgentActivityTimeline(filters),
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false
    });
};

export const useDeleteLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => leadService.deleteLead(id),
        onSuccess: (response) => {
            queryClient.invalidateQueries(["leads"]);
            queryClient.invalidateQueries(["dashboard", "agent-summary"]);
            toast.success(response.message || "Lead deleted successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete lead");
        },
    });
};
