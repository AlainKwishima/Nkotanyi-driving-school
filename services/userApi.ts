import { apiRequest } from './api/client';
import type { StandardResponse } from './api/types';

export type UserAndPayment = {
  user: {
    _id: string;
    name: string;
    phone: string;
    hasAttemptedTrial?: boolean;
    trialAttempts?: number;
    language?: string;
  };
  payment: unknown[];
};

export async function getUserAndPayment(userId: string, accessToken: string): Promise<UserAndPayment> {
  const res = await apiRequest<StandardResponse<UserAndPayment>>(`/api/user/get-user-and-payment/${userId}`, {
    method: 'GET',
    accessToken,
  });
  if (!res.data) {
    throw new Error('Profile response missing data');
  }
  return res.data;
}

export function paymentsIndicateActiveSubscription(payments: unknown): boolean {
  if (!Array.isArray(payments) || payments.length === 0) return false;
  return payments.some((p) => {
    if (!p || typeof p !== 'object') return false;
    const o = p as Record<string, unknown>;
    const status = String(o.status ?? o.paymentStatus ?? o.state ?? '').toLowerCase();
    if (['approved', 'active', 'completed', 'success', 'paid'].includes(status)) return true;
    if (o.isActive === true) return true;
    if (o.subscriptionActive === true) return true;
    return false;
  });
}
