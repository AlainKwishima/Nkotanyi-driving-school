import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';

type ReadSection = 'documents' | 'signs';

type ReadSectionTabsProps = {
  active: ReadSection;
  documentsLabel: string;
  signsLabel: string;
  documentsCount?: number;
  signsCount?: number;
  onDocumentsPress: () => void;
  onSignsPress: () => void;
};

export function ReadSectionTabs({
  active,
  documentsLabel,
  signsLabel,
  documentsCount,
  signsCount,
  onDocumentsPress,
  onSignsPress,
}: ReadSectionTabsProps) {
  const tabs = [
    {
      key: 'documents' as const,
      label: documentsLabel,
      count: documentsCount,
      onPress: onDocumentsPress,
    },
    {
      key: 'signs' as const,
      label: signsLabel,
      count: signsCount,
      onPress: onSignsPress,
    },
  ];

  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}
            onPress={tab.onPress}
            activeOpacity={0.84}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]} numberOfLines={1}>
              {tab.label}
            </Text>
            {typeof tab.count === 'number' ? (
              <View style={[styles.countPill, isActive ? styles.countPillActive : styles.countPillInactive]}>
                <Text style={[styles.countText, isActive ? styles.countTextActive : styles.countTextInactive]}>
                  {tab.count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 4,
    borderRadius: radii.xl,
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.brand,
  },
  tabInactive: {
    backgroundColor: colors.surface,
  },
  label: {
    ...typography.bodyStrong,
    flexShrink: 1,
  },
  labelActive: {
    color: colors.white,
  },
  labelInactive: {
    color: colors.inkMuted,
  },
  countPill: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillActive: {
    backgroundColor: colors.white,
  },
  countPillInactive: {
    backgroundColor: colors.brandSoft,
  },
  countText: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 10,
  },
  countTextActive: {
    color: colors.brand,
  },
  countTextInactive: {
    color: colors.brandStrong,
  },
});
