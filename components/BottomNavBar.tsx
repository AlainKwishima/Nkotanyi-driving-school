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
import { colors, radii, shadows, typography } from '../constants/theme';

export type TabKey = 'home' | 'exam' | 'read' | 'watch' | 'performance';

const webFrostedStyle =
  Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      } as any)
    : null;

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
  const { insets, shortSide } = useResponsiveLayout();
  const { t } = useI18n();
  const { hasSubscription, canChangeLanguage, subscriptionLanguage, contentLanguage, isSigningOut } = useAppFlow();
  const { openGateModal } = useGateModal();
  const activeKey = active ?? resolveActive(route.name);
  const isCompact = shortSide <= 360;
  const isWidePhone = shortSide >= 412;
  const iconSize = isCompact ? 20 : 22;
  const labelSize = isCompact ? 9 : isWidePhone ? 11 : 10;
  const horizontalInset = isCompact ? 8 : 14;
  const bottomInset = Math.max(insets.bottom, 6) + 4;
  const navLayerHeight = bottomInset + 86;
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
    <View pointerEvents="box-none" style={[styles.navLayer, { height: navLayerHeight }]}>
      <View pointerEvents="none" style={[styles.frostedShelf, webFrostedStyle]} />
      <View style={[styles.tabs, { left: horizontalInset, right: horizontalInset, bottom: bottomInset }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  navLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  frostedShelf: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(246,247,249,0.84)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(221,226,234,0.72)',
  },
  tabs: {
    position: 'absolute',
    minHeight: 68,
    backgroundColor: 'rgba(255,255,255,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.floating,
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
    width: 42,
    height: 32,
    borderRadius: 18,
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
