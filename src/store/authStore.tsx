import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../lib/firebase';
import { authApi, memberApi } from '../api/client';
import type { Member } from '../types';

interface AuthContextValue {
  member: Member | null;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, nickname: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  refreshMember: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureRegistered(firebaseUser: FirebaseUser, nickname?: string) {
  const token = await firebaseUser.getIdToken();
  await authApi.register(token, nickname);
}

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          await ensureRegistered(firebaseUser);
          await refreshMember();
        } catch (error) {
          console.error("Firebase auth succeeded but backend registration/refresh failed:");
          console.error(error);
          setMember(null);
        }
      } else {
        setMember(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, [refreshMember]);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged handles ensureRegistered + refreshMember
  };

  const signupWithEmail = async (email: string, password: string, nickname: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await ensureRegistered(credential.user, nickname);
    await refreshMember();
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithApple = async () => {
    await signInWithPopup(auth, appleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{
      member, isLoading,
      loginWithEmail, signupWithEmail,
      loginWithGoogle, loginWithApple,
      logout, refreshMember,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
