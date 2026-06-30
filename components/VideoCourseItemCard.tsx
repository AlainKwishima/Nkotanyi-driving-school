import { AppText } from './AppText';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, spacing, typography } from '../constants/theme';
import { useResponsiveMetrics } from '../utils/responsive';

type VideoCourseItemCardProps = {
  title: string;
  duration: string;
  active?: boolean;
  onPress?: () => void;
};

export function VideoCourseItemCard({ title, duration, active, onPress }: VideoCourseItemCardProps) {
  const { t } = useI18n();
  const r = useResponsiveMetrics();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          minHeight: r.verticalScale(92),
          borderRadius: r.radius(radii.lg),
          paddingHorizontal: r.scale(spacing.md),
        },
        active && styles.cardActive,
      ]}
    >
      <View style={[styles.thumb, { width: r.scale(89), height: r.verticalScale(65), borderRadius: r.radius(radii.md) }]}>
        <Ionicons name={active ? 'volume-medium' : 'play'} size={r.icon(18)} color={colors.white} />
      </View>
      <View style={[styles.textWrap, { marginLeft: r.scale(16) }]}>
        <AppText style={[styles.title, { fontSize: r.font(14), lineHeight: r.lineHeight(14) }]} lines={2}>
          {title}
        </AppText>
        <AppText style={[styles.duration, { marginTop: r.verticalScale(6), fontSize: r.font(12), lineHeight: r.lineHeight(12) }, active && styles.playing]}>{active ? t('video.nowPlaying') : duration}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  thumb: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  duration: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  playing: {
    color: colors.brand,
  },
});

