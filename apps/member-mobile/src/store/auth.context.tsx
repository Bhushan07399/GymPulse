import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { memberAuthService } from '../services/auth.service';
import { MemberUser } from '../types/auth';

interface AuthContextType {
  token: string | null;
  member: MemberUser | null;
  isLoading: boolean;
  login: (memberIdOrPhone: string, dateOfBirthOrPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const MemberAuthContext = createContext<AuthContextType | undefined>(undefined);

export const MemberAuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [member, setMember] = useState<MemberUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await memberAuthService.getStoredSession();
        if (session.token && session.member) {
          setToken(session.token);
          setMember(session.member);
        }
      } catch {
        // Fallback silently if storage unavailable
      } finally {
        setIsLoading(false);
      }
    };

    memberAuthService.registerUnauthorizedHandler(() => {
      setToken(null);
      setMember(null);
    });

    restoreSession();
  }, []);

  const login = async (memberIdOrPhone: string, dateOfBirthOrPassword: string) => {
    const response = await memberAuthService.login(memberIdOrPhone, dateOfBirthOrPassword);
    setToken(response.token);
    setMember(response.member);
  };

  const logout = async () => {
    await memberAuthService.logout();
    setToken(null);
    setMember(null);
  };

  return (
    <MemberAuthContext.Provider value={{ token, member, isLoading, login, logout }}>
      {children}
    </MemberAuthContext.Provider>
  );
};

export const useMemberAuth = () => {
  const context = useContext(MemberAuthContext);
  if (!context) {
    throw new Error('useMemberAuth must be used within a MemberAuthProvider');
  }
  return context;
};
