import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useMobile } from '../hooks/useMobile';
import { colors, shadows, typography } from '../constants/theme';

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  withArrow?: boolean;
  style?: ViewStyle;
};

export function AuthButton({ label, onPress, withArrow = false, style }: AuthButtonProps) {
  const m = useMobile();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { height: m.verticalScale(56), borderRadius: m.scale(28) },
        style,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.label, { fontSize: m.fontScale(15), lineHeight: m.fontScale(20) }]}>{label}</Text>
      {withArrow ? <Feather name="arrow-right" size={m.scale(17)} color={colors.white} style={[styles.icon, { marginLeft: m.scale(8) }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.card,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  icon: {
    marginLeft: 7,
  },
});
