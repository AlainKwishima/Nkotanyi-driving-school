import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
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
import { getPerformanceHistory } from '../services/performanceApi';
import { readLocalExamRecords } from '../services/examHistoryStorage';
import { mergePerformanceHistory, type PerformanceHistoryRow } from '../services/performanceHistory';
import { getPdfs, getVideos, type PdfItem, type VideoItem } from '../services/contentApi';

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
        <MaterialCommunityIcons name={action.icon} size={24} color="#2563EB" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function BottomNav({ navigation }: { navigation: Props['navigation'] }) {
  return <BottomNavBar navigation={navigation} />;
}

function getInitials(name?: string | null) {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

  const [rows, setRows] = useState<PerformanceHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<{ type: 'pdf' | 'video'; item: any } | null>(null);
  const { accessToken } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const local = await readLocalExamRecords();
      let merged: PerformanceHistoryRow[] = [];
      if (!accessToken) {
        merged = mergePerformanceHistory([], local);
      } else {
        const remote = await getPerformanceHistory(accessToken);
        merged = mergePerformanceHistory(remote, local);

        // Fetch recommendations if logged in
        const [pdfs, videos] = await Promise.all([
          getPdfs(accessToken, contentLanguage).catch(() => []),
          getVideos(accessToken, contentLanguage).catch(() => []),
        ]);
        // Filter for GENUINELY NEW content (isNew flag from backend)
        const newPdf = pdfs.find((p: PdfItem) => (p as any).isNew === true);
        const newVid = videos.find((v: VideoItem) => (v as any).isNew === true);

        if (newPdf) {
          setRecommendation({ type: 'pdf', item: newPdf });
        } else if (newVid) {
          setRecommendation({ type: 'video', item: newVid });
        } else {
          setRecommendation(null);
        }
      }
      setRows(merged);
    } catch (e) {
      console.warn('[Home] failed to load data', e);
      const local = await readLocalExamRecords();
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, contentLanguage]);

  const calculateStreak = (history: PerformanceHistoryRow[]) => {
    if (history.length === 0) return 0;
    const dates = history.map((r) => new Date(r.date).toDateString());
    const uniqueDates = Array.from(new Set(dates));
    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      let d = new Date(uniqueDates[i]);
      d.setHours(0, 0, 0, 0);
      let diff = (today.getTime() - d.getTime()) / (1000 * 3600 * 24);
      if (diff === i) streak++;
      else break;
    }
    return streak;
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const totalExams = rows.length;
  const avgAccuracy = totalExams > 0 ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / totalExams) : 0;
  const passedCount = rows.filter((r) => r.status === 'PASSED').length;
  const successRate = totalExams > 0 ? Math.round((passedCount / totalExams) * 100) : 0;
  const lastExam = rows[0];
  const streak = calculateStreak(rows);

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileNative')} style={styles.headerLeft}>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarText}>{getInitials(name)}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.homeTitle}>{t('home.title')}</Text>

          <View style={styles.headerRight}>
            <HeaderMenu navigation={navigation} iconColor="#F2F3F8" topOffset={56} rightOffset={16} />
          </View>
        </View>
      </View>

      <View style={styles.bodyWrap}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: tabScrollBottomPad }]}>
          <View style={styles.welcomeRow}>
            <View>
              <View style={styles.greetingLine}>
                <Text style={styles.welcome}>{welcome}</Text>
                {streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={12} color="#F59E0B" />
                    <Text style={styles.streakText}>{streak}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subwelcome}>{t('home.subwelcome')}</Text>
            </View>
          </View>

          {/* Stats Dashboard */}
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{totalExams}</Text>
                <Text style={styles.statLab}>{t('performance.totalExams')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{avgAccuracy}%</Text>
                <Text style={styles.statLab}>{t('performance.avgAccuracy')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{successRate}%</Text>
                <Text style={styles.statLab}>{t('performance.successRate')}</Text>
              </View>
            </View>
          </View>

          {/* Recommended Study */}
          {recommendation && (
            <View style={styles.recommendSection}>
              <Text style={styles.sectionTitle}>{t('home.recommended')}</Text>
              <TouchableOpacity
                style={styles.recommendCard}
                onPress={() => navigation.navigate(recommendation.type === 'pdf' ? 'ReadingNative' : 'VideoCourseList')}
              >
                <View style={styles.recommendIcon}>
                  <Ionicons name={recommendation.type === 'pdf' ? 'document-text' : 'play-circle'} size={24} color="#4A78D0" />
                </View>
                <View style={styles.recommendInfo}>
                  <Text style={styles.recommendTag}>{t('home.newContent')}</Text>
                  <Text style={styles.recommendTitle} numberOfLines={1}>
                    {recommendation.item.title || recommendation.item.name || 'Study Material'}
                  </Text>
                </View>
                <View style={styles.recommendBtn}>
                  <Text style={styles.recommendBtnText}>{t('home.studyNow')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {showTrial ? (
            <TouchableOpacity
              style={styles.premiumBanner}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('SubscriptionNative')}
            >
              <View style={styles.premiumInfo}>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
                <Text style={styles.premiumTitle}>
                  {hasUsedFreeTrial ? t('home.trialUsedTitle') : t('home.trialAvailableTitle')}
                </Text>
                <Text style={styles.premiumSub}>{t('profile.upgradeDescription') || 'Unlock all exam types and languages'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.activePlanRow}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.activePlanText}>{t('profile.planActive')}</Text>
            </View>
          )}

          {/* Recent Activity */}
          {lastExam && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('performance.history')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('PerformanceNative')}>
                  <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.recentCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PerformanceNative')}
              >
                <View style={[styles.statusIndicator, { backgroundColor: lastExam.status === 'PASSED' ? '#10B981' : '#EF4444' }]} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentExamTitle}>
                    {lastExam.title.startsWith('performance.') ? t(lastExam.title) : lastExam.title}
                  </Text>
                  <Text style={styles.recentDate}>{new Date(lastExam.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.recentScoreWrap}>
                  <Text style={[styles.recentScore, { color: lastExam.status === 'PASSED' ? '#10B981' : '#EF4444' }]}>
                    {lastExam.percent}%
                  </Text>
                  <Text style={styles.recentScoreLab}>{t('performance.score')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.quickHeader}>
            <Text style={styles.quickTitle}>{t('home.quickActions')}</Text>
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

      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  headerBlue: {
    backgroundColor: '#4A78D0',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titleRow: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerRight: {
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  homeTitle: {
    color: '#F3F5FA',
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    textAlign: 'center',
  },
  bodyWrap: {
    flex: 1,
    backgroundColor: '#F3F5FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#D97706',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  welcome: {
    fontSize: 24,
    lineHeight: 32,
    color: '#1E293B',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.5,
  },
  subwelcome: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 20, color: '#1E293B' },
  statLab: { marginTop: 4, fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, color: '#94A3B8', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 24, backgroundColor: '#F1F5F9' },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  premiumInfo: {
    flex: 1,
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  premiumTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
  },
  premiumSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  activePlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activePlanText: {
    color: '#166534',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  recommendSection: {
    marginBottom: 24,
  },
  recommendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recommendIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recommendTag: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#2563EB',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  recommendTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#1E293B',
  },
  recommendBtn: {
    backgroundColor: '#4A78D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recommendBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#1E293B',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentExamTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  recentDate: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
  recentScoreWrap: {
    alignItems: 'flex-end',
  },
  recentScore: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  recentScoreLab: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  quickHeader: {
    marginBottom: 16,
  },
  quickTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#1E293B',
  },
  viewAll: {
    fontSize: 13,
    color: '#2563EB',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  gridItemRight: {
    marginLeft: 0, // removed margin as we use gap
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardInnerHighlight: {
    display: 'none',
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    color: '#1E293B',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Medium',
    lineHeight: 14,
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
