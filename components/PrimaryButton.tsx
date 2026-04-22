import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { useMobile } from '../hooks/useMobile';

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
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.95,
  },
  label: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  icon: {
    marginLeft: 8,
    width: 14,
    height: 14,
    tintColor: '#FFFFFF',
  },
});

