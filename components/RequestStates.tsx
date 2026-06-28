import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useI18n } from '../i18n/useI18n';

type StateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function LoadingState({ message }: Pick<StateProps, 'message'>) {
  const { t } = useI18n();
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.brand} />
      <Text style={styles.message}>{message ?? t('common.loading')}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: StateProps) {
  const { t } = useI18n();
  return (
    <View style={styles.state}>
      <View style={styles.emptyIcon}>
        <Ionicons name="document-text-outline" size={22} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title ?? t('error.emptyTitle')}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

export function InlineErrorState({ title, message, onRetry }: StateProps) {
  const { t } = useI18n();
  return (
    <View style={[styles.state, styles.errorState]}>
      <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
      <Text style={styles.title}>{title ?? t('error.genericTitle')}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? (
        <TouchableOpacity style={styles.retry} onPress={onRetry}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    minHeight: 120,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorState: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueTint,
  },
  title: {
    ...typography.sectionTitle,
    marginTop: spacing.sm,
    color: colors.ink,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  retry: {
    minHeight: 44,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
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
