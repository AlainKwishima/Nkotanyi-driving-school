import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useNetworkStatus } from '../context/NetworkStatusContext';
import { useI18n } from '../i18n/useI18n';
import { colors, spacing, typography } from '../constants/theme';

export function OfflineBanner() {
  const { isConnected, isInternetReachable, refresh } = useNetworkStatus();
  const { t } = useI18n();
  const offline = !isConnected || isInternetReachable === false;

  if (!offline) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{t('error.offlineBanner')}</Text>
      <TouchableOpacity onPress={() => void refresh()} hitSlop={8}>
        <Text style={styles.action}>{t('common.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
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
    marginLeft: spacing.md,
    color: colors.white,
  },
});
