import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppFlow } from './AppFlowContext';
import { loginRequest, logoutRequest, signupRequest } from '../services/authApi';
import { getMessageFromUnknownError } from '../services/api/client';
import { getUserAndPayment, paymentsIndicateActiveSubscription } from '../services/userApi';
import { normalizeAccountPhone } from '../utils/phone';

const AUTH_KEY = 'nkotanyi.auth.v1';

export type AuthState = {
  accessToken: string | null;
  userId: string | null;
  name: string | null;
  phone: string | null;
};

type AuthContextValue = AuthState & {
  authReady: boolean;
  login: (account: string, password: string) => Promise<void>;
  signup: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Refreshes profile from the server. Returns whether an active subscription was detected in payment records. */
  refreshProfile: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistAuth(state: AuthState) {
  if (!state.accessToken || !state.userId) {
    await AsyncStorage.removeItem(AUTH_KEY);
    return;
  }
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSignedIn, setHasSubscription, setHasUsedFreeTrial, contentLanguage } = useAppFlow();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const applyProfile = useCallback(
    async (token: string, uid: string): Promise<boolean> => {
      const profile = await getUserAndPayment(uid, token);
      const u = profile.user;
      setName(u.name);
      setPhone(u.phone);
      if (typeof u.hasAttemptedTrial === 'boolean' && u.hasAttemptedTrial) {
        await setHasUsedFreeTrial(true);
      }
      const sub = paymentsIndicateActiveSubscription(profile.payment);
      await setHasSubscription(sub);
      return sub;
    },
    [setHasSubscription, setHasUsedFreeTrial],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_KEY);
        if (!raw) {
          setAuthReady(true);
          return;
        }
        const parsed = JSON.parse(raw) as Partial<AuthState>;
        if (parsed.accessToken && parsed.userId) {
          setAccessToken(parsed.accessToken);
          setUserId(parsed.userId);
          setName(parsed.name ?? null);
          setPhone(parsed.phone ?? null);
          await setSignedIn(true);
          try {
            await applyProfile(parsed.accessToken, parsed.userId);
          } catch {
            await AsyncStorage.removeItem(AUTH_KEY);
            setAccessToken(null);
            setUserId(null);
            setName(null);
            setPhone(null);
            await setSignedIn(false);
          }
        }
      } finally {
        setAuthReady(true);
      }
    };
    void load();
  }, [applyProfile, setSignedIn]);

  const login = useCallback(
    async (accountRaw: string, password: string) => {
      const account = normalizeAccountPhone(accountRaw);
      const data = await loginRequest(account, password);
      const token = data.accessToken;
      if (!token) {
        throw new Error('Login did not return an access token');
      }
      const uid = data._id;
      setAccessToken(token);
      setUserId(uid);
      setName(data.name);
      setPhone(data.phone);
      await persistAuth({ accessToken: token, userId: uid, name: data.name, phone: data.phone });
      await setSignedIn(true);
      await applyProfile(token, uid);
    },
    [applyProfile, setSignedIn],
  );

  const signup = useCallback(
    async (fullName: string, phoneRaw: string, password: string) => {
      const phoneDigits = normalizeAccountPhone(phoneRaw);
      await signupRequest(fullName, phoneDigits, password, contentLanguage);
      await login(phoneRaw, password);
    },
    [contentLanguage, login],
  );

  const logout = useCallback(async () => {
    const t = accessToken;
    setAccessToken(null);
    setUserId(null);
    setName(null);
    setPhone(null);
    await AsyncStorage.removeItem(AUTH_KEY);
    await setSignedIn(false);
    if (t) {
      try {
        await logoutRequest(t);
      } catch {
        /* ignore */
      }
    }
  }, [accessToken, setSignedIn]);

  const refreshProfile = useCallback(async (): Promise<boolean> => {
    if (!accessToken || !userId) return false;
    return applyProfile(accessToken, userId);
  }, [accessToken, userId, applyProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      userId,
      name,
      phone,
      authReady,
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [accessToken, userId, name, phone, authReady, login, signup, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export { getMessageFromUnknownError };
