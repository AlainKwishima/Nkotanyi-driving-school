import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { useMobile } from '../hooks/useMobile';

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
        { width: m.contentWidth - m.scale(48), height: m.verticalScale(90), padding: m.scale(18) },
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
    width: 342,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDefault: {
    borderColor: 'rgba(198, 197, 208, 0.2)',
  },
  cardSelected: {
    borderColor: '#4378DB',
  },
  cardPressed: {
    opacity: 0.96,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagFrame: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(198, 197, 208, 0.1)',
    backgroundColor: '#F0EDF1',
    overflow: 'hidden',
    padding: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  flagImage: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
  },
  textBlock: {
    justifyContent: 'center',
    marginLeft: 16,
  },
  titleText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    lineHeight: 24,
    color: '#1B1B1E',
  },
  subtitleText: {
    marginTop: 0,
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(69, 70, 78, 0.6)',
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDefault: {
    backgroundColor: '#EAE7EB',
  },
  indicatorSelected: {
    backgroundColor: '#4378DB',
  },
  checkIcon: {
    width: 9.508,
    height: 7.015,
  },
});

