import { apiRequest, unwrapApiPayload } from './api/client';
import type { SubscriptionType } from './api/subscriptionTypes';
import { toIntlRwandaPhone, toLocalRwandaPhone } from '../utils/phone';
import type { ContentLanguageCode } from '../context/AppFlowContext';

export type MomoPaymentBody = {
  amount: number;
  payment_method: 'momo' | 'airtel' | 'card';
  phone: string;
  subscription_type: SubscriptionType;
  language?: ContentLanguageCode;
  lang?: ContentLanguageCode;
};

export type CardPaymentBody = Omit<MomoPaymentBody, 'phone'> & {
  phone?: string;
  card_number: string;
  card_name: string;
  card_cvc: string;
  card_expdate: string;
};

function buildCompatiblePaymentBody(body: MomoPaymentBody) {
  const paymentMethod = body.payment_method.toUpperCase();
  const localPhone = toLocalRwandaPhone(body.phone) ?? body.phone;
  const intlPhone = toIntlRwandaPhone(body.phone) ?? (localPhone ? `250${localPhone.slice(1)}` : body.phone);
  const language = body.language ?? body.lang;
  return {
    ...body,
    phone: localPhone,
    amountRwf: body.amount,
    amount_rwf: body.amount,
    // Backend compatibility: some deployments accept camelCase variants.
    paymentMethod,
    payment_method: body.payment_method,
    subscriptionType: body.subscription_type,
    msisdn: localPhone,
    msisdnIntl: intlPhone,
    customer_phone: localPhone,
    customer_phone_intl: intlPhone,
    phone_number: localPhone,
    phone_number_intl: intlPhone,
    phoneNumber: localPhone,
    phoneIntl: intlPhone,
    language,
    lang: language,
  };
}

export async function initiateMomoPayment(body: MomoPaymentBody, accessToken: string): Promise<unknown> {
  const json = await apiRequest<unknown>(`/api/payment/momo-payment`, {
    method: 'POST',
    body: buildCompatiblePaymentBody(body),
    accessToken,
  });
  try {
    return unwrapApiPayload(json);
  } catch {
    return json;
  }
}

export async function initiateAirtelPayment(body: MomoPaymentBody, accessToken: string): Promise<unknown> {
  const json = await apiRequest<unknown>(`/api/payment/airtel-payment`, {
    method: 'POST',
    body: buildCompatiblePaymentBody(body),
    accessToken,
  });
  try {
    return unwrapApiPayload(json);
  } catch {
    return json;
  }
}

export async function initiateCardPayment(
  body: CardPaymentBody,
  accessToken: string,
): Promise<unknown> {
  const phone = body.phone ?? '';
  const language = body.language ?? body.lang;
  const json = await apiRequest<unknown>(`/api/payment/card-payment`, {
    method: 'POST',
    body: {
      ...body,
      amountRwf: body.amount,
      amount_rwf: body.amount,
      phone,
      paymentMethod: 'CARD',
      payment_method: 'card',
      subscriptionType: body.subscription_type,
      msisdn: phone,
      msisdnIntl: toIntlRwandaPhone(phone) ?? phone,
      customer_phone: phone,
      customer_phone_intl: toIntlRwandaPhone(phone) ?? phone,
      phone_number: phone,
      phone_number_intl: toIntlRwandaPhone(phone) ?? phone,
      phoneNumber: phone,
      phoneIntl: toIntlRwandaPhone(phone) ?? phone,
      language,
      lang: language,
    },
    accessToken,
  });
  try {
    return unwrapApiPayload(json);
  } catch {
    return json;
  }
}

export async function checkPaymentStatus(body: { req_ref: string } | Record<string, unknown>, accessToken?: string): Promise<unknown> {
  const record = body as Record<string, unknown>;
  const reqRef =
    typeof record.req_ref === 'string'
      ? record.req_ref
      : typeof record.reqRef === 'string'
        ? record.reqRef
        : typeof record.reference === 'string'
          ? record.reference
          : '';
  const requestBody = reqRef ? { req_ref: reqRef } : body;
  const json = await apiRequest<unknown>(`/api/payment/check-payment-status`, {
    method: 'POST',
    body: requestBody,
    accessToken,
  });
  try {
    return unwrapApiPayload(json);
  } catch {
    return json;
  }
}

export async function getMyRecentPayment(accessToken: string, since?: number): Promise<unknown | null> {
  const path = since ? `/api/payment/my-recent-payment?since=${encodeURIComponent(String(since))}` : `/api/payment/my-recent-payment`;
  const json = await apiRequest<unknown>(path, {
    method: 'GET',
    accessToken,
    headers: { token: `Bearer ${accessToken}` },
  });
  if (json && typeof json === 'object' && !Array.isArray(json) && 'data' in json && (json as { data?: unknown }).data == null) {
    return null;
  }
  try {
    return unwrapApiPayload(json) ?? null;
  } catch {
    return json ?? null;
  }
}
