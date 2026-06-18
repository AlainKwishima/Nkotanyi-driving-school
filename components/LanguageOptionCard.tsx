import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { useMobile } from '../hooks/useMobile';
import { colors, radii, shadows, typography } from '../constants/theme';

type LanguageOptionCardProps = {
  title: string;
  subtitle: string;
  flagUri: ImageSourcePropType;
  selected: boolean;
  onPress: () => void;
};

export function LanguageOptionCard({
  title,
  subtitle,
  flagUri,
  selected,
  onPress,
}: LanguageOptionCardProps) {
  const m = useMobile();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width: '100%', minHeight: m.verticalScale(96), padding: m.scale(16) },
        selected ? styles.cardSelected : styles.cardDefault,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.leftContent}>
        <View style={styles.flagFrame}>
          <Image source={flagUri} style={styles.flagImage} resizeMode="cover" />
        </View>
        <View style={[styles.textBlock, { marginLeft: m.scale(16) }]}>
          <Text style={[styles.titleText, { fontSize: m.fontScale(16), lineHeight: m.fontScale(24) }]}>{title}</Text>
          <Text style={[styles.subtitleText, { fontSize: m.fontScale(12), lineHeight: m.fontScale(16) }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={[styles.indicator, selected ? styles.indicatorSelected : styles.indicatorDefault]}>
        {selected ? (
          <Image source={FIGMA_ASSETS.checkIconBlue} style={styles.checkIcon} resizeMode="contain" />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 96,
    borderRadius: radii.xl,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  cardDefault: {
    borderColor: colors.line,
  },
  cardSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  cardPressed: {
    opacity: 0.96,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagFrame: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    padding: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  flagImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 16,
  },
  titleText: {
    ...typography.title,
    fontSize: 16,
    color: colors.ink,
  },
  subtitleText: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  indicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDefault: {
    backgroundColor: colors.line,
  },
  indicatorSelected: {
    backgroundColor: colors.brand,
  },
  checkIcon: {
    width: 12,
    height: 12,
    tintColor: colors.white,
  },
});

