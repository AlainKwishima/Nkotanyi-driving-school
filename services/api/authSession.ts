export type AuthExpiredReason = {
  path: string;
  httpStatus: number;
  message: string;
  errorCode?: string;
  tokenExpiry?: string | null;
  tokenExpired?: boolean;
};

const SUBSCRIPTION_ACCESS_HINTS = [
  'subscrib',
  'ifatabuguzi',
  'fatabuguzi',
  'ntiwemerewe',
  'access denied',
  'active time-based plan',
  'please subscribe',
  'payment',
  'trial',
  'igerageza',
  'nta fatabuguzi',
];

const SESSION_INVALID_HINTS = [
  'jwt expired',
  'jwt malformed',
  'invalid token',
  'token expired',
  'expired token',
  'session expired',
  'session invalid',
  'not authenticated',
  'authentication failed',
  'login again',
  'no token',
  'token missing',
  'invalid signature',
];

function payloadText(payload: unknown): { message: string; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { message: '', error: '' };
  }
  const o = payload as Record<string, unknown>;
  return {
    message: String(o.message ?? '').trim(),
    error: String(o.error ?? '').trim(),
  };
}

/** True when the backend rejected access for subscription/plan reasons — not a dead login session. */
export function isSubscriptionOrPermissionDenied(httpStatus: number, payload: unknown): boolean {
  if (httpStatus !== 401 && httpStatus !== 403) return false;
  const { message, error } = payloadText(payload);
  const combined = `${message} ${error}`.toLowerCase();
  if (SESSION_INVALID_HINTS.some((hint) => combined.includes(hint))) return false;
  return SUBSCRIPTION_ACCESS_HINTS.some((hint) => combined.includes(hint));
}

/**
 * Only genuine session/token failures should force logout.
 * Subscription-gated 401/403 responses must NOT clear the stored session.
 */
export function shouldForceLogout(httpStatus: number, payload: unknown, accessToken?: string | null): boolean {
  if (httpStatus !== 401 && httpStatus !== 403) return false;

  const { message, error } = payloadText(payload);
  const combined = `${message} ${error}`.toLowerCase();

  // Token/session errors take precedence. Generic "unauthorized" responses can also be subscription
  // denials, so we only match explicit session-invalid phrases here.
  if (accessToken && isTokenExpired(accessToken, 0)) {
    return true;
  }
  if (SESSION_INVALID_HINTS.some((hint) => combined.includes(hint))) return true;

  return false;
}

export function decodeJwtExpiryMs(token: string): number | null {
  const exp = decodeJwtExpiry(token);
  return exp ? exp.getTime() : null;
}

export function isTokenExpired(token: string | null | undefined, skewMs = 0): boolean {
  if (!token) return false;
  const expiryMs = decodeJwtExpiryMs(token);
  if (expiryMs == null) return false;
  return expiryMs <= Date.now() + skewMs;
}

export function decodeJwtExpiry(token: string): Date | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const json = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof json.exp !== 'number' || !Number.isFinite(json.exp)) return null;
    return new Date(json.exp * 1000);
  } catch {
    return null;
  }
}

export function formatTokenExpiry(token: string | null | undefined): string {
  if (!token) return 'none';
  const exp = decodeJwtExpiry(token);
  if (!exp) return 'unknown';
  return `${exp.toISOString()} (${Math.round((exp.getTime() - Date.now()) / 60_000)} min remaining)`;
}

export function logAuthEvent(event: string, detail?: Record<string, unknown>): void {
  if (!__DEV__) return;
  console.log(`[Auth] ${event}`, detail ?? '');
}
