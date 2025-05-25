'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, classApi } from '@/lib/api';
import type { 
  LoginDto, 
  RegisterDto, 
  AuthUser, 
  JoinClassDto 
} from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginDto) => Promise<void>;
  registerTeacher: (data: RegisterDto) => Promise<void>;
  registerStudent: (data: JoinClassDto) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;

  // Check authentication status on mount
  useEffect(() => {
    // Only run auth check in browser
    if (typeof window !== 'undefined') {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      // Only access localStorage in browser
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const userData = await authApi.checkLogin();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token (only in browser)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginDto) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(data);
      
      // Store token (only in browser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.access_token);
      }
      
      // Set user data
      setUser(response.user);
      
      // Invalidate all queries to refresh with new auth
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerTeacher = async (data: RegisterDto) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(data);
      
      // Store token (only in browser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.access_token);
      }
      
      // Set user data
      setUser(response.user);
      
      // Invalidate all queries to refresh with new auth
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Teacher registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (data: JoinClassDto) => {
    try {
      setIsLoading(true);
      
      // Join class first (this creates the student account)
      await classApi.joinClass(data);
      
      // Since joinClass doesn't return JWT, we need to login with the credentials
      await login({
        email: data.email,
        password: data.password,
      });
      
    } catch (error) {
      console.error('Student registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear token (only in browser)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      
      // Redirect to login
      window.location.href = '/login';
    }
    
    // Clear user state
    setUser(null);
    
    // Clear all cached data
    queryClient.clear();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    registerTeacher,
    registerStudent,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 