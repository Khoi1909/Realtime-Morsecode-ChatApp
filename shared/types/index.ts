// Re-export Supabase types for easy access
export * from './supabase';

// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Auth specific types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  turnstileToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  display_name?: string;
  turnstileToken?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    display_name?: string;
    created_at?: string;
    updated_at?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  username: string;
  display_name?: string;
  iat: number;
  exp: number;
}

// Service communication types
export interface ServiceRequest<T = any> {
  service: string;
  action: string;
  data: T;
  userId?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
