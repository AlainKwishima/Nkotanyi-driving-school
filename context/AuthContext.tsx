import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppFlow } from './AppFlowContext';
import { loginRequest, logoutRequest, signupRequest } from '../services/authApi';
import { getMessageFromUnknownError } from '../services/api/client';
import {
  getUserAndPayment,
  latestActiveSubscriptionLanguage,
  profileHasHighestSubscription,
  profileIndicatesActiveSubscription,
} from '../services/userApi';
import { phoneForSignupApi } from '../utils/phone';
import { navigationRef } from '../App';

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
  const {
    setSignedIn,
    setHasSubscription,
    setHasUsedFreeTrial,
    setCanChangeLanguage,
    setSubscriptionLanguage,
    contentLanguage,
  } = useAppFlow();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const applyProfile = useCallback(
    async (token: string, uid: string): Promise<boolean> => {
      const profile = await getUserAndPayment(uid, token);
      const u = profile.user;

      // DEV-only: print raw profile so we can verify subscription field shapes
      if (__DEV__) {
        console.log(
          '[AuthContext] raw profile.user →',
          JSON.stringify({ role: u.role, isSubscribed: u.isSubscribed, subscriptionStatus: u.subscriptionStatus, subscriptionActive: u.subscriptionActive, hasActiveSubscription: u.hasActiveSubscription, plan: u.plan, planName: u.planName, subscriptionExpiry: u.subscriptionExpiry, subscriptionExpiresAt: u.subscriptionExpiresAt, expiresAt: u.expiresAt }),
        );
        console.log('[AuthContext] raw profile.payment →', JSON.stringify(profile.payment));
      }

      setName(u.name);
      setPhone(u.phone);
      if (typeof u.hasAttemptedTrial === 'boolean' && u.hasAttemptedTrial) {
        await setHasUsedFreeTrial(true);
      }
      const sub = profileIndicatesActiveSubscription(profile);
      const highestSub = profileHasHighestSubscription(profile);
      const paidLanguage = sub ? latestActiveSubscriptionLanguage(profile) : null;
      if (__DEV__) {
        console.log('[AuthContext] hasSubscription resolved to →', sub);
        console.log('[AuthContext] highest subscription resolved to →', highestSub);
        console.log('[AuthContext] paid language resolved to →', paidLanguage);
      }
      await setHasSubscription(sub);
      await setCanChangeLanguage(highestSub);
      await setSubscriptionLanguage(paidLanguage);
      return sub;
    },
    [setCanChangeLanguage, setHasSubscription, setHasUsedFreeTrial, setSubscriptionLanguage],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (authReady) return;
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
            if (!cancelled) {
              await AsyncStorage.removeItem(AUTH_KEY);
              setAccessToken(null);
              setUserId(null);
              setName(null);
              setPhone(null);
              await setSignedIn(false);
            }
          }
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };
    void load();
    return () => { cancelled = true; };
    // Empty dependency array ensures this single-fire bootstrap logic doesn't repeatedly trigger.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (accountRaw: string, password: string) => {
      const data = await loginRequest(accountRaw, password);
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
      const phoneDigits = phoneForSignupApi(phoneRaw);
      await signupRequest(fullName, phoneDigits, password.trim(), contentLanguage);
      await login(phoneRaw, password.trim());
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
    await setCanChangeLanguage(false);
    await setSubscriptionLanguage(null);
    if (t) {
      try {
        await logoutRequest(t);
      } catch {
        /* ignore */
      }
    }
  }, [accessToken, setCanChangeLanguage, setSignedIn, setSubscriptionLanguage]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('AUTH_EXPIRED', () => {
      void logout();
      Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
    return () => sub.remove();
  }, [logout]);

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

