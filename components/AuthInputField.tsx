import { AppText } from './AppText';
import React, { useEffect, useState } from 'react';
import { KeyboardTypeOptions, Pressable, StyleProp, StyleSheet, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useMobile } from '../hooks/useMobile';
import { colors, radii, typography } from '../constants/theme';

type IconName = React.ComponentProps<typeof Feather>['name'];

type AuthInputFieldProps = {
  label?: string;
  placeholder: string;
  leftIcon: IconName;
  rightIcon?: IconName;
  secureTextEntry?: boolean;
  variant?: 'filled' | 'outline';
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  /** Inline validation message (already translated). */
  error?: string | null;
};

export function AuthInputField({
  label,
  placeholder,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  variant = 'filled',
  style,
  inputStyle,
  value,
  onChangeText,
  keyboardType = 'default',
  error,
}: AuthInputFieldProps) {
  const m = useMobile();
  const outline = variant === 'outline';
  const hasError = Boolean(error);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  useEffect(() => {
    setIsSecure(secureTextEntry);
  }, [secureTextEntry]);

  return (
    <View style={style}>
      {label ? <AppText style={[styles.label, { marginBottom: m.verticalScale(8), fontSize: m.fontScale(13), lineHeight: m.fontScale(20) }]}>{label}</AppText> : null}
      <View
        style={[
          styles.inputWrap,
          { height: m.touch(52), borderRadius: m.radius(radii.md), paddingHorizontal: m.scale(14) },
          outline ? styles.inputWrapOutline : styles.inputWrapFilled,
          hasError && styles.inputWrapError,
        ]}
      >
        <Feather name={leftIcon} size={m.icon(18)} color={colors.textMuted} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry ? isSecure : false}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          style={[styles.input, { marginHorizontal: m.scale(10), fontSize: m.fontScale(14), lineHeight: m.fontScale(20) }, inputStyle]}
        />
        {rightIcon ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              if (secureTextEntry) setIsSecure((prev) => !prev);
            }}
            accessibilityRole={secureTextEntry ? 'button' : undefined}
            accessibilityLabel={secureTextEntry ? (isSecure ? 'Show password' : 'Hide password') : undefined}
          >
            <Feather
              name={secureTextEntry ? (isSecure ? rightIcon : 'eye-off') : rightIcon}
              size={m.icon(17)}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText style={[styles.errorText, { marginTop: m.verticalScale(6), fontSize: m.fontScale(12), lineHeight: m.fontScale(17) }]} lines={null}>{error}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.5,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  inputWrap: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
  },
  inputWrapFilled: {
    borderColor: colors.line,
    backgroundColor: colors.surfaceAlt,
  },
  inputWrapOutline: {
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  inputWrapError: {
    borderColor: colors.error,
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    color: colors.error,
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    ...typography.bodyStrong,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});
