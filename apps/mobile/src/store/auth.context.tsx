/**
 * obo Unified Mobile App — Auth Context & Session Provider
 * Manages reactive session state, startup hydration, login, logout, and 401 handling.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService, OwnerStaffLoginPayload, MemberLoginPayload } from '../api/auth.service';
import { setUnauthorizedCallback } from '../api/client';
import { secureStorage, OBO_SESSION_KEY } from './secure-store';
import { AuthenticatedSession, UserProfile, UserRole } from '../types';

interface AuthContextType {
  session: AuthenticatedSession | null;
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginOwnerOrStaff: (credentials: OwnerStaffLoginPayload) => Promise<AuthenticatedSession>;
  loginMember: (credentials: MemberLoginPayload) => Promise<AuthenticatedSession>;
  switchGymSession: (newToken: string, newGym: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const handleUnauthorized = useCallback(() => {
    setSession(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await authService.getStoredSession();
        if (stored) {
          setSession(stored);
        }
      } catch {
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    setUnauthorizedCallback(handleUnauthorized);
    restoreSession();
  }, [handleUnauthorized]);

  const loginOwnerOrStaff = async (credentials: OwnerStaffLoginPayload): Promise<AuthenticatedSession> => {
    setIsLoading(true);
    try {
      const newSession = await authService.loginOwnerOrStaff(credentials);
      queryClient.clear();
      setSession(newSession);
      return newSession;
    } finally {
      setIsLoading(false);
    }
  };

  const loginMember = async (credentials: MemberLoginPayload): Promise<AuthenticatedSession> => {
    setIsLoading(true);
    try {
      const newSession = await authService.loginMember(credentials);
      queryClient.clear();
      setSession(newSession);
      return newSession;
    } finally {
      setIsLoading(false);
    }
  };

  const switchGymSession = async (newToken: string, newGym: any): Promise<void> => {
    if (!session) return;
    const updated: AuthenticatedSession = {
      ...session,
      token: newToken,
      gymId: newGym.id,
      activeGym: newGym,
      profile: {
        ...session.profile,
        gymId: newGym.id,
      },
    };
    await secureStorage.setItem(OBO_SESSION_KEY, JSON.stringify(updated));
    setSession(updated);
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      queryClient.clear();
      setSession(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.profile ?? null,
        role: session?.role ?? null,
        isAuthenticated: Boolean(session?.token),
        isLoading,
        loginOwnerOrStaff,
        loginMember,
        switchGymSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
