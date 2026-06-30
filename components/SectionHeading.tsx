import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppText, shrinkableTextContainer } from './AppText';

import { colors, spacing, typography } from '../constants/theme';
import { useResponsiveMetrics } from '../utils/responsive';

export function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const r = useResponsiveMetrics();
  return (
    <View style={[styles.row, { minHeight: r.verticalScale(24), marginTop: r.verticalScale(spacing.xxl), marginBottom: r.verticalScale(spacing.md) }]}>
      <View style={[shrinkableTextContainer.root, styles.titleWrap]}>
        <AppText style={[styles.title, { fontSize: r.font(17), lineHeight: r.lineHeight(17) }]}>{title}</AppText>
      </View>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={8} style={styles.actionWrap}>
          <AppText style={[styles.action, { fontSize: r.font(14), lineHeight: r.lineHeight(14) }]}>{action}</AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleWrap: {
    marginRight: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.ink,
  },
  action: {
    ...typography.bodyStrong,
    color: colors.brand,
  },
  actionWrap: {
    flexShrink: 0,
    maxWidth: '42%',
  },
});
