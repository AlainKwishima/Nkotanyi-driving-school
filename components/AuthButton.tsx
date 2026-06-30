import { AppText } from './AppText';
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
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
        { height: m.touch(56), borderRadius: m.radius(28) },
        style,
        pressed && styles.buttonPressed,
      ]}
    >
      <AppText style={[styles.label, { fontSize: m.fontScale(15), lineHeight: m.fontScale(20) }]}>{label}</AppText>
      {withArrow ? <Feather name="arrow-right" size={m.icon(17)} color={colors.white} style={[styles.icon, { marginLeft: m.scale(8) }]} /> : null}
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
