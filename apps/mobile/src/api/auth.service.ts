/**
 * obo Unified Mobile App — Auth Service
 * Calls verified production backend endpoints for Owner/Staff and Member logins.
 */

import { apiClient } from './client';
import { secureStorage, OBO_SESSION_KEY } from '../store/secure-store';
import { AuthenticatedSession, UserProfile, GymLocation, UserRole } from '../types';

export interface OwnerStaffLoginPayload {
  email: string;
  password: string;
}

export interface MemberLoginPayload {
  identifier: string;
  password: string;
}

export const authService = {
  /**
   * Authenticate Owner or Staff via POST /auth/login
   */
  async loginOwnerOrStaff(credentials: OwnerStaffLoginPayload): Promise<AuthenticatedSession> {
    const res = await apiClient.post<{ data: any }>('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password,
    });

    const data = res.data.data;
    const userObj = data.owner || data.user;
    if (!data.token || !userObj) {
      throw new Error('Invalid login response from server.');
    }

    const rawRole = String(userObj.role || 'Staff').toLowerCase();
    const resolvedRole: UserRole = rawRole === 'owner' ? 'Owner' : 'Staff';

    const profile: UserProfile = {
      id: userObj.id,
      gymId: userObj.gymId || userObj.gym_id || '',
      role: resolvedRole,
      firstName: userObj.firstName || userObj.first_name || 'User',
      lastName: userObj.lastName || userObj.last_name || '',
      email: userObj.email,
      phone: userObj.phone,
    };

    const activeGym: GymLocation | undefined = data.gym ? {
      id: data.gym.id,
      name: data.gym.name || 'My Gym',
      subscriptionPlan: data.gym.subscriptionPlan,
      subscriptionStatus: data.gym.subscriptionStatus,
      isMultiGym: Boolean(data.gym.isMultiGym),
      maxLocations: Number(data.gym.maxLocations || 1),
      billingCycle: data.gym.billingCycle,
      isCurrent: true,
    } : undefined;

    const session: AuthenticatedSession = {
      userId: profile.id,
      role: resolvedRole,
      gymId: profile.gymId,
      token: data.token,
      profile,
      activeGym,
    };

    await secureStorage.setItem(OBO_SESSION_KEY, JSON.stringify(session));
    return session;
  },

  /**
   * Authenticate Member via POST /member/auth/login
   */
  async loginMember(credentials: MemberLoginPayload): Promise<AuthenticatedSession> {
    const res = await apiClient.post<{ data: any }>('/member/auth/login', {
      identifier: credentials.identifier.trim(),
      password: credentials.password,
    });

    const data = res.data.data;
    const memberObj = data.member || data.user;
    if (!data.token || !memberObj) {
      throw new Error('Invalid member login response from server.');
    }

    const profile: UserProfile = {
      id: memberObj.id,
      gymId: memberObj.gymId || memberObj.gym_id || '',
      role: 'Member',
      firstName: memberObj.firstName || memberObj.first_name || 'Member',
      lastName: memberObj.lastName || memberObj.last_name || '',
      phone: memberObj.phone,
      email: memberObj.email,
      memberId: memberObj.memberId || memberObj.member_id || credentials.identifier.trim(),
    };

    const activeGym: GymLocation = {
      id: profile.gymId,
      name: memberObj.gymName || data.gymName || 'My Gym',
      isCurrent: true,
    };

    const session: AuthenticatedSession = {
      userId: profile.id,
      role: 'Member',
      gymId: profile.gymId,
      token: data.token,
      profile,
      activeGym,
    };

    await secureStorage.setItem(OBO_SESSION_KEY, JSON.stringify(session));
    return session;
  },

  /**
   * Clear session on client and notify backend if possible
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout').catch(() => {});
    } finally {
      await secureStorage.removeItem(OBO_SESSION_KEY);
    }
  },

  /**
   * Restore stored session from secure storage
   */
  async getStoredSession(): Promise<AuthenticatedSession | null> {
    try {
      const sessionStr = await secureStorage.getItem(OBO_SESSION_KEY);
      if (!sessionStr) return null;
      const session = JSON.parse(sessionStr) as AuthenticatedSession;
      if (session && session.token && session.role && session.userId) {
        return session;
      }
      return null;
    } catch {
      await secureStorage.removeItem(OBO_SESSION_KEY);
      return null;
    }
  },
};
