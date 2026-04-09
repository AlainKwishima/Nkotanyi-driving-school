import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useRoute } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';

export type TabKey = 'home' | 'exam' | 'read' | 'watch' | 'performance';

type BottomNavBarProps = {
  navigation?: NavigationProp<RootStackParamList>;
  active?: TabKey;
  onPressTab?: (tab: TabKey) => void;
};

const TABS: Array<{
  key: TabKey;
  label: string;
  route: keyof RootStackParamList;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  { key: 'home', label: 'Home', route: 'HomeNative', icon: 'home-outline' },
  { key: 'exam', label: 'Exam', route: 'ExamNative', icon: 'clipboard-outline' },
  { key: 'read', label: 'READ', route: 'ReadingNative', icon: 'book-outline' },
  { key: 'watch', label: 'Watch', route: 'VideoCourseList', icon: 'play-circle-outline' },
  { key: 'performance', label: 'Performance', route: 'PerformanceNative', icon: 'analytics-outline' },
];

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
  const { hasSubscription, hasUsedFreeTrial } = useAppFlow();
  const { openGateModal } = useGateModal();
  const activeKey = active ?? resolveActive(route.name);

  const onPress = (tab: TabKey, routeName: keyof RootStackParamList) => {
    if (onPressTab) {
      onPressTab(tab);
      return;
    }
    if (navigation) {
      if (tab === 'exam') {
        (navigation as any).navigate('StartExamNative', { gateFor: 'exam' });
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
    <View style={styles.tabs}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onPress(tab.key, tab.route)}>
            <View style={[styles.tabBubble, isActive && styles.tabBubbleActive]}>
              <Ionicons name={tab.icon} size={20} color={isActive ? '#F5F8FF' : '#95A4BF'} />
            </View>
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
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
    height: 74,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#EFF0F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: { alignItems: 'center' },
  tabBubble: { width: 46, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
