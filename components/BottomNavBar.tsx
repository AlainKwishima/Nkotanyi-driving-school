import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../navigation/types';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { useI18n } from '../i18n/useI18n';

export type TabKey = 'home' | 'exam' | 'read' | 'watch' | 'performance';

type BottomNavBarProps = {
  navigation?: NavigationProp<RootStackParamList>;
  active?: TabKey;
  onPressTab?: (tab: TabKey) => void;
};

function resolveActive(routeName: string): TabKey {
  const examRoutes = new Set([
    'ExamNative',
    'ExamInstructionsNative',
    'StartExamNative',
    'PracticeNoSelectedNative',
    'PracticeSelectedNative',
    'TestFailedNative',
    'TestPassedNative',
  ]);
  const readRoutes = new Set([
    'ReadingNative',
    'RoadSignsListNative',
    'RoadSignsDetailNative',
    'RoadSignsCategories',
    'HelpCenterNative',
    'HelpCenter',
  ]);
  const watchRoutes = new Set(['VideoCourseList', 'VideoCoursePlayer']);
  const performanceRoutes = new Set([
    'PerformanceNative',
    'PerformanceDetailNative',
    'PerformanceReviewNative',
    'ProfileNative',
    'SubscriptionNative',
    'PaymentNative',
    'PaymentConfirmationNative',
  ]);

  if (examRoutes.has(routeName)) return 'exam';
  if (readRoutes.has(routeName)) return 'read';
  if (watchRoutes.has(routeName)) return 'watch';
  if (performanceRoutes.has(routeName)) return 'performance';
  return 'home';
}

export function BottomNavBar({ navigation, active, onPressTab }: BottomNavBarProps) {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { hasSubscription } = useAppFlow();
  const { openGateModal } = useGateModal();
  const activeKey = active ?? resolveActive(route.name);
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 8);

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
      if (tab === 'exam') {
        (navigation as any).navigate('ExamInstructionsNative');
        return;
      }

      if ((tab === 'read' || tab === 'watch') && !hasSubscription) {
        openGateModal(tab === 'read' ? 'subscription_read' : 'subscription_watch', () => (navigation as any).navigate('SubscriptionNative'));
        return;
      }
      (navigation as any).navigate(routeName);
    }
  };

  return (
    <View style={[styles.tabs, { paddingBottom: bottomPad }]}>
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
              <Ionicons name={tab.icon} size={22} color={isActive ? '#F5F8FF' : '#95A4BF'} />
            </View>
            <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
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
    minHeight: 56,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#EFF0F4',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 8,
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
