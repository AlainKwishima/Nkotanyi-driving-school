/**
 * Allowed `subscription_type` values for MoMo / Airtel / card payment endpoints.
 * Confirmed from live API validation (`POST /api/payment/momo-payment` with invalid type).
 *
 * @see https://www.ibyapa.com/docs/ — Payment section
 */
export const SUBSCRIPTION_TYPES = ['two-exams', 'five-exams', 'daily', 'weekly', 'two-weekly', 'monthly'] as const;

export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number];
