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
};

export function AppHeader({ title, navigation, onBack, left, right }: AppHeaderProps) {
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
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.side, styles.rightSide]}>
          {right ?? (navigation ? <HeaderMenu navigation={navigation} iconColor={colors.white} topOffset={52} rightOffset={18} /> : null)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.brandStrong,
  },
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    paddingHorizontal: spacing.sm,
    color: colors.white,
    textAlign: 'center',
  },
});
