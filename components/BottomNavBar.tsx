import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useRoute } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { useI18n } from '../i18n/useI18n';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { hasLanguageAccess } from '../utils/subscriptionAccess';
import { colors, radii, shadows, typography } from '../constants/theme';

export type TabKey = 'home' | 'exam' | 'read' | 'watch' | 'performance';

type BottomNavBarProps = {
  navigation?: NavigationProp<RootStackParamList>;
  active?: TabKey;
  onPressTab?: (tab: TabKey) => void;
};

function resolveActive(routeName: string): TabKey | null {
  // Exam flow should remain highlighted throughout as requested
  const examRoutes = new Set([
    'ExamNative',
    'ExamInstructionsNative',
    'ExamTypeSelectNative',
    'StartExamNative',
    'PracticeNoSelectedNative',
    'PracticeSelectedNative',
    'TestFailedNative',
    'TestPassedNative',
  ]);

  if (examRoutes.has(routeName)) return 'exam';
  if (routeName === 'HomeNative') return 'home';
  if (routeName === 'ReadingNative') return 'read';
  if (routeName === 'VideoCourseList') return 'watch';
  if (routeName === 'PerformanceNative') return 'performance';

  return null;
}

export function BottomNavBar({ navigation, active, onPressTab }: BottomNavBarProps) {
  const route = useRoute();
  const { shortSide } = useResponsiveLayout();
  const { t } = useI18n();
  const { hasSubscription, canChangeLanguage, subscriptionLanguage, contentLanguage, isSigningOut } = useAppFlow();
  const { openGateModal } = useGateModal();
  const activeKey = active ?? resolveActive(route.name);
  const isCompact = shortSide <= 360;
  const isWidePhone = shortSide >= 412;
  const iconSize = isCompact ? 20 : 22;
  const labelSize = isCompact ? 9 : isWidePhone ? 11 : 10;
  const languageAccessGranted = hasLanguageAccess({
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  });

  const tabs = [
    { key: 'home' as const, labelKey: 'nav.home' as const, route: 'HomeNative' as const, icon: 'home-outline' as const },
    { key: 'exam' as const, labelKey: 'nav.exam' as const, route: 'ExamNative' as const, icon: 'clipboard-outline' as const },
    { key: 'read' as const, labelKey: 'nav.read' as const, route: 'ReadingNative' as const, icon: 'book-outline' as const },
    { key: 'watch' as const, labelKey: 'nav.watch' as const, route: 'VideoCourseList' as const, icon: 'play-circle-outline' as const },
    { key: 'performance' as const, labelKey: 'nav.performance' as const, route: 'PerformanceNative' as const, icon: 'analytics-outline' as const },
  ] as const;

  const onPress = (tab: TabKey, routeName: keyof RootStackParamList) => {
    if (onPressTab) {
      onPressTab(tab);
      return;
    }
    if (navigation) {
      if (tab === 'exam' && hasSubscription && !languageAccessGranted && !isSigningOut) {
        openGateModal('subscription_exam', () => (navigation as any).navigate('SubscriptionNative'));
        return;
      }

      if (tab === 'exam') {
        (navigation as any).navigate('ExamInstructionsNative');
        return;
      }

      if ((tab === 'read' || tab === 'watch') && !languageAccessGranted && !isSigningOut) {
        openGateModal(tab === 'read' ? 'subscription_read' : 'subscription_watch', () => (navigation as any).navigate('SubscriptionNative'));
        return;
      }
      (navigation as any).navigate(routeName);
    }
  };

  return (
    <View style={styles.tabs}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            onPress={() => onPress(tab.key, tab.route)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.tabBubble, isActive && styles.tabBubbleActive]}>
              <Ionicons name={tab.icon} size={iconSize} color={isActive ? colors.brandStrong : colors.inkSoft} />
            </View>
            <Text style={[styles.tabText, { fontSize: labelSize }, isActive && styles.tabTextActive]} numberOfLines={1}>
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 64,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  tab: {
    alignItems: 'center',
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    flex: 1,
  },
  tabPressed: { opacity: 0.72 },
  tabBubble: {
    width: 40,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBubbleActive: { backgroundColor: colors.brandSoft },
  tabText: {
    ...typography.caption,
    marginTop: 1,
    color: colors.inkSoft,
  },
  tabTextActive: {
    color: colors.brandStrong,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
