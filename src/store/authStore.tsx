import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, memberApi } from '../api/client';
import type { Member } from '../types';

interface AuthContextValue {
  member: Member | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  refreshMember: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMember = useCallback(async () => {
    try {
      const response = await memberApi.getMe();
      setMember(response.data.data);
    } catch {
      setMember(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshMember().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshMember]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { accessToken, refreshToken } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    await refreshMember();
  };

  const signup = async (email: string, password: string, nickname: string) => {
    const response = await authApi.signup(email, password, nickname);
    const { accessToken, refreshToken } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    await refreshMember();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ member, isLoading, login, signup, logout, refreshMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
