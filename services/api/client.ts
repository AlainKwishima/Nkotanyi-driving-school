import { API_BASE_URL } from '../../config/api';
import { ApiError, type StandardResponse } from './types';

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  accessToken?: string | null;
};

function joinUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, accessToken, headers: extraHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(joinUrl(path), {
    ...rest,
    headers,
    body: body === undefined || body === null ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(text.slice(0, 200) || 'Invalid response', res.status);
  }

  const payload = json as StandardResponse<T> & { message?: string; error?: string };

  if (!res.ok) {
    const msg =
      typeof payload?.message === 'string'
        ? payload.message
        : typeof (payload as { error?: string })?.error === 'string'
          ? (payload as { error: string }).error
          : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, payload?.error, payload);
  }

  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    'status' in payload &&
    typeof (payload as { status: number }).status === 'number' &&
    (payload as { status: number }).status >= 400
  ) {
    const msg = typeof payload.message === 'string' ? payload.message : 'Request failed';
    throw new ApiError(msg, (payload as { status: number }).status, payload.error, payload);
  }

  return json as T;
}

export function getMessageFromUnknownError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
}
