import React, { useEffect, useState } from 'react';
import { KeyboardTypeOptions, Pressable, StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useMobile } from '../hooks/useMobile';

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
      {label ? <Text style={[styles.label, { marginBottom: m.verticalScale(8), fontSize: m.fontScale(13), lineHeight: m.fontScale(20) }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          { height: m.verticalScale(48), borderRadius: m.scale(11), paddingHorizontal: m.scale(14) },
          outline ? styles.inputWrapOutline : styles.inputWrapFilled,
          hasError && styles.inputWrapError,
        ]}
      >
        <Feather name={leftIcon} size={m.scale(17)} color={outline ? '#C5C8D2' : '#8A8FA2'} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#A8AAB4"
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
              size={m.scale(17)}
              color="#BCBEC7"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.errorText, { marginTop: m.verticalScale(6), fontSize: m.fontScale(12), lineHeight: m.fontScale(17) }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.5,
    color: '#64748B',
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
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  inputWrapOutline: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  inputWrapError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#EF4444',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
    paddingVertical: 0,
  },
});
