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
        { width: m.contentWidth - m.scale(48), height: m.verticalScale(52), borderRadius: m.scale(8) },
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
    width: 342,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#4378DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B264F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.95,
  },
  label: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  icon: {
    marginLeft: 8,
    width: 12,
    height: 12,
  },
});

