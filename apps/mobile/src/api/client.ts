/**
 * obo Unified Mobile App — API Client
 * Central Axios instance with Bearer token injection, timeout, normalized error messages, and 401 interception.
 */

import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { secureStorage, OBO_SESSION_KEY } from '../store/secure-store';

export const getDefaultApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getDefaultApiUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let onUnauthorizedCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void): void => {
  onUnauthorizedCallback = callback;
};

// Request Interceptor: Attach current session JWT token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const sessionStr = await secureStorage.getItem(OBO_SESSION_KEY);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.token && config.headers) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      }
    } catch {
      // Continue request without token if parse fails
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 handling and normalized error messaging
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; error?: { message?: string } | string }>) => {
    if (error.response?.status === 401) {
      await secureStorage.removeItem(OBO_SESSION_KEY);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    const data = error.response?.data;
    const message =
      (typeof data?.error === 'object' ? data?.error?.message : data?.error) ||
      data?.message ||
      (error.code === 'ECONNABORTED' ? 'Network connection timed out. Please check your internet.' : null) ||
      (error.message === 'Network Error' ? 'Unable to reach the server. Please check your connection.' : null) ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject(new Error(message));
  }
);
