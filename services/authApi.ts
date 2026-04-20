import { loginAccountVariants, normalizeAccountPhone, normalizeLoginPhoneInput } from '../utils/phone';
import { apiRequest, unwrapApiPayload } from './api/client';
import { ApiError } from './api/types';

export type AuthUser = {
  _id: string;
  name: string;
  phone: string;
  role: string;
  language?: string;
  hasAttemptedTrial?: boolean;
  trialAttempts?: number;
  accessToken?: string;
};

function coerceRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    throw new Error('Auth response missing user payload');
  }
  return v as Record<string, unknown>;
}

/** Normalizes id / token field names the backend may use interchangeably. */
function parseAuthUser(json: unknown): AuthUser {
  const top = coerceRecord(unwrapApiPayload<unknown>(json));
  // Common shape: { accessToken, user: { _id, name, phone, ... } }
  let raw: Record<string, unknown> = top;
  if (top.user && typeof top.user === 'object' && !Array.isArray(top.user)) {
    const u = top.user as Record<string, unknown>;
    raw = {
      ...u,
      accessToken: top.accessToken ?? top.token ?? top.jwt ?? u.accessToken,
      token: top.token ?? u.token,
      refreshToken: top.refreshToken,
    };
  }
  const _id = String(raw._id ?? raw.id ?? raw.userId ?? '').trim();
  const accessToken =
    typeof raw.accessToken === 'string'
      ? raw.accessToken
      : typeof raw.token === 'string'
        ? raw.token
        : typeof raw.jwt === 'string'
          ? raw.jwt
          : undefined;
  if (!accessToken) {
    throw new Error('Login response missing access token');
  }
  if (!_id) {
    throw new Error('Login response missing user id');
  }
  return {
    _id,
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    role: String(raw.role ?? 'user'),
    language: typeof raw.language === 'string' ? raw.language : undefined,
    hasAttemptedTrial: typeof raw.hasAttemptedTrial === 'boolean' ? raw.hasAttemptedTrial : undefined,
    trialAttempts: typeof raw.trialAttempts === 'number' ? raw.trialAttempts : undefined,
    accessToken,
  };
}

export async function loginRequest(accountRaw: string, password: string): Promise<AuthUser> {
  const intl = normalizeAccountPhone(normalizeLoginPhoneInput(accountRaw));
  const pwd = password.trim();
  const variants = loginAccountVariants(intl);
  let lastError: unknown;
  for (const account of variants) {
    try {
      const json = await apiRequest<unknown>(`/api/user/login`, {
        method: 'POST',
        body: { account, password: pwd },
        skipAuthExpiredHandling: true,
      });
      return parseAuthUser(json);
    } catch (e) {
      lastError = e;
      if (e instanceof ApiError) {
        // Wrong password for a real row (local `079…` path returns 401, not 404).
        if (e.status === 401) throw e;
        if (e.status === 422) throw e;
        // Wrong `account` string for this user → try next variant (e.g. 250 vs 078).
        if (e.status === 404 || e.code === 'USER_NOT_FOUND') continue;
      }
      throw e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Login failed');
}

export async function signupRequest(
  name: string,
  phone: string,
  password: string,
  language: 'en' | 'rw' | 'fr',
): Promise<void> {
  await apiRequest<unknown>(`/api/user/signup`, {
    method: 'POST',
    body: { name, phone, password, language },
    skipAuthExpiredHandling: true,
  });
}

export async function logoutRequest(accessToken: string): Promise<void> {
  await apiRequest<unknown>(`/api/user/logout`, {
    method: 'POST',
    body: {},
    accessToken,
  });
}
