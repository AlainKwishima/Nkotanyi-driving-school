import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useRoute } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { useI18n } from '../i18n/useI18n';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { hasLanguageAccess } from '../utils/subscriptionAccess';

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
  if (routeName === 'ReadingNative' || routeName === 'RoadSignsListNative') return 'read';
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
  const iconSize = isCompact ? 19 : 21;
  const labelSize = isCompact ? 10 : isWidePhone ? 12 : 11;
  const bubbleWidth = isCompact ? 42 : isWidePhone ? 50 : 46;
  const bubbleHeight = isCompact ? 32 : 34;
  const floatingBottom = Platform.OS === 'ios' ? 12 : 14;
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
    <View style={[styles.tabs, { bottom: floatingBottom }]}>
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
            <View style={[styles.tabBubble, { width: bubbleWidth, height: bubbleHeight, borderRadius: bubbleHeight / 2 }, isActive && styles.tabBubbleActive]}>
              <Ionicons name={tab.icon} size={iconSize} color={isActive ? '#F5F8FF' : '#95A4BF'} />
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
    left: 16,
    right: 16,
    bottom: 12,
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 12,
  },
  tab: {
    alignItems: 'center',
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  tabPressed: { opacity: 0.88 },
  tabBubble: { width: 48, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabBubbleActive: { backgroundColor: '#4A78D0' },
  tabText: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 14,
    color: '#8A98B2',
  },
  tabTextActive: { color: '#4A78D0' },
});
