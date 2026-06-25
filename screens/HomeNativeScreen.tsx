import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { ScreenColumn } from '../components/ScreenColumn';
import { AppHeader } from '../components/AppHeader';
import { BottomNavBar } from '../components/BottomNavBar';
import { SectionHeading } from '../components/SectionHeading';
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
import { colors, radii, shadows, spacing, typography } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeNative'>;
type LearningRoute = 'ExamInstructionsNative' | 'ReadingNative' | 'RoadSigns' | 'VideoCourseList';

type LearningPath = {
  route: LearningRoute;
  titleKey: string;
  subtitleKey: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  background: string;
};

const LEARNING_PATHS: LearningPath[] = [
  {
    route: 'ReadingNative',
    titleKey: 'home.action.reading',
    subtitleKey: 'home.action.readingSub',
    icon: 'book-open-page-variant-outline',
    color: colors.brandStrong,
    background: colors.brandSoft,
  },
  {
    route: 'VideoCourseList',
    titleKey: 'video.listTitle',
    subtitleKey: 'nav.watch',
    icon: 'play-circle-outline',
    color: '#A55F1D',
    background: colors.amberSoft,
  },
  {
    route: 'RoadSigns',
    titleKey: 'home.action.roadSigns',
    subtitleKey: 'home.action.roadSignsSub',
    icon: 'sign-caution',
    color: colors.green,
    background: colors.greenSoft,
  },
];

