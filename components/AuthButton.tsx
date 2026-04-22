import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useMobile } from '../hooks/useMobile';

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
      <Text style={[styles.label, { fontSize: m.fontScale(13), lineHeight: m.fontScale(20) }]}>{label}</Text>
      {withArrow ? <Feather name="arrow-right" size={m.scale(16)} color="#FFFFFF" style={[styles.icon, { marginLeft: m.scale(7) }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  },
  icon: {
    marginLeft: 7,
  },
});
