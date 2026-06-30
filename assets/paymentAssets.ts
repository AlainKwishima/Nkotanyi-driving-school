export const PAYMENT_ASSETS = {
  mtnMomo: require('./payment/mtn-momo.png'),
  airtelMoney: require('./payment/airtel-money.png'),
  visaMastercard: require('./payment/visa-mastercard.png'),
} as const;

export type PaymentMethodAssetKey = keyof typeof PAYMENT_ASSETS;
