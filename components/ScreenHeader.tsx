import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { colors, spacing, typography } from '../constants/theme';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
};

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <Pressable onPress={onBack} style={styles.back} disabled={!onBack} hitSlop={8}>
        {onBack ? <Ionicons name="chevron-back" size={24} color={colors.ink} /> : null}
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.backSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvas,
  },
  back: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
  },
  title: {
    ...typography.title,
    fontSize: 17,
    color: colors.ink,
    textTransform: 'capitalize',
  },
});
