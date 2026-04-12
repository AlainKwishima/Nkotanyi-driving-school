import { apiRequest } from './api/client';
import type { StandardResponse } from './api/types';

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

export async function loginRequest(account: string, password: string): Promise<AuthUser> {
  const res = await apiRequest<StandardResponse<AuthUser>>(`/api/user/login`, {
    method: 'POST',
    body: { account, password },
  });
  if (!res.data) {
    throw new Error('Login response missing data');
  }
  return res.data;
}

export async function signupRequest(
  name: string,
  phone: string,
  password: string,
  language: 'en' | 'rw' | 'fr',
): Promise<AuthUser> {
  const res = await apiRequest<StandardResponse<AuthUser>>(`/api/user/signup`, {
    method: 'POST',
    body: { name, phone, password, language },
  });
  if (!res.data) {
    throw new Error('Signup response missing data');
  }
  return res.data;
}

export async function logoutRequest(accessToken: string): Promise<void> {
  await apiRequest<StandardResponse<Record<string, never>>>(`/api/user/logout`, {
    method: 'POST',
    body: {},
    accessToken,
  });
}
