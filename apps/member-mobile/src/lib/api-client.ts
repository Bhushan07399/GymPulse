import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { memberSecureStorage } from './secure-store';

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

export const memberApiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let onUnauthorizedCallback: (() => void) | null = null;

export const setMemberUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Request Interceptor: Attach Member JWT Token
memberApiClient.interceptors.request.use(
  async (config) => {
    const token = await memberSecureStorage.getItem('gympulse_member_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: User-friendly error messaging & 401 handling
memberApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401) {
      await memberSecureStorage.removeItem('gympulse_member_token');
      await memberSecureStorage.removeItem('gympulse_member_user');
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === 'ECONNABORTED' ? 'Network connection timed out. Please check your internet.' : null) ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject(new Error(message));
  }
);
