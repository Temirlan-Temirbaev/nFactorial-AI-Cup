import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import type { LoginDto, RegisterDto, AuthResponse, AuthUser } from '@/lib/api';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
} as const;

// Auth hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LoginDto) => authApi.login(data),
    onSuccess: (data: AuthResponse) => {
      // Store token in localStorage
      localStorage.setItem('access_token', data.access_token);
      
      // Update user data in cache
      queryClient.setQueryData(authKeys.user(), data.user);
      
      // Invalidate all queries to refresh data with new auth
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Login failed:', error);
      localStorage.removeItem('access_token');
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RegisterDto) => authApi.register(data),
    onSuccess: (data: AuthResponse) => {
      // Store token in localStorage
      localStorage.setItem('access_token', data.access_token);
      
      // Update user data in cache
      queryClient.setQueryData(authKeys.user(), data.user);
      
      // Invalidate all queries to refresh data with new auth
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Registration failed:', error);
      localStorage.removeItem('access_token');
    },
  });
};

export const useCheckLogin = () => {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authApi.checkLogin(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!localStorage.getItem('access_token'), // Only run if token exists
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Clear token
      localStorage.removeItem('access_token');
      
      // Clear all cached data
      queryClient.clear();
      
      return Promise.resolve();
    },
    onSuccess: () => {
      // Redirect to login or home page
      window.location.href = '/login';
    },
  });
};

// Hook to get current user from cache
export const useCurrentUser = (): AuthUser | undefined => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<AuthUser>(authKeys.user());
}; 