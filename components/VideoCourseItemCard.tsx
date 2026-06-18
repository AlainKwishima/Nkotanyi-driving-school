import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, spacing, typography } from '../constants/theme';

type VideoCourseItemCardProps = {
  title: string;
  duration: string;
  active?: boolean;
  onPress?: () => void;
};

export function VideoCourseItemCard({ title, duration, active, onPress }: VideoCourseItemCardProps) {
  const { t } = useI18n();
  return (
    <Pressable onPress={onPress} style={[styles.card, active && styles.cardActive]}>
      <View style={styles.thumb}>
        <Ionicons name={active ? 'volume-medium' : 'play'} size={18} color={colors.white} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.duration, active && styles.playing]}>{active ? t('video.nowPlaying') : duration}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 92,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  thumb: {
    width: 89,
    height: 65,
    borderRadius: radii.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  duration: {
    marginTop: 6,
    ...typography.caption,
    color: colors.inkMuted,
  },
  playing: {
    color: colors.brand,
  },
});

