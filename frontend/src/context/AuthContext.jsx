import React, { createContext, useContext, useEffect } from 'react';
import { useAuthUser, useLogin, useLogout, useRegister, useAgentLogin } from '../hooks/useAuthHooks';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { data: authResponse, isLoading, isError, refetch } = useAuthUser();
  const user = authResponse?.user; // Correctly extract the user object from the response
  
  const loginMutation = useLogin();
  const agentLoginMutation = useAgentLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  useEffect(() => {
    console.log('Auth State Change:', { 
        isAuthenticated: !!user, 
        user: user?.user_name,
        isLoading,
        isError
    });
  }, [user, isLoading, isError]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isError,
    login: loginMutation.mutateAsync,
    loginAgent: agentLoginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isAgentLoggingIn: agentLoginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    refetchUser: refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
