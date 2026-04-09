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
        { height: m.verticalScale(50), borderRadius: m.scale(12) },
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
    height: 50,
    borderRadius: 12,
    backgroundColor: '#4C7DDD',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#1F2F54',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.95,
  },
  label: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  icon: {
    marginLeft: 7,
  },
});
