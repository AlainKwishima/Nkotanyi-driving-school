import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useScreenColumnStyle } from '../hooks/useResponsiveLayout';

type ScreenColumnProps = ViewProps & {
  backgroundColor?: string;
  children: React.ReactNode;
};

/**
 * Centered content column: full width up to a responsive max (phone vs tablet / desktop web).
 */
export function ScreenColumn({ backgroundColor, style, children, ...rest }: ScreenColumnProps) {
  const column = useScreenColumnStyle();
  return (
    <View style={[styles.base, column, backgroundColor != null && { backgroundColor }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
