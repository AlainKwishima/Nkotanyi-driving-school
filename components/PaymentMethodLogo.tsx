import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { PAYMENT_ASSETS } from '../assets/paymentAssets';
import { colors, radii } from '../constants/theme';

export type PaymentMethodLogoKey = 'momo' | 'airtel' | 'card';

const LOGO_CONFIG: Record<
  PaymentMethodLogoKey,
  { source: (typeof PAYMENT_ASSETS)[keyof typeof PAYMENT_ASSETS]; aspectRatio: number }
> = {
  momo: { source: PAYMENT_ASSETS.mtnMomo, aspectRatio: 2.05 },
  airtel: { source: PAYMENT_ASSETS.airtelMoney, aspectRatio: 1 },
  card: { source: PAYMENT_ASSETS.visaMastercard, aspectRatio: 1.65 },
};

type PaymentMethodLogoProps = {
  method: PaymentMethodLogoKey;
  height: number;
};

export function PaymentMethodLogo({ method, height }: PaymentMethodLogoProps) {
  const { source, aspectRatio } = LOGO_CONFIG[method];
  const width = Math.round(height * aspectRatio);

  return (
    <View style={[styles.frame, { width, height }]}>
      <Image source={source} style={styles.image} resizeMode="contain" accessibilityIgnoresInvertColors />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
