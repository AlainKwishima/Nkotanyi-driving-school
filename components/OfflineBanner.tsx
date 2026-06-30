import { AppText } from './AppText';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useNetworkStatus } from '../context/NetworkStatusContext';
import { useI18n } from '../i18n/useI18n';
import { colors, spacing, typography } from '../constants/theme';
import { useResponsiveMetrics } from '../utils/responsive';

export function OfflineBanner() {
  const { isConnected, isInternetReachable, refresh } = useNetworkStatus();
  const { t } = useI18n();
  const r = useResponsiveMetrics();
  const offline = !isConnected || isInternetReachable === false;

  if (!offline) return null;
  return (
    <View style={[styles.banner, { minHeight: r.verticalScale(36), paddingHorizontal: r.scale(spacing.lg) }]}>
      <AppText style={[styles.text, { fontSize: r.font(12), lineHeight: r.lineHeight(12) }]}>{t('error.offlineBanner')}</AppText>
      <TouchableOpacity onPress={() => void refresh()} hitSlop={8}>
        <AppText style={[styles.action, { marginLeft: r.scale(spacing.md), fontSize: r.font(14), lineHeight: r.lineHeight(14) }]}>{t('common.retry')}</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.ink,
  },
  text: {
    ...typography.caption,
    flex: 1,
    color: colors.white,
  },
  action: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});
