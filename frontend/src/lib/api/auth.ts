import { apiClient } from './client';
import type { ApiResponse } from '@/entities';

// Auth DTOs (matching backend)
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

// Auth API functions
export const authApi = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  checkLogin: async (): Promise<AuthUser> => {
    const response = await apiClient.get<AuthUser>('/auth/check-login');
    return response.data;
  },
}; 