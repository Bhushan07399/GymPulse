import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStore: Record<string, string> = {};

export const memberSecureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : memoryStore[key] || null;
      } catch {
        return memoryStore[key] || null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStore[key] || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(key, value);
      } catch {
        memoryStore[key] = value;
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      memoryStore[key] = value;
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.removeItem(key);
      } catch {
        delete memoryStore[key];
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      delete memoryStore[key];
    }
  },
};
