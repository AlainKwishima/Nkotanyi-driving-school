import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, DeviceEventEmitter, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppFlow } from './AppFlowContext';
import { loginRequest, logoutRequest, signupRequest } from '../services/authApi';
import { AUTH_EXPIRED_EVENT, getMessageFromUnknownError } from '../services/api/client';
import { decodeJwtExpiryMs, formatTokenExpiry, isTokenExpired, logAuthEvent, shouldForceLogout } from '../services/api/authSession';
import { ApiError } from '../services/api/types';
import {
  getUserAndPayment,
  latestActiveSubscriptionLanguage,
  profileHasHighestSubscription,
  profileHasTimeBasedSubscription,
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
    setHasTimeBasedSubscription,
    setHasUsedFreeTrial,
    setCanChangeLanguage,
    setSubscriptionLanguage,
    setSigningOut,
    contentLanguage,
  } = useAppFlow();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenExpiryMsRef = useRef<number | null>(null);
  const logoutRef = useRef<((reason?: string) => Promise<void>) | null>(null);

  const applyProfile = useCallback(
    async (token: string, uid: string): Promise<boolean> => {
      logAuthEvent('apply_profile_start', { userId: uid, tokenExpiry: formatTokenExpiry(token) });
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
      const timeBased = profileHasTimeBasedSubscription(profile);
      const highestSub = profileHasHighestSubscription(profile);
      const paidLanguage = sub ? latestActiveSubscriptionLanguage(profile) : null;
      if (__DEV__) {
        console.log('[AuthContext] hasSubscription resolved to →', sub);
        console.log('[AuthContext] hasTimeBasedSubscription resolved to →', timeBased);
        console.log('[AuthContext] highest subscription resolved to →', highestSub);
        console.log('[AuthContext] paid language resolved to →', paidLanguage);
      }
      await setHasSubscription(sub);
      await setHasTimeBasedSubscription(timeBased);
      await setCanChangeLanguage(highestSub);
      await setSubscriptionLanguage(paidLanguage);
      logAuthEvent('apply_profile_ok', { userId: uid, hasSubscription: sub, timeBased });
      return sub;
    },
    [setCanChangeLanguage, setHasSubscription, setHasTimeBasedSubscription, setHasUsedFreeTrial, setSubscriptionLanguage],
  );

  const clearStoredSession = useCallback(
    async (reason: string) => {
      logAuthEvent('clear_stored_session', { reason });
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
      tokenExpiryMsRef.current = null;
      await AsyncStorage.removeItem(AUTH_KEY);
      setAccessToken(null);
      setUserId(null);
      setName(null);
      setPhone(null);
      await setSignedIn(false);
      await setHasSubscription(false);
      await setHasTimeBasedSubscription(false);
      await setCanChangeLanguage(false);
      await setSubscriptionLanguage(null);
    },
    [setCanChangeLanguage, setHasSubscription, setHasTimeBasedSubscription, setSignedIn, setSubscriptionLanguage],
  );

  const scheduleTokenExpiryCheck = useCallback(
    (token: string, source: string) => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }

      const expiryMs = decodeJwtExpiryMs(token);
      tokenExpiryMsRef.current = expiryMs;
      logAuthEvent('token_expiry_loaded', {
        source,
        tokenExpiry: formatTokenExpiry(token),
        tokenExpired: isTokenExpired(token, 0),
      });

      if (expiryMs == null) {
        return;
      }

      const delay = Math.max(expiryMs - Date.now(), 0);
      expiryTimerRef.current = setTimeout(() => {
        logAuthEvent('token_expired_timer_fired', {
          source,
          tokenExpiry: new Date(expiryMs).toISOString(),
        });
        void logoutRef.current?.('token_expired');
      }, delay);
    },
    [],
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
          setSigningOut(false);
          await setSignedIn(true);
          scheduleTokenExpiryCheck(parsed.accessToken, 'bootstrap');
          try {
            await applyProfile(parsed.accessToken, parsed.userId);
          } catch (e) {
            if (!cancelled) {
              const forceLogout =
                e instanceof ApiError && shouldForceLogout(e.status, e.payload, parsed.accessToken);
              if (forceLogout) {
                await clearStoredSession('bootstrap_profile_invalid_session');
              } else {
                logAuthEvent('bootstrap_profile_failed_kept_session', {
                  error: getMessageFromUnknownError(e),
                  status: e instanceof ApiError ? e.status : undefined,
                });
              }
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
  }, [applyProfile, clearStoredSession, scheduleTokenExpiryCheck, setSignedIn, setSigningOut]);

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
      setSigningOut(false);
      await persistAuth({ accessToken: token, userId: uid, name: data.name, phone: data.phone });
      await setSignedIn(true);
      logAuthEvent('login_ok', { userId: uid, tokenExpiry: formatTokenExpiry(token) });
      scheduleTokenExpiryCheck(token, 'login');
      try {
        await applyProfile(token, uid);
      } catch (e) {
        logAuthEvent('login_profile_failed_kept_session', {
          error: getMessageFromUnknownError(e),
          status: e instanceof ApiError ? e.status : undefined,
        });
      }
    },
    [applyProfile, scheduleTokenExpiryCheck, setSignedIn, setSigningOut],
  );

  const signup = useCallback(
    async (fullName: string, phoneRaw: string, password: string) => {
      const phoneDigits = phoneForSignupApi(phoneRaw);
      await signupRequest(fullName, phoneDigits, password.trim(), contentLanguage);
      await login(phoneRaw, password.trim());
    },
    [contentLanguage, login],
  );

  const logout = useCallback(async (reason = 'user_or_system') => {
    logAuthEvent('logout', { reason });
    const t = accessToken;
    setSigningOut(true);
    setAccessToken(null);
    setUserId(null);
    setName(null);
    setPhone(null);
    await AsyncStorage.removeItem(AUTH_KEY);
    await setSignedIn(false);
    await setHasSubscription(false);
    await setCanChangeLanguage(false);
    await setHasTimeBasedSubscription(false);
    await setSubscriptionLanguage(null);
    if (navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
    if (t) {
      try {
        await logoutRequest(t);
      } catch {
        /* ignore */
      }
    }
  }, [accessToken, setCanChangeLanguage, setHasSubscription, setHasTimeBasedSubscription, setSignedIn, setSigningOut, setSubscriptionLanguage]);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(AUTH_EXPIRED_EVENT, (reason?: { path?: string; message?: string }) => {
      logAuthEvent('auth_expired_event', reason ?? {});
      void logout('session_expired');
      Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
    return () => sub.remove();
  }, [logout]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const expiryMs = tokenExpiryMsRef.current;
      if (!expiryMs || !accessToken) return;
      const expired = expiryMs <= Date.now();
      logAuthEvent('app_state_active', {
        tokenExpiry: new Date(expiryMs).toISOString(),
        tokenExpired: expired,
      });
      if (expired) {
        void logout('token_expired_app_resume');
      }
    });
    return () => sub.remove();
  }, [accessToken, logout]);

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
