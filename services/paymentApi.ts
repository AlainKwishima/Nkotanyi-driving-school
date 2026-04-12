import { apiRequest } from './api/client';
import type { StandardResponse } from './api/types';
import type { SubscriptionType } from './api/subscriptionTypes';

export type MomoPaymentBody = {
  amount: number;
  payment_method: 'momo' | 'airtel' | 'card';
  phone: string;
  subscription_type: SubscriptionType;
};

export async function initiateMomoPayment(body: MomoPaymentBody, accessToken: string): Promise<unknown> {
  const res = await apiRequest<StandardResponse<unknown>>(`/api/payment/momo-payment`, {
    method: 'POST',
    body,
    accessToken,
  });
  return res.data ?? res;
}

export async function initiateAirtelPayment(body: MomoPaymentBody, accessToken: string): Promise<unknown> {
  const res = await apiRequest<StandardResponse<unknown>>(`/api/payment/airtel-payment`, {
    method: 'POST',
    body,
    accessToken,
  });
  return res.data ?? res;
}

export async function initiateCardPayment(
  body: Omit<MomoPaymentBody, 'phone'> & { phone?: string },
  accessToken: string,
): Promise<unknown> {
  const res = await apiRequest<StandardResponse<unknown>>(`/api/payment/card-payment`, {
    method: 'POST',
    body,
    accessToken,
  });
  return res.data ?? res;
}

export async function checkPaymentStatus(body: Record<string, unknown>, accessToken: string): Promise<unknown> {
  const res = await apiRequest<StandardResponse<unknown>>(`/api/payment/check-payment-status`, {
    method: 'POST',
    body,
    accessToken,
  });
  return res.data ?? res;
}
