import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService from '../api/auth.service';
import { toast } from 'react-hot-toast';

/**
 * Hook to get the currently authenticated user
 */
export const useAuthUser = () => {
  return useQuery({
    queryKey: ['authUser'],
    queryFn: authService.getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    retry: false,
  });
};

/**
 * Hook for login mutation
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
      toast.success('Successfully logged in!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });
};

/**
 * Hook for agent login mutation
 */
export const useAgentLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials) => authService.loginAgent(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
      toast.success('Agent logged in successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Agent login failed';
      toast.error(message);
    },
  });
};

/**
 * Hook for registration mutation
 */
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => authService.register(userData),
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
      toast.success('Account created successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });
};

/**
 * Hook for logout mutation
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(['authUser'], null);
      queryClient.clear(); // Clear all cache on logout
      toast.success('Logged out successfully');
    },
    onError: () => {
      toast.error('Logout failed');
    },
  });
};
/**
 * Hook for profile update mutation
 */
export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData) => authService.updateProfile(userData),
        onSuccess: (data) => {
            queryClient.setQueryData(['authUser'], data);
            toast.success('Profile updated successfully!');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Update failed';
            toast.error(message);
        },
    });
};
