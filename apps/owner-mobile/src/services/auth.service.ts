import { apiClient, setUnauthorizedCallback } from '../lib/api-client';
import { secureStorage } from '../lib/secure-store';
import { AuthResponse, User, GymInfo } from '../types/auth';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<{ data: { token: string; user?: User; owner?: User; gym?: GymInfo } }>('/auth/login', { email, password });
    const authData = res.data.data;
    const userObj = authData.user || authData.owner;
    
    if (authData.token && userObj) {
      await secureStorage.setItem('gympulse_token', authData.token);
      await secureStorage.setItem('gympulse_user', JSON.stringify(userObj));
      if (authData.gym) {
        await secureStorage.setItem('gympulse_gym', JSON.stringify(authData.gym));
      }
    }
    return {
      token: authData.token,
      user: userObj!,
      gym: authData.gym,
    };
  },

  async logout(): Promise<void> {
    await secureStorage.removeItem('gympulse_token');
    await secureStorage.removeItem('gympulse_user');
    await secureStorage.removeItem('gympulse_gym');
  },

  async getStoredSession(): Promise<{ token: string | null; user: User | null; gym: GymInfo | null }> {
    const token = await secureStorage.getItem('gympulse_token');
    const userStr = await secureStorage.getItem('gympulse_user');
    const gymStr = await secureStorage.getItem('gympulse_gym');

    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
      gym: gymStr ? JSON.parse(gymStr) : null,
    };
  },

  registerUnauthorizedHandler(handler: () => void) {
    setUnauthorizedCallback(handler);
  },
};
