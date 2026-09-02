import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, GymInfo } from '../types/auth';
import { authService } from '../services/auth.service';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  gym: GymInfo | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [gym, setGym] = useState<GymInfo | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await authService.getStoredSession();
        if (session.token && session.user) {
          setUser(session.user);
          setGym(session.gym);
          setIsAuthenticated(true);
        }
      } catch {
        // Clear broken token
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    authService.registerUnauthorizedHandler(() => {
      setIsAuthenticated(false);
      setUser(null);
      setGym(null);
    });

    restoreSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, pass);
      setUser(res.user);
      setGym(res.gym || null);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      setGym(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        gym,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
