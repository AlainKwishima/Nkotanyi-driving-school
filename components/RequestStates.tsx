import { AppText } from './AppText';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useResponsiveMetrics } from '../utils/responsive';
import { useI18n } from '../i18n/useI18n';

type StateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function LoadingState({ message }: Pick<StateProps, 'message'>) {
  const { t } = useI18n();
  const r = useResponsiveMetrics();
  return (
    <View style={[styles.state, { minHeight: r.verticalScale(120), padding: r.scale(spacing.xl) }]}>
      <ActivityIndicator color={colors.brand} />
      <AppText style={[styles.message, { marginTop: r.verticalScale(spacing.xs), fontSize: r.font(14), lineHeight: r.lineHeight(14) }]} lines={null}>{message ?? t('common.loading')}</AppText>
    </View>
  );
}

export function EmptyState({ title, message }: StateProps) {
  const { t } = useI18n();
  const r = useResponsiveMetrics();
  return (
    <View style={[styles.state, { minHeight: r.verticalScale(120), padding: r.scale(spacing.xl) }]}>
      <View style={[styles.emptyIcon, { width: r.touch(44), height: r.touch(44), borderRadius: r.radius(radii.lg) }]}>
        <Ionicons name="document-text-outline" size={r.icon(22)} color={colors.primary} />
      </View>
      <AppText style={[styles.title, { marginTop: r.verticalScale(spacing.sm), fontSize: r.font(17), lineHeight: r.lineHeight(17) }]}>{title ?? t('error.emptyTitle')}</AppText>
      {message ? <AppText style={[styles.message, { marginTop: r.verticalScale(spacing.xs), fontSize: r.font(14), lineHeight: r.lineHeight(14) }]} lines={null}>{message}</AppText> : null}
    </View>
  );
}

export function InlineErrorState({ title, message, onRetry }: StateProps) {
  const { t } = useI18n();
  const r = useResponsiveMetrics();
  return (
    <View style={[styles.state, styles.errorState, { minHeight: r.verticalScale(120), padding: r.scale(spacing.xl), borderRadius: r.radius(radii.lg) }]}>
      <Ionicons name="alert-circle-outline" size={r.icon(24)} color={colors.danger} />
      <AppText style={[styles.title, { marginTop: r.verticalScale(spacing.sm), fontSize: r.font(17), lineHeight: r.lineHeight(17) }]}>{title ?? t('error.genericTitle')}</AppText>
      {message ? <AppText style={[styles.message, { marginTop: r.verticalScale(spacing.xs), fontSize: r.font(14), lineHeight: r.lineHeight(14) }]} lines={null}>{message}</AppText> : null}
      {onRetry ? (
        <TouchableOpacity style={[styles.retry, { minHeight: r.touch(44), marginTop: r.verticalScale(spacing.lg), paddingHorizontal: r.scale(spacing.xl) }]} onPress={onRetry}>
          <AppText style={[styles.retryText, { fontSize: r.font(14), lineHeight: r.lineHeight(14) }]}>{t('common.retry')}</AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorState: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueTint,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.ink,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  retry: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  retryText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});