function getInitials(name?: string | null) {
  if (!name?.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function calculateStreak(history: PerformanceHistoryRow[]) {
  if (history.length === 0) return 0;
  const uniqueDays = new Set(
    history.map((row) => {
      const day = new Date(row.date);
      day.setHours(0, 0, 0, 0);
      return day.getTime();
    }),
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  while (uniqueDays.has(today.getTime())) {
    streak += 1;
    today.setDate(today.getDate() - 1);
  }
  return streak;
}

export function HomeNativeScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const { accessToken, name } = useAuth();
  const { openGateModal } = useGateModal();
  const {
    hasUsedFreeTrial,
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
    isSigningOut,
  } = useAppFlow();

  const [rows, setRows] = useState<PerformanceHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<{ type: 'pdf' | 'video'; item: PdfItem | VideoItem } | null>(
    null,
  );

  const languageAccessGranted = hasLanguageAccess({
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const local = await readLocalExamRecords();
      if (!accessToken) {
        setRows(mergePerformanceHistory([], local));
        setRecommendation(null);
        return;
      }

      const [remote, pdfs, videos] = await Promise.all([
        getPerformanceHistory(accessToken).catch(() => []),
        getPdfs(accessToken, contentLanguage).catch(() => []),
        getVideos(accessToken, contentLanguage).catch(() => []),
      ]);
      setRows(mergePerformanceHistory(remote, local));

      const newPdf = pdfs.find((item) => (item as PdfItem & { isNew?: boolean }).isNew === true);
      const newVideo = videos.find((item) => (item as VideoItem & { isNew?: boolean }).isNew === true);
      setRecommendation(newPdf ? { type: 'pdf', item: newPdf } : newVideo ? { type: 'video', item: newVideo } : null);
    } catch (error) {
      if (__DEV__) console.warn('[Home] failed to load dashboard', error);
      const local = await readLocalExamRecords();
      setRows(mergePerformanceHistory([], local));
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, contentLanguage]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleLearningRoute = (route: LearningRoute) => {
    if (route === 'ExamInstructionsNative') {
      if (hasSubscription && !languageAccessGranted && !isSigningOut) {
        openGateModal('subscription_exam', () => navigation.navigate('SubscriptionNative'));
        return;
      }
      navigation.navigate(route);
      return;
    }

    if (!languageAccessGranted && !isSigningOut) {
      openGateModal(route === 'VideoCourseList' ? 'subscription_watch' : 'subscription_read', () =>
        navigation.navigate('SubscriptionNative'),
      );
      return;
    }
    if (route === 'RoadSigns') {
      navigation.navigate('ReadingNative', { initialTab: 'signs' });
      return;
    }
    navigation.navigate(route);
  };

  const totalExams = rows.length;
  const average = totalExams ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / totalExams) : 0;
  const passed = rows.filter((row) => row.status === 'PASSED').length;
  const successRate = totalExams ? Math.round((passed / totalExams) * 100) : 0;
  const lastExam = rows[0];
  const streak = calculateStreak(rows);
  const welcome = name?.trim() ? t('home.welcome', { name: name.trim() }) : t('home.welcomeGuest');
  const recommendationTitle =
    recommendation?.item.title ?? recommendation?.item.name ?? t('reading.documentFallback');

  return (
    <ScreenColumn>
      <AppHeader
        title={t('home.title')}
        navigation={navigation}
        titleOffsetX={6}
        left={
          <TouchableOpacity
            style={styles.headerAvatar}
            onPress={() => navigation.navigate('ProfileNative')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('profile.title')}
          >
            <Text style={styles.headerAvatarText}>{getInitials(name)}</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottomPad + spacing.xl }]}
        >
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeCopy}>
              <Text style={styles.welcome} numberOfLines={1}>
                {welcome}
              </Text>
              <Text style={styles.subwelcome}>{t('home.subwelcome')}</Text>
            </View>
            {streak > 0 ? (
              <View style={styles.streakBadge}>
                <Ionicons name="calendar-outline" size={16} color={colors.brandStrong} />
                <Text style={styles.streakText}>{streak}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.readinessCard}>
            <Text style={styles.heroTitle}>
              {totalExams ? t('home.keepMomentum') : t('home.startJourney')}
            </Text>
            <Text style={styles.heroBody}>
              {totalExams ? t('home.progressBody', { count: totalExams }) : t('home.startJourneyBody')}
            </Text>
            <View style={styles.bannerStats}>
              <View style={styles.bannerPill}>
                <Text style={styles.bannerPillText}>
                  {t('performance.totalExams')}: {loading ? '...' : totalExams}
                </Text>
              </View>
              <View style={styles.bannerPill}>
                <Text style={styles.bannerPillText}>
                  {t('performance.successRate')}: {loading ? '...' : `${successRate}%`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metricStrip}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{totalExams}</Text>
              <Text style={styles.metricLabel}>{t('performance.totalExams')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{average}%</Text>
              <Text style={styles.metricLabel}>{t('performance.avgAccuracy')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{successRate}%</Text>
              <Text style={styles.metricLabel}>{t('performance.successRate')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => handleLearningRoute('ExamInstructionsNative')}
            activeOpacity={0.88}
          >
            <View style={styles.primaryIcon}>
              <MaterialCommunityIcons name="steering" size={25} color={colors.white} />
            </View>
            <View style={styles.primaryCopy}>
              <Text style={styles.primaryEyebrow}>{t('home.primaryEyebrow')}</Text>
              <Text style={styles.primaryTitle}>{t('home.action.exams')}</Text>
            </View>
            <View style={styles.primaryArrow}>
              <Ionicons name="arrow-forward" size={19} color={colors.brandStrong} />
            </View>
          </TouchableOpacity>

          <View style={styles.sectionGap}>
            <SectionHeading title={t('home.learningPaths')} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pathList}
            snapToInterval={292}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            directionalLockEnabled
            nestedScrollEnabled
            alwaysBounceHorizontal
            scrollEventThrottle={16}
            accessibilityRole="scrollbar"
            accessibilityLabel={t('home.learningPaths')}
          >
            {LEARNING_PATHS.map((path) => (
              <TouchableOpacity
                key={path.route}
                style={styles.pathCard}
                onPress={() => handleLearningRoute(path.route)}
                activeOpacity={0.84}
              >
                <View style={[styles.pathIcon, { backgroundColor: path.background }]}>
                  <MaterialCommunityIcons name={path.icon} size={25} color={path.color} />
                </View>
                <View style={styles.pathCopy}>
                  <Text style={styles.pathTitle} numberOfLines={2}>
                    {t(path.titleKey).replace('\n', ' ')}
                  </Text>
                  <Text style={styles.pathSubtitle} numberOfLines={1}>
                    {t(path.subtitleKey).replace('\n', ' ')}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={21} color={path.color} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {recommendation ? (
            <View style={styles.sectionGap}>
              <SectionHeading title={t('home.recommended')} />
              <TouchableOpacity
                style={styles.recommendation}
                onPress={() => handleLearningRoute(recommendation.type === 'pdf' ? 'ReadingNative' : 'VideoCourseList')}
                activeOpacity={0.85}
              >
                <View style={styles.recommendationIcon}>
                  <Ionicons
                    name={recommendation.type === 'pdf' ? 'document-text-outline' : 'play-outline'}
                    size={22}
                    color={colors.brand}
                  />
                </View>
                <View style={styles.recommendationCopy}>
                  <Text style={styles.recommendationLabel}>{t('home.newContent')}</Text>
                  <Text style={styles.recommendationTitle} numberOfLines={1}>
                    {recommendationTitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.sectionGap}>
            <SectionHeading
              title={t('home.recentInsight')}
              action={lastExam ? t('home.viewAll') : undefined}
              onAction={lastExam ? () => navigation.navigate('PerformanceNative') : undefined}
            />
            {lastExam ? (
              <TouchableOpacity
                style={styles.insightCard}
                onPress={() => navigation.navigate('PerformanceNative')}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.scoreBadge,
                    { backgroundColor: lastExam.status === 'PASSED' ? colors.greenSoft : colors.redSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreValue,
                      { color: lastExam.status === 'PASSED' ? colors.green : colors.red },
                    ]}
                  >
                    {lastExam.percent}%
                  </Text>
                </View>
                <View style={styles.insightCopy}>
                  <Text style={styles.insightTitle}>
                    {lastExam.title.startsWith('performance.') ? t(lastExam.title) : lastExam.title}
                  </Text>
                  <Text style={styles.insightMeta}>{new Date(lastExam.date).toLocaleDateString()}</Text>
                </View>
                <Ionicons name="trending-up" size={20} color={colors.brand} />
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyInsight}>
                <Ionicons name="analytics-outline" size={23} color={colors.inkSoft} />
                <Text style={styles.emptyInsightText}>{t('performance.empty')}</Text>
              </View>
            )}
          </View>

          {!hasSubscription ? (
            <TouchableOpacity
              style={styles.planBanner}
              onPress={() => navigation.navigate('SubscriptionNative')}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles-outline" size={21} color="#9A5A18" />
              <View style={styles.planCopy}>
                <Text style={styles.planTitle}>
                  {hasUsedFreeTrial ? t('home.trialUsedTitle') : t('home.trialAvailableTitle')}
                </Text>
                <Text style={styles.planBody}>
                  {hasUsedFreeTrial ? t('home.trialUsedBody') : t('home.trialAvailableBody')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9A5A18" />
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>

      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    marginLeft: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  headerAvatarText: {
    ...typography.caption,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.white,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeCopy: {
    flex: 1,
    paddingLeft: spacing.xs,
  },
  welcome: {
    ...typography.title,
    color: colors.ink,
  },
  subwelcome: {
    ...typography.caption,
    marginTop: 2,
    color: colors.inkMuted,
  },
  streakBadge: {
    minWidth: 44,
    height: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.brandSoft,
  },
  streakText: {
    ...typography.bodyStrong,
    color: colors.brandStrong,
  },
  readinessCard: {
    minHeight: 110,
    overflow: 'hidden',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    justifyContent: 'center',
    backgroundColor: colors.brandStrong,
    ...shadows.card,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.25,
    color: colors.white,
  },
  heroBody: {
    ...typography.caption,
    marginTop: 3,
    maxWidth: 540,
    color: '#DCE7FA',
  },
  bannerStats: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bannerPill: {
    minHeight: 28,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  bannerPillText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
  },
  metricStrip: {
    minHeight: 82,
    marginTop: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  metricValue: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    color: colors.ink,
  },
  metricLabel: {
    ...typography.caption,
    marginTop: 3,
    fontSize: 10,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.line,
  },
  primaryAction: {
    minHeight: 76,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand,
    ...shadows.card,
  },
  primaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  primaryCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  primaryEyebrow: {
    ...typography.eyebrow,
    color: '#C9D8F0',
    textTransform: 'uppercase',
  },
  primaryTitle: {
    ...typography.title,
    marginTop: 2,
    color: colors.white,
  },
  primaryArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  sectionGap: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  pathList: {
    marginTop: spacing.md,
    paddingRight: spacing.xl,
    gap: spacing.md,
  },
  pathCard: {
    width: 280,
    minHeight: 112,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathCopy: {
    flex: 1,
    marginHorizontal: spacing.lg,
  },
  pathTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
  },
  pathSubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.inkMuted,
  },
  recommendation: {
    minHeight: 72,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  recommendationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  recommendationCopy: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  recommendationLabel: {
    ...typography.eyebrow,
    color: colors.brand,
    textTransform: 'uppercase',
  },
  recommendationTitle: {
    ...typography.bodyStrong,
    marginTop: 2,
    color: colors.ink,
  },
  insightCard: {
    minHeight: 78,
    padding: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  scoreBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 15,
  },
  insightCopy: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  insightTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  insightMeta: {
    ...typography.caption,
    marginTop: 3,
    color: colors.inkSoft,
  },
  emptyInsight: {
    minHeight: 78,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9D1C7',
  },
  emptyInsightText: {
    ...typography.body,
    flex: 1,
    color: colors.inkMuted,
  },
  planBanner: {
    minHeight: 76,
    marginTop: spacing.xxl,
    padding: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: '#F1D39F',
  },
  planCopy: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  planTitle: {
    ...typography.bodyStrong,
    color: '#774817',
  },
  planBody: {
    ...typography.caption,
    marginTop: 3,
    color: '#93642E',
  },
});
