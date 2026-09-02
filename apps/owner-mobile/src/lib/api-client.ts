import axios, { AxiosError } from 'axios';
import { secureStorage } from './secure-store';

import { Platform } from 'react-native';

const getDefaultApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

const API_URL = getDefaultApiUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let onUnauthorizedCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getItem('gympulse_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: User-friendly error messaging & 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401) {
      await secureStorage.removeItem('gympulse_token');
      await secureStorage.removeItem('gympulse_user');
      await secureStorage.removeItem('gympulse_gym');
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === 'ECONNABORTED' ? 'Network timeout. Please check connection.' : null) ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject(new Error(message));
  }
);
