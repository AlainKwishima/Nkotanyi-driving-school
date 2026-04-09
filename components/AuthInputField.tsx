import React from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';
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
}: AuthInputFieldProps) {
  const m = useMobile();
  const outline = variant === 'outline';

  return (
    <View style={style}>
      {label ? <Text style={[styles.label, { marginBottom: m.verticalScale(8), fontSize: m.fontScale(13), lineHeight: m.fontScale(20) }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          { height: m.verticalScale(48), borderRadius: m.scale(11), paddingHorizontal: m.scale(14) },
          outline ? styles.inputWrapOutline : styles.inputWrapFilled,
        ]}
      >
        <Feather name={leftIcon} size={m.scale(17)} color={outline ? '#C5C8D2' : '#8A8FA2'} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#A8AAB4"
          secureTextEntry={secureTextEntry}
          style={[styles.input, { marginHorizontal: m.scale(10), fontSize: m.fontScale(14), lineHeight: m.fontScale(20) }, inputStyle]}
        />
        {rightIcon ? <Feather name={rightIcon} size={m.scale(17)} color="#BCBEC7" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: '#5E6272',
    textTransform: 'uppercase',
  },
  inputWrap: {
    width: '100%',
    height: 48,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
  },
  inputWrapFilled: {
    borderColor: '#DDDDE5',
    backgroundColor: '#F5F5F8',
  },
  inputWrapOutline: {
    borderColor: '#A6ABBB',
    backgroundColor: '#F6F5F9',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#252B3A',
    paddingVertical: 0,
  },
});
