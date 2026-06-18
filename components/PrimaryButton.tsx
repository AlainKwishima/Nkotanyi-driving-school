import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { useMobile } from '../hooks/useMobile';
import { colors, shadows, typography } from '../constants/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
};

export function PrimaryButton({ label, onPress }: PrimaryButtonProps) {
  const m = useMobile();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: '100%', height: m.verticalScale(56), borderRadius: m.scale(28) },
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.label, { fontSize: m.fontScale(14), lineHeight: m.fontScale(20) }]}>{label}</Text>
      <Image source={FIGMA_ASSETS.arrowRight} style={[styles.icon, { width: m.scale(12), height: m.scale(12) }]} resizeMode="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  label: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.white,
    textAlign: 'center',
  },
  icon: {
    marginLeft: 8,
    width: 14,
    height: 14,
    tintColor: colors.white,
  },
});

