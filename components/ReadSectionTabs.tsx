import { AppText } from './AppText';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useResponsiveMetrics } from '../utils/responsive';

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
  const r = useResponsiveMetrics();
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
    <View style={[styles.wrap, { padding: r.scale(4), borderRadius: r.radius(radii.xl), gap: r.scale(spacing.xs) }]}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {
                minHeight: r.touch(48),
                paddingHorizontal: r.scale(spacing.md),
                borderRadius: r.radius(radii.lg),
                gap: r.scale(spacing.sm),
              },
              isActive ? styles.tabActive : styles.tabInactive,
            ]}
            onPress={tab.onPress}
            activeOpacity={0.84}
          >
            <AppText style={[styles.label, { fontSize: r.font(14), lineHeight: r.lineHeight(14) }, isActive ? styles.labelActive : styles.labelInactive]} lines={1}>
              {tab.label}
            </AppText>
            {typeof tab.count === 'number' ? (
              <View
                style={[
                  styles.countPill,
                  { minWidth: r.scale(22), height: r.verticalScale(22), paddingHorizontal: r.scale(6) },
                  isActive ? styles.countPillActive : styles.countPillInactive,
                ]}
              >
                <AppText style={[styles.countText, { fontSize: r.font(10, 0.2) }, isActive ? styles.countTextActive : styles.countTextInactive]}>
                  {tab.count}
                </AppText>
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
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  countTextActive: {
    color: colors.brand,
  },
  countTextInactive: {
    color: colors.brandStrong,
  },
});
