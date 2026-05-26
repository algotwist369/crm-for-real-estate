import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import socialMediaService from '../api/socialMedia.service';

export const useSocialAccounts = () => {
    return useQuery({
        queryKey: ['social-accounts'],
        queryFn: socialMediaService.getAccounts,
        refetchOnWindowFocus: false,
        staleTime: 30000
    });
};

export const useSocialPosts = () => {
    return useQuery({
        queryKey: ['social-posts'],
        queryFn: () => socialMediaService.getPosts({ limit: 50 }),
        refetchInterval: 7000
    });
};

export const useFacebookAccountPosts = (accountId) => {
    return useQuery({
        queryKey: ['social-facebook-posts', accountId],
        queryFn: () => socialMediaService.getFacebookPosts(accountId, { limit: 25 }),
        enabled: !!accountId,
        refetchOnWindowFocus: false,
        staleTime: 30000
    });
};

export const useConnectSocial = () => {
    return useMutation({
        mutationFn: socialMediaService.getOAuthUrl,
        onSuccess: (res) => {
            if (res?.data?.url) window.location.href = res.data.url;
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Unable to start Meta connection');
        }
    });
};

export const useDisconnectSocial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: socialMediaService.disconnectAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
            toast.success('Account disconnected');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to disconnect account');
        }
    });
};

export const useCreateSocialPost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: socialMediaService.createPost,
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['social-posts'] });
            toast.success(res.message || 'Post queued');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create post');
        }
    });
};

export const useGenerateSocialCaption = () => {
    return useMutation({
        mutationFn: socialMediaService.generateCaption,
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Caption generation failed');
        }
    });
};

export const useRetrySocialPost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: socialMediaService.retryPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['social-posts'] });
            toast.success('Retry queued');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Retry failed');
        }
    });
};

export const useDeleteSocialPost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: socialMediaService.deletePost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['social-posts'] });
            toast.success('Post deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    });
};

export const useSocialWorkerHealth = () => {
    return useQuery({
        queryKey: ['social-worker-health'],
        queryFn: socialMediaService.getWorkerHealth,
        retry: false,
        refetchInterval: 30000
    });
};
