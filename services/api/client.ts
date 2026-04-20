import { DeviceEventEmitter } from 'react-native';
import { API_BASE_URL } from '../../config/api';
import { ApiError, type StandardResponse } from './types';

const REQUEST_TIMEOUT_MS = 45_000;

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  accessToken?: string | null;
  skipAuthExpiredHandling?: boolean;
};

/**
 * Unwraps `{ data: ... }` chains. Does **not** descend into `user`, because many APIs return
 * `{ accessToken, user: { _id, ... } }` and drilling into `user` would drop the token.
 */
export function unwrapApiPayload<T>(body: unknown): T {
  let cur: unknown = body;
  for (let i = 0; i < 8; i += 1) {
    if (cur === null || cur === undefined) {
      throw new ApiError('Invalid response from server', 500);
    }
    if (Array.isArray(cur)) {
      return cur as T;
    }
    if (typeof cur !== 'object') {
      return cur as T;
    }
    const o = cur as Record<string, unknown>;
    if ('data' in o && o.data !== undefined && o.data !== null) {
      cur = o.data;
      continue;
    }
    return cur as T;
  }
  throw new ApiError('Invalid response from server', 500);
}

function joinUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const pathname = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE_URL.replace(/\/+$/, '');
  // `base + "/api/..."` must never produce `https://host//api` — that path returns 404 on ibyapa.
  try {
    return new URL(pathname, `${base}/`).href;
  } catch {
    return `${base}${pathname}`.replace(/([^:]\/)\/+/g, '$1');
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, accessToken, skipAuthExpiredHandling, headers: extraHeaders, signal: outerSignal, ...rest } = options;
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  if (outerSignal) {
    if (outerSignal.aborted) controller.abort();
    else outerSignal.addEventListener('abort', onOuterAbort);
  }

  let res: Response;
  try {
    res = await fetch(joinUrl(path), {
      ...rest,
      signal: controller.signal,
      headers,
      body: body === undefined || body === null ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ApiError('Request timed out. Check your connection and try again.', 408);
    }
    throw new ApiError(e instanceof Error ? e.message : 'Network error', 0);
  } finally {
    clearTimeout(timeoutId);
    if (outerSignal) {
      outerSignal.removeEventListener('abort', onOuterAbort);
    }
  }

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

    if (res.status === 401 && !skipAuthExpiredHandling) {
      DeviceEventEmitter.emit('AUTH_EXPIRED');
    }

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
    const statusVal = (payload as { status: number }).status;
    const msg = typeof payload.message === 'string' ? payload.message : 'Request failed';

    if (statusVal === 401 && !skipAuthExpiredHandling) {
      DeviceEventEmitter.emit('AUTH_EXPIRED');
    }

    throw new ApiError(msg, statusVal, payload.error, payload);
  }

  return json as T;
}

export function getMessageFromUnknownError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
}
