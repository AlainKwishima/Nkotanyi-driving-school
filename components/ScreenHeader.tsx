import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppText, shrinkableTextContainer } from './AppText';

import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { colors, spacing, typography } from '../constants/theme';
import { useResponsiveMetrics } from '../utils/responsive';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
};

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const r = useResponsiveMetrics();
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, r.verticalScale(12)), minHeight: r.verticalScale(52), paddingHorizontal: r.scale(spacing.lg) }]}>
      <View style={[styles.row, { minHeight: r.verticalScale(54), paddingBottom: r.verticalScale(spacing.xs) }]}>
        <Pressable onPress={onBack} style={[styles.back, { minWidth: r.touch(MIN_TOUCH_TARGET), minHeight: r.touch(MIN_TOUCH_TARGET) }]} disabled={!onBack} hitSlop={8}>
          {onBack ? <Ionicons name="chevron-back" size={r.icon(24)} color={colors.white} /> : null}
        </Pressable>
        <View style={shrinkableTextContainer.root}>
          <AppText style={[styles.title, { fontSize: r.font(17), lineHeight: r.lineHeight(17) }]}>{title}</AppText>
        </View>
        <View style={[styles.backSpacer, { minWidth: r.touch(MIN_TOUCH_TARGET), minHeight: r.touch(MIN_TOUCH_TARGET) }]} />
      </View>
      <View
        style={[
          styles.curveOverlay,
          {
            height: r.verticalScale(16),
            marginHorizontal: -r.scale(spacing.lg),
            borderTopLeftRadius: r.radius(22),
            borderTopRightRadius: r.radius(22),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.brandStrong,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  curveOverlay: {
    marginTop: 0,
    backgroundColor: colors.canvas,
  },
  back: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
  },
  title: {
    ...typography.title,
    color: colors.white,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
});
