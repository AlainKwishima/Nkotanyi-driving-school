import { AppText } from './AppText';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useResponsiveMetrics } from '../utils/responsive';
import { useI18n } from '../i18n/useI18n';

type StateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function useDelayedVisibility(delayMs = 200) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, delayMs);
    return () => clearTimeout(timer);
  }, [opacity, delayMs]);
  return opacity;
}

export function LoadingState({ message }: Pick<StateProps, 'message'>) {
  const { t } = useI18n();
  const r = useResponsiveMetrics();
  const opacity = useDelayedVisibility();
  return (
    <Animated.View style={[styles.state, styles.skeletonState, { opacity, minHeight: r.verticalScale(156), padding: r.scale(spacing.lg), borderRadius: r.radius(radii.lg) }]}>
      <View style={styles.skeletonHeaderRow}>
        <SkeletonBlock style={{ width: r.scale(48), height: r.scale(48), borderRadius: r.radius(radii.md) }} />
        <View style={styles.skeletonHeaderCopy}>
          <SkeletonBlock style={{ width: '72%', height: r.verticalScale(14), borderRadius: r.radius(radii.sm) }} />
          <SkeletonBlock style={{ width: '48%', height: r.verticalScale(10), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.sm) }} />
        </View>
      </View>
      <SkeletonBlock style={{ width: '100%', height: r.verticalScale(12), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.lg) }} />
      <SkeletonBlock style={{ width: '84%', height: r.verticalScale(12), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.sm) }} />
      <AppText style={[styles.message, { marginTop: r.verticalScale(spacing.md), fontSize: r.font(13), lineHeight: r.lineHeight(13) }]} lines={null}>{message ?? t('common.loading')}</AppText>
    </Animated.View>
  );
}

export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    const timer = setTimeout(() => {
      opacity.setValue(0.55);
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 820,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.55,
            duration: 820,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (animation) animation.stop();
    };
  }, [opacity]);

  return <Animated.View pointerEvents="none" style={[styles.skeletonBlock, { opacity }, style]} />;
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  const r = useResponsiveMetrics();
  const opacity = useDelayedVisibility();
  return (
    <Animated.View style={[styles.skeletonList, { opacity }]}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={[styles.skeletonCard, { padding: r.scale(spacing.md), borderRadius: r.radius(radii.lg) }]}>
          <SkeletonBlock style={{ width: r.scale(58), height: r.scale(58), borderRadius: r.radius(radii.md) }} />
          <View style={styles.skeletonCardCopy}>
            <SkeletonBlock style={{ width: '78%', height: r.verticalScale(14), borderRadius: r.radius(radii.sm) }} />
            <SkeletonBlock style={{ width: '52%', height: r.verticalScale(10), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.sm) }} />
            <SkeletonBlock style={{ width: '34%', height: r.verticalScale(10), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.sm) }} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
export function DocumentCardSkeleton() {
  const r = useResponsiveMetrics();
  const opacity = useDelayedVisibility();
  return (
    <Animated.View style={[styles.skeletonCard, { opacity, padding: r.scale(spacing.md), borderRadius: r.radius(radii.lg) }]}>
      <SkeletonBlock style={{ width: r.scale(58), height: r.scale(58), borderRadius: r.radius(radii.md) }} />
      <View style={styles.skeletonCardCopy}>
        <SkeletonBlock style={{ width: '78%', height: r.verticalScale(14), borderRadius: r.radius(radii.sm) }} />
        <SkeletonBlock style={{ width: '42%', height: r.verticalScale(10), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.sm) }} />
      </View>
    </Animated.View>
  );
}

export function SignGroupCardSkeleton() {
  const r = useResponsiveMetrics();
  const opacity = useDelayedVisibility();
  return (
    <Animated.View style={[styles.skeletonCard, { opacity, padding: r.scale(spacing.md), borderRadius: r.radius(radii.xl) }]}>
      <SkeletonBlock style={{ width: r.scale(78), height: r.scale(78), borderRadius: r.radius(radii.md) }} />
      <View style={styles.skeletonCardCopy}>
        <SkeletonBlock style={{ width: '85%', height: r.verticalScale(14), borderRadius: r.radius(radii.sm) }} />
        <SkeletonBlock style={{ width: '95%', height: r.verticalScale(10), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.xs) }} />
        <SkeletonBlock style={{ width: '65%', height: r.verticalScale(10), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.xs) }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: r.verticalScale(spacing.sm) }}>
          <SkeletonBlock style={{ width: r.scale(60), height: r.verticalScale(20), borderRadius: r.radius(radii.pill) }} />
          <SkeletonBlock style={{ width: r.scale(70), height: r.verticalScale(10), borderRadius: r.radius(radii.sm), marginLeft: r.scale(spacing.md) }} />
        </View>
      </View>
    </Animated.View>
  );
}

export function VideoCardSkeleton() {
  const r = useResponsiveMetrics();
  const opacity = useDelayedVisibility();
  return (
    <Animated.View style={[styles.skeletonCard, { opacity, padding: r.scale(spacing.md), borderRadius: r.radius(radii.lg) }]}>
      <SkeletonBlock style={{ width: r.scale(108), height: r.verticalScale(78), borderRadius: r.radius(radii.md) }} />
      <View style={styles.skeletonCardCopy}>
        <SkeletonBlock style={{ width: '30%', height: r.verticalScale(10), borderRadius: r.radius(radii.sm) }} />
        <SkeletonBlock style={{ width: '85%', height: r.verticalScale(14), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(4) }} />
        <SkeletonBlock style={{ width: '45%', height: r.verticalScale(10), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.xs) }} />
      </View>
    </Animated.View>
  );
}

export function FeaturedVideoCardSkeleton() {
  const r = useResponsiveMetrics();
  const opacity = useDelayedVisibility();
  return (
    <Animated.View style={{ opacity, marginTop: r.verticalScale(spacing.xxl), backgroundColor: colors.surface, borderRadius: r.radius(radii.xl), overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
      <SkeletonBlock style={{ width: '100%', height: r.verticalScale(205), borderRadius: 0 }} />
      <View style={{ padding: r.scale(spacing.lg) }}>
        <SkeletonBlock style={{ width: '25%', height: r.verticalScale(12), borderRadius: r.radius(radii.sm) }} />
        <SkeletonBlock style={{ width: '90%', height: r.verticalScale(20), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.md) }} />
        <SkeletonBlock style={{ width: '70%', height: r.verticalScale(20), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.xs) }} />
        <SkeletonBlock style={{ width: '40%', height: r.verticalScale(12), borderRadius: r.radius(radii.sm), marginTop: r.verticalScale(spacing.md) }} />
      </View>
    </Animated.View>
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
  skeletonState: {
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  skeletonBlock: {
    backgroundColor: colors.surfaceAlt,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonHeaderCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  skeletonList: {
    gap: spacing.md,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  skeletonCardCopy: {
    flex: 1,
    marginLeft: spacing.md,
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
