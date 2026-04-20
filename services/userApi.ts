import { apiRequest, unwrapApiPayload } from './api/client';
import type { ContentLanguageCode } from '../context/AppFlowContext';

export type UserAndPayment = {
  user: {
    _id: string;
    name: string;
    phone: string;
    hasAttemptedTrial?: boolean;
    trialAttempts?: number;
    language?: string;
    /** Privileged roles (admin / tester) always get full access. */
    role?: string;
    /** Some backends set this directly on the user object. */
    isSubscribed?: boolean;
    subscriptionStatus?: string;
    subscriptionActive?: boolean;
    hasActiveSubscription?: boolean;
    /** Plan object or plan name stored on the user. */
    plan?: unknown;
    planName?: string;
    /** Expiry date stored as ISO string or timestamp. */
    subscriptionExpiry?: string | number | null;
    subscriptionExpiresAt?: string | number | null;
    expiresAt?: string | number | null;
  };
  payment: unknown[];
};

function normalizeLanguageCode(raw: unknown): ContentLanguageCode | null {
  const value = String(raw ?? '').toLowerCase().trim();
  if (!value) return null;
  if (value === 'en' || value.includes('english')) return 'en';
  if (value === 'rw' || value.includes('kinyarwanda') || value.includes('rwanda')) return 'rw';
  if (value === 'fr' || value.includes('french') || value.includes('français') || value.includes('francais')) return 'fr';
  return null;
}

function toTimestamp(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = Date.parse(String(raw));
  return Number.isFinite(parsed) ? parsed : 0;
}

function paymentSortKey(payment: unknown): number {
  if (!payment || typeof payment !== 'object') return 0;
  const o = payment as Record<string, unknown>;
  return Math.max(
    toTimestamp(o.createdAt),
    toTimestamp(o.created_at),
    toTimestamp(o.updatedAt),
    toTimestamp(o.updated_at),
    toTimestamp(o.paymentDate),
    toTimestamp(o.payment_date),
    toTimestamp(o.subscriptionEnd),
    toTimestamp(o.subscriptionExpiry),
    toTimestamp(o.subscriptionExpiresAt),
    toTimestamp(o.expiresAt),
  );
}

function paymentLanguage(payment: unknown): ContentLanguageCode | null {
  if (!payment || typeof payment !== 'object') return null;
  const o = payment as Record<string, unknown>;
  return normalizeLanguageCode(
    o.language ??
      o.lang ??
      o.locale ??
      o.subscriptionLanguage ??
      o.subscription_language ??
      o.contentLanguage ??
      o.content_language,
  );
}

export async function getUserAndPayment(userId: string, accessToken: string): Promise<UserAndPayment> {
  const json = await apiRequest<unknown>(`/api/user/get-user-and-payment/${userId}`, {
    method: 'GET',
    accessToken,
  });
  const data = unwrapApiPayload<UserAndPayment>(json);
  if (!data || typeof data !== 'object' || !('user' in data)) {
    throw new Error('Profile response missing data');
  }
  return data;
}

/**
 * Checks whether an expiry date string/timestamp is in the future.
 * Returns true (still valid) for any value we can't parse — fail open.
 */
function expiryIsValid(raw: string | number | null | undefined): boolean {
  if (raw == null) return false;
  const ts = typeof raw === 'number' ? raw : Date.parse(String(raw));
  if (!Number.isFinite(ts)) return true; // unparseable — assume valid
  return ts > Date.now();
}

/**
 * Returns true if the payment record's subscription has not yet expired.
 * Falls back to true when no expiry field is present (treat as unlimited).
 *
 * Known backend expiry field names:
 *   subscriptionEnd  ← confirmed from live API response
 */
function paymentNotExpired(o: Record<string, unknown>): boolean {
  const exp =
    o.subscriptionEnd ??       // ← live backend field
    o.subscriptionExpiry ??
    o.subscriptionExpiresAt ??
    o.expiresAt ??
    o.expiry ??
    o.validUntil ??
    o.endDate ??
    o.end_date;
  if (exp == null) return true; // no expiry field → treat as active
  return expiryIsValid(exp as string | number);
}

/**
 * Detects an active subscription from the raw payment array returned by the
 * backend.
 *
 * Live API shape (confirmed from logs):
 *   { paymentStatus: true, subscriptionEnd: "2026-05-13T…", subscription_type: "monthly", … }
 */
export function paymentsIndicateActiveSubscription(payments: unknown): boolean {
  if (!Array.isArray(payments) || payments.length === 0) return false;

  const activeStatuses = new Set([
    'approved', 'active', 'completed', 'success', 'paid',
    'successful', 'confirmed', 'valid', 'activated',
    'subscribed', 'enabled', 'processing',
  ]);

  return payments.some((p) => {
    if (!p || typeof p !== 'object') return false;
    const o = p as Record<string, unknown>;

    // ── Boolean flags ────────────────────────────────────────────────────────
    // Live backend: `paymentStatus: true` (boolean, not a string)
    if (o.paymentStatus === true) return paymentNotExpired(o);
    if (o.isActive === true) return paymentNotExpired(o);
    if (o.subscriptionActive === true) return paymentNotExpired(o);
    if (o.hasActiveSubscription === true) return paymentNotExpired(o);
    if (o.isSubscribed === true) return paymentNotExpired(o);
    if (o.active === true) return paymentNotExpired(o);

    // ── Status-string checks ─────────────────────────────────────────────────
    const rawStatus = o.status ?? o.state ?? o.subscriptionStatus;
    // Only cast paymentStatus to string if it's actually a string
    const statusStr =
      typeof o.paymentStatus === 'string' ? o.paymentStatus : '';
    const status = String(rawStatus ?? statusStr ?? '').toLowerCase().trim();
    if (status && activeStatuses.has(status)) return paymentNotExpired(o);

    // ── Expiry-only records ──────────────────────────────────────────────────
    const hasExpiry =
      o.subscriptionEnd != null ||      // ← confirmed backend field
      o.subscriptionExpiry != null ||
      o.subscriptionExpiresAt != null ||
      o.expiresAt != null ||
      o.expiry != null ||
      o.validUntil != null ||
      o.endDate != null ||
      o.end_date != null;
    if (hasExpiry) return paymentNotExpired(o);

    return false;
  });
}

