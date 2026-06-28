import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp } from '@react-navigation/native';

import type { RootStackParamList } from '../navigation/types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { colors, spacing, typography } from '../constants/theme';
import { HeaderMenu } from './HeaderMenu';

type AppHeaderProps = {
  title: string;
  navigation?: NavigationProp<RootStackParamList>;
  onBack?: () => void;
  eyebrow?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  curveColor?: string;
  titleOffsetX?: number;
};

export function AppHeader({ title, navigation, onBack, eyebrow, left, right, curveColor = colors.canvas, titleOffsetX = 0 }: AppHeaderProps) {
  const { insets } = useResponsiveLayout();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.side}>
          {left ?? (onBack ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onBack}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>
          ) : null)}
        </View>
        <View style={[styles.titleStack, titleOffsetX !== 0 && { transform: [{ translateX: titleOffsetX }] }]}>
          {eyebrow ? <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text> : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={[styles.side, styles.rightSide]}>
          {right ?? (navigation ? <HeaderMenu navigation={navigation} iconColor={colors.white} topOffset={52} rightOffset={18} /> : null)}
        </View>
      </View>
      <View style={[styles.curveOverlay, { backgroundColor: curveColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.darkEmphasis,
  },
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  curveOverlay: {
    height: 18,
    marginHorizontal: -spacing.lg,
    marginTop: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.screenTitle,
    color: colors.white,
    textAlign: 'center',
  },
  titleStack: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: 1,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
