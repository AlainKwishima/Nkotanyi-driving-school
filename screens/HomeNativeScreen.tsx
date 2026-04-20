import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { ScreenColumn } from '../components/ScreenColumn';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/useI18n';
import { hasLanguageAccess } from '../utils/subscriptionAccess';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeNative'>;

type QuickAction = {
  titleKey: string;
  subtitleKey: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  route: 'ExamInstructionsNative' | 'ReadingNative' | 'VideoCourseList' | 'PerformanceNative';
};

const QUICK_ACTIONS: QuickAction[] = [
  { titleKey: 'home.action.exams', subtitleKey: 'home.action.examsSub', icon: 'file-question-outline', route: 'ExamInstructionsNative' },
  { titleKey: 'video.listTitle', subtitleKey: 'nav.watch', icon: 'play-circle-outline', route: 'VideoCourseList' },
  { titleKey: 'home.action.reading', subtitleKey: 'home.action.readingSub', icon: 'book-open-page-variant-outline', route: 'ReadingNative' },
  { titleKey: 'home.action.performance', subtitleKey: 'home.action.performanceSub', icon: 'history', route: 'PerformanceNative' },
];

function QuickActionCard({ action, title, subtitle, onPress }: { action: QuickAction; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View pointerEvents="none" style={styles.cardInnerHighlight} />
      <View style={styles.cardIconWrap}>
        <MaterialCommunityIcons name={action.icon} size={20} color="#F6F7FA" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function BottomNav({ navigation }: { navigation: Props['navigation'] }) {
  return <BottomNavBar navigation={navigation} />;
}

export function HomeNativeScreen({ navigation }: Props) {
  const { hasUsedFreeTrial, hasSubscription, canChangeLanguage, subscriptionLanguage, contentLanguage } = useAppFlow();
  const { openGateModal } = useGateModal();
  const { insets, tabScrollBottomPad } = useResponsiveLayout();
  const { t } = useI18n();
  const { name } = useAuth();
  const showTrial = !hasSubscription;
  const languageAccessGranted = hasLanguageAccess({
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  });
  const welcome = name?.trim() ? t('home.welcome', { name: name.trim() }) : t('home.welcomeGuest');
  const handleQuickAction = (route: QuickAction['route']) => {
    if (route === 'ExamInstructionsNative') {
      if (hasSubscription && !languageAccessGranted) {
        openGateModal('subscription_exam', () => navigation.navigate('SubscriptionNative'));
        return;
      }
      navigation.navigate('ExamInstructionsNative');
      return;
    }

    const needsReadGate = route === 'ReadingNative';
    const needsWatchGate = route === 'VideoCourseList';

    if ((needsReadGate || needsWatchGate) && !languageAccessGranted) {
      openGateModal(needsReadGate ? 'subscription_read' : 'subscription_watch', () => navigation.navigate('SubscriptionNative'));
      return;
    }

    navigation.navigate(route);
  };

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backTap} accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color="#4B79D0" />
          </TouchableOpacity>
          <Text style={styles.homeTitle}>{t('home.title')}</Text>
          <HeaderMenu navigation={navigation} iconColor="#F2F3F8" topOffset={56} rightOffset={16} />
        </View>
      </View>

      <View style={styles.bodyWrap}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: tabScrollBottomPad }]}>
          <Text style={styles.welcome}>{welcome}</Text>
          <Text style={styles.subwelcome}>{t('home.subwelcome')}</Text>
          {showTrial ? (
            <View style={styles.trialCard}>
              <Text style={styles.trialTitle}>{hasUsedFreeTrial ? t('home.trialUsedTitle') : t('home.trialAvailableTitle')}</Text>
              <Text style={styles.trialText}>{hasUsedFreeTrial ? t('home.trialUsedBody') : t('home.trialAvailableBody')}</Text>
            </View>
          ) : null}

          <View style={styles.quickHeader}>
            <Text style={styles.quickTitle}>{t('home.quickActions')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ScreensHub')}>
              <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {QUICK_ACTIONS.map((action, index) => (
              <View key={action.titleKey} style={[styles.gridItem, index % 2 === 1 && styles.gridItemRight]}>
                <QuickActionCard
                  action={action}
                  title={t(action.titleKey)}
                  subtitle={t(action.subtitleKey)}
                  onPress={() => handleQuickAction(action.route)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <BottomNav navigation={navigation} />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  headerBlue: {
    backgroundColor: '#4A78D0',
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  titleRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backTap: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeTitle: {
    color: '#F3F5FA',
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  bodyWrap: {
    flex: 1,
    backgroundColor: '#CBD1DD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  welcome: {
    fontSize: 20,
    lineHeight: 30,
    color: '#3D414A',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.8,
  },
  subwelcome: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 17,
    color: '#4A4E59',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  trialCard: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#E9F1FF',
    borderWidth: 1,
    borderColor: '#9DB7EA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  trialTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#26437D',
  },
  trialText: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#3D5484',
  },
  quickHeader: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickTitle: {
    fontSize: 15,
    lineHeight: 18,
    color: '#2B313C',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  viewAll: {
    fontSize: 13,
    lineHeight: 14,
    color: '#2B313C',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  grid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  gridItemRight: {
    marginLeft: '4%',
  },
  card: {
    position: 'relative',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 158,
    padding: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  cardInnerHighlight: {
    position: 'absolute',
    left: 1,
    right: 1,
    top: 1,
    height: 14,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 15,
    color: '#4473CC',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    color: '#4C4F59',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
    backgroundColor: '#E3E6EC',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  activeTab: {
    width: 72,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
  activeTabText: {
    marginTop: -1,
    fontSize: 11,
    lineHeight: 14,
    color: '#F4F7FF',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
  },
  tabText: {
    marginTop: -2,
    fontSize: 10,
    lineHeight: 12,
    color: '#8898B0',
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
  },
});
