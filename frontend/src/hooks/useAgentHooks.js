import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import agentService from '../api/agent.service';
import { toast } from 'react-hot-toast';

/**
 * Hook to get all agents
 */
export const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => agentService.getAgents(),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for creating a new agent
 */
export const useCreateAgent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (agentData) => agentService.createAgent(agentData),
        onSuccess: () => {
            queryClient.invalidateQueries(['agents']);
            toast.success('Agent created successfully!');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Failed to create agent';
            toast.error(message);
        },
    });
};

/**
 * Hook for updating an agent's profile
 */
export const useUpdateAgentProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => agentService.updateAgentProfile(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['agents']);
            toast.success('Agent profile updated successfully!');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Failed to update agent profile';
            toast.error(message);
        },
    });
};

/**
 * Hook for updating an agent's status
 */
export const useUpdateAgentStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => agentService.updateAgentStatus(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['agents']);
            toast.success('Agent status updated!');
        },
        onError: () => {
            toast.error('Failed to update status');
        },
    });
};

/**
 * Hook for deleting an agent
 */
export const useDeleteAgent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => agentService.deleteAgent(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['agents']);
            toast.success('Agent deleted successfully!');
        },
        onError: () => {
            toast.error('Failed to delete agent');
        },
    });
};

/**
 * Hook for updating an agent's remark
 */
export const useUpdateAgentRemark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, remark }) => agentService.remarkAgent(id, remark),
        onSuccess: () => {
            queryClient.invalidateQueries(['agents']);
            toast.success('Remark updated successfully!');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Failed to update remark';
            toast.error(message);
        },
    });
};
