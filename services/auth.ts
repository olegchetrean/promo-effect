/**
 * Authentication Service
 * Handles login, register, logout, and user session management
 */

import api, { tokenManager } from './api';
import { User, UserRole } from '../types';

// API response interfaces
interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string;
    company?: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  company?: string;
  role?: string;
}

interface LoginData {
  email: string;
  password: string;
}

// Convert backend user to frontend User type
const mapBackendUserToFrontend = (backendUser: LoginResponse['user']): User => {
  return {
    id: parseInt(backendUser.id.replace(/\D/g, '')) || Math.floor(Math.random() * 1000000), // Convert UUID to number for frontend compatibility
    name: backendUser.name,
    email: backendUser.email,
    role: (backendUser.role as UserRole) || UserRole.CLIENT,
  };
};

/**
 * Login user with email and password
 */
export const login = async (data: LoginData): Promise<User> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', data);

    const { user, accessToken, refreshToken } = response.data;

    // Store tokens
    tokenManager.setTokens(accessToken, refreshToken);

    // Map and store user
    const frontendUser = mapBackendUserToFrontend(user);
    tokenManager.setUser(frontendUser);

    return frontendUser;
  } catch (error: any) {
    throw new Error(error.message || 'Autentificare eșuată');
  }
};

/**
 * Register new user
 */
export const register = async (data: RegisterData): Promise<User> => {
  try {
    const response = await api.post<LoginResponse>('/auth/register', data);

    const { user, accessToken, refreshToken } = response.data;

    // Store tokens
    tokenManager.setTokens(accessToken, refreshToken);

    // Map and store user
    const frontendUser = mapBackendUserToFrontend(user);
    tokenManager.setUser(frontendUser);

    return frontendUser;
  } catch (error: any) {
    throw new Error(error.message || 'Înregistrare eșuată');
  }
};

/**
 * Logout current user
 */
export const logout = async (): Promise<void> => {
  try {
    // Call backend logout endpoint
    await api.post('/auth/logout');
  } catch (error) {
    // Even if backend logout fails, we still clear local tokens
    console.error('Logout error:', error);
  } finally {
    // Clear local storage
    tokenManager.clearTokens();
  }
};

/**
 * Get current authenticated user info
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get<{
      id: string;
      email: string;
      name: string;
      role: string;
      phone?: string;
      company?: string;
    }>('/auth/me');

    const frontendUser = mapBackendUserToFrontend(response.data);
    tokenManager.setUser(frontendUser);

    return frontendUser;
  } catch (error: any) {
    throw new Error(error.message || 'Nu s-a putut încărca informația utilizatorului');
  }
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = (): boolean => {
  return !!tokenManager.getAccessToken();
};

/**
 * Get stored user from localStorage
 */
export const getStoredUser = (): User | null => {
  return tokenManager.getUser();
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (): Promise<void> => {
  const refreshToken = tokenManager.getRefreshToken();

  if (!refreshToken) {
    throw new Error('Nu există refresh token');
  }

  try {
    const response = await api.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    tokenManager.setTokens(accessToken, newRefreshToken);
  } catch (error: any) {
    // If refresh fails, clear tokens
    tokenManager.clearTokens();
    throw new Error(error.message || 'Refresh token eșuat');
  }
};

/**
 * Request password reset email
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await api.post('/auth/forgot-password', { email });
  } catch (error: any) {
    throw new Error(error.message || 'Cerere resetare parolă eșuată');
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<void> => {
  try {
    await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
  } catch (error: any) {
    throw new Error(error.message || 'Resetare parolă eșuată');
  }
};

// Export auth service
const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  getStoredUser,
  refreshToken,
  requestPasswordReset,
  resetPassword,
};

export default authService;
