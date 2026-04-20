import { apiRequest, unwrapApiPayload } from './api/client';
import type { SubscriptionType } from './api/subscriptionTypes';
import { toIntlRwandaPhone, toLocalRwandaPhone } from '../utils/phone';

export type MomoPaymentBody = {
  amount: number;
  payment_method: 'momo' | 'airtel' | 'card';
  phone: string;
  subscription_type: SubscriptionType;
};

function buildCompatiblePaymentBody(body: MomoPaymentBody) {
  const paymentMethod = body.payment_method.toUpperCase();
  const localPhone = toLocalRwandaPhone(body.phone) ?? body.phone;
  const intlPhone = toIntlRwandaPhone(body.phone) ?? (localPhone ? `250${localPhone.slice(1)}` : body.phone);
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
  body: Omit<MomoPaymentBody, 'phone'> & { phone?: string },
  accessToken: string,
): Promise<unknown> {
  const phone = body.phone ?? '';
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
    },
    accessToken,
  });
  try {
    return unwrapApiPayload(json);
  } catch {
    return json;
  }
}

export async function checkPaymentStatus(body: Record<string, unknown>, accessToken: string): Promise<unknown> {
  const json = await apiRequest<unknown>(`/api/payment/check-payment-status`, {
    method: 'POST',
    body,
    accessToken,
  });
  try {
    return unwrapApiPayload(json);
  } catch {
    return json;
  }
}