/** Privileged roles that always receive full, unlimited access. */
const PRIVILEGED_ROLES = new Set([
  'admin',
  'administrator',
  'superadmin',
  'super_admin',
  'tester',
  'test',
  'staff',
  'moderator',
]);

/**
 * Master subscription check: inspects BOTH the user object and the payment
 * array.  Web-based subscriptions often leave a flag directly on the user
 * record rather than (or in addition to) creating a payment entry that the
 * mobile flow would recognise.
 *
 * Precedence:
 *   1. Privileged role → always granted.
 *   2. User-level subscription fields → checked next.
 *   3. Payment array → final fallback.
 */
export function profileIndicatesActiveSubscription(profile: UserAndPayment): boolean {
  const u = profile.user;

  // 1. Privileged roles always get full access
  if (u.role && PRIVILEGED_ROLES.has(String(u.role).toLowerCase().trim())) {
    return true;
  }

  // 2. Direct boolean flags on the user object
  if (u.isSubscribed === true) return true;
  if (u.subscriptionActive === true) return true;
  if (u.hasActiveSubscription === true) return true;

  // 3. Subscription status string on the user object
  const uStatus = String(u.subscriptionStatus ?? '').toLowerCase().trim();
  if (uStatus && uStatus !== 'none' && uStatus !== 'inactive' && uStatus !== 'expired' && uStatus !== 'cancelled') {
    return true;
  }

  // 4. Non-null plan stored on user + valid expiry
  if (u.plan != null && u.plan !== '' && u.plan !== false) {
    const expiry = u.subscriptionExpiry ?? u.subscriptionExpiresAt ?? u.expiresAt;
    if (expiry == null || expiryIsValid(expiry)) return true;
  }

  // 5. Plan name stored on user (non-empty, non-"none")
  if (u.planName && u.planName.trim() !== '' && u.planName.toLowerCase() !== 'none') {
    const expiry = u.subscriptionExpiry ?? u.subscriptionExpiresAt ?? u.expiresAt;
    if (expiry == null || expiryIsValid(expiry)) return true;
  }

  // 6. Expiry date on user object is in the future
  const userExpiry = u.subscriptionExpiry ?? u.subscriptionExpiresAt ?? u.expiresAt;
  if (userExpiry != null && expiryIsValid(userExpiry)) return true;

  // 7. Fall back to scanning the payment array
  return paymentsIndicateActiveSubscription(profile.payment);
}

/**
 * Highest-tier rule for language switching:
 * only "monthly" (or equivalent plan naming) is allowed.
 */
export function profileHasHighestSubscription(profile: UserAndPayment): boolean {
  const userPlanRaw = String(profile.user.planName ?? profile.user.plan ?? '').toLowerCase();
  const userLooksMonthly =
    userPlanRaw.includes('monthly') ||
    userPlanRaw.includes('one month') ||
    userPlanRaw.includes('month');
  if (userLooksMonthly) return true;

  if (!Array.isArray(profile.payment)) return false;
  return profile.payment.some((p) => {
    if (!p || typeof p !== 'object') return false;
    const o = p as Record<string, unknown>;
    const subType = String(o.subscription_type ?? o.subscriptionType ?? o.planType ?? '').toLowerCase().trim();
    if (subType === 'monthly') return true;
    const planName = String(o.planName ?? o.plan ?? '').toLowerCase();
    return planName.includes('monthly') || planName.includes('one month') || planName.includes('month');
  });
}

/**
 * Extracts the language tied to the latest active subscription/payment.
 * Returns null when the backend profile does not expose a usable active language.
 */
export function latestActiveSubscriptionLanguage(profile: UserAndPayment): ContentLanguageCode | null {
  const userLanguage = normalizeLanguageCode(profile.user.language);

  if (!Array.isArray(profile.payment) || profile.payment.length === 0) {
    return userLanguage;
  }

  const activePayments = profile.payment
    .filter((payment) => {
      if (!payment || typeof payment !== 'object') return false;
      const o = payment as Record<string, unknown>;
      return (
        o.paymentStatus === true ||
        o.isActive === true ||
        o.subscriptionActive === true ||
        o.hasActiveSubscription === true ||
        o.isSubscribed === true ||
        o.active === true ||
        ['approved', 'active', 'completed', 'success', 'paid', 'successful', 'confirmed', 'valid', 'activated', 'processing'].includes(
          String(o.status ?? o.state ?? o.paymentStatus ?? '').toLowerCase().trim(),
        )
      );
    })
    .sort((a, b) => paymentSortKey(b) - paymentSortKey(a));

  for (const payment of activePayments) {
    const lang = paymentLanguage(payment);
    if (lang) return lang;
  }

  return userLanguage;
}
