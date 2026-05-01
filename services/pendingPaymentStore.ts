import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ContentLanguageCode } from '../context/AppFlowContext';
import type { SubscriptionType } from './api/subscriptionTypes';

export type PendingPaymentMethod = 'momo' | 'airtel' | 'card';

export type PendingPaymentRecord = {
  reqRef: string;
  method: PendingPaymentMethod;
  subscriptionType: SubscriptionType;
  amountRwf: number;
  language: ContentLanguageCode;
  planTitle: string;
  createdAt: string;
  orderId?: string;
  checkoutUrl?: string | null;
  phone?: string | null;
  userId?: string | null;
};

const PENDING_PAYMENT_KEY = 'nkotanyi.payment.pending.v1';

function isPendingPaymentMethod(value: unknown): value is PendingPaymentMethod {
  return value === 'momo' || value === 'airtel' || value === 'card';
}

function isSubscriptionType(value: unknown): value is SubscriptionType {
  return (
    value === 'two-exams' ||
    value === 'five-exams' ||
    value === 'daily' ||
    value === 'weekly' ||
    value === 'two-weekly' ||
    value === 'monthly'
  );
}

function isLanguage(value: unknown): value is ContentLanguageCode {
  return value === 'rw' || value === 'en' || value === 'fr';
}

function coercePendingPayment(raw: unknown): PendingPaymentRecord | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (
    typeof obj.reqRef !== 'string' ||
    !obj.reqRef.trim() ||
    !isPendingPaymentMethod(obj.method) ||
    !isSubscriptionType(obj.subscriptionType) ||
    typeof obj.amountRwf !== 'number' ||
    !Number.isFinite(obj.amountRwf) ||
    !isLanguage(obj.language) ||
    typeof obj.planTitle !== 'string' ||
    !obj.planTitle.trim() ||
    typeof obj.createdAt !== 'string' ||
    !obj.createdAt.trim()
  ) {
    return null;
  }

  return {
    reqRef: obj.reqRef.trim(),
    method: obj.method,
    subscriptionType: obj.subscriptionType,
    amountRwf: obj.amountRwf,
    language: obj.language,
    planTitle: obj.planTitle.trim(),
    createdAt: obj.createdAt.trim(),
    orderId: typeof obj.orderId === 'string' && obj.orderId.trim() ? obj.orderId.trim() : undefined,
    checkoutUrl: typeof obj.checkoutUrl === 'string' && obj.checkoutUrl.trim() ? obj.checkoutUrl.trim() : null,
    phone: typeof obj.phone === 'string' && obj.phone.trim() ? obj.phone.trim() : null,
    userId: typeof obj.userId === 'string' && obj.userId.trim() ? obj.userId.trim() : null,
  };
}

export async function readPendingPayment(): Promise<PendingPaymentRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return null;
    return coercePendingPayment(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function savePendingPayment(record: PendingPaymentRecord): Promise<void> {
  await AsyncStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(record));
}

export async function clearPendingPayment(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
}
