import { AppText } from './AppText';
import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';

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
        { width: '100%', height: m.touch(56), borderRadius: m.radius(28) },
        pressed && styles.buttonPressed,
      ]}
    >
      <AppText style={[styles.label, { fontSize: m.fontScale(14), lineHeight: m.fontScale(20) }]}>{label}</AppText>
      <Image source={FIGMA_ASSETS.arrowRight} style={[styles.icon, { marginLeft: m.scale(8), width: m.icon(12), height: m.icon(12) }]} resizeMode="contain" />
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
    tintColor: colors.white,
  },
});

