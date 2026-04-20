import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAuth } from '../context/AuthContext';
import { getPerformanceHistory } from '../services/performanceApi';
import { readLocalExamRecords } from '../services/examHistoryStorage';
import { mapLocalExamRecord, mergePerformanceHistory, type PerformanceHistoryRow } from '../services/performanceHistory';
import { getMessageFromUnknownError } from '../services/api/client';
import { useI18n } from '../i18n/useI18n';

type PerfProps = NativeStackScreenProps<RootStackParamList, 'PerformanceNative'>;
type DetailProps = NativeStackScreenProps<RootStackParamList, 'PerformanceDetailNative'>;
type ReviewProps = NativeStackScreenProps<RootStackParamList, 'PerformanceReviewNative'>;

type ReviewAttempt = NonNullable<PerformanceHistoryRow>;

function coerceReviewAttempt(params?: ReviewProps['route']['params']): ReviewAttempt | null {
  if (!params) return null;
  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);
  const percent = Number(params.percent ?? (total > 0 ? Math.round((correct / total) * 100) : 0));
  const passed = params.passed ?? percent >= 60;
  return {
    id: 'review_params',
    title: params.title ?? 'performance.theoryExam',
    date: params.dateLabel ?? params.finishedAt ?? params.startedAt ?? new Date().toISOString(),
    status: passed ? 'PASSED' : 'FAILED',
    answers: `${correct}/${total || 1}`,
    duration: params.timeLabel ?? '—',
    sortKey: Date.now(),
    percent,
    correct,
    total: total || 1,
    answeredCount: params.answeredCount,
    startedAt: params.startedAt,
    finishedAt: params.finishedAt,
    elapsedSec: params.elapsedSec,
    answerDetails: params.answerDetails ?? [],
  };
}

const LANGUAGE_LOCALE_MAP = {
  en: 'en-US',
  rw: 'rw-RW',
  fr: 'fr-FR',
} as const;

function formatHistoryDateForLanguage(raw: string, lang: 'en' | 'rw' | 'fr', fallback: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return fallback;
  const locale = LANGUAGE_LOCALE_MAP[lang] ?? 'en-US';
  return d.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDurationForLanguage(raw: string, minShort: string, naText: string): string {
  const value = raw.trim();
  if (!value || value === '—' || value === 'â€”') return naText;
  const minMatch = value.match(/^(\d+)\s*min$/i);
  if (minMatch) return `${minMatch[1]} ${minShort}`;
  return value;
}

function TopHeader({
  title,
  onBack,
  navigation,
  plain = false,
}: {
  title: string;
  onBack: () => void;
  navigation: PerfProps['navigation'] | DetailProps['navigation'] | ReviewProps['navigation'];
  plain?: boolean;
}) {
  const { insets } = useResponsiveLayout();
  return (
    <View style={[styles.header, plain ? styles.headerPlain : styles.headerBlue, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={plain ? '#1E293B' : '#FFFFFF'} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: plain ? '#1E293B' : '#FFFFFF' }]}>{title}</Text>
      <HeaderMenu navigation={navigation} iconColor={plain ? '#1E293B' : '#FFFFFF'} topOffset={56} rightOffset={16} />
    </View>
  );
}

function BottomTabs({ navigation }: { navigation: PerfProps['navigation'] | DetailProps['navigation'] | ReviewProps['navigation'] }) {
  return <BottomNavBar navigation={navigation} />;
}

function HistoryCard({ item, onPress, index }: { item: PerformanceHistoryRow; onPress?: () => void; index: number }) {
  const { t, lang } = useI18n();
  const passed = item.status === 'PASSED';
  const statusText = passed ? t('performance.passed') : t('performance.failed');
  const displayTitle = item.title.startsWith('performance.') ? t(item.title) : item.title;
  const displayDate = formatHistoryDateForLanguage(item.date, lang, item.date);
  const displayDuration = formatDurationForLanguage(item.duration, t('common.minShort'), t('common.na'));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index, slideAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.historyCard} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.cardIndicator, { backgroundColor: passed ? '#22C55E' : '#EF4444' }]} />
        <View style={styles.historyTop}>
          <View style={styles.historyMeta}>
            <Text style={styles.historyTitle}>{displayTitle}</Text>
            <Text style={styles.historyDate}>{displayDate}</Text>
          </View>
          <View style={[styles.statusPill, passed ? styles.statusPillPass : styles.statusPillFail]}>
            <Text style={[styles.statusPillText, passed ? styles.statusPillTextPass : styles.statusPillTextFail]}>
              {statusText.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.historyBottom}>
          <View style={styles.metricItem}>
            <View style={[styles.metricIconBox, { backgroundColor: '#F1F5F9' }]}>
              <MaterialIcons name="fact-check" size={14} color="#475569" />
            </View>
            <View>
              <Text style={styles.metricLabel}>{t('performance.answers')}</Text>
              <Text style={styles.metricValue}>{item.answers}</Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <View style={[styles.metricIconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="time-outline" size={14} color="#475569" />
            </View>
            <View>
              <Text style={styles.metricLabel}>{t('performance.duration')}</Text>
              <Text style={styles.metricValue}>{displayDuration}</Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <View style={[styles.metricIconBox, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="trending-up" size={14} color="#0EA5E9" />
            </View>
            <View>
              <Text style={styles.metricLabel}>{t('performance.accuracy')}</Text>
              <Text style={[styles.metricValue, { color: '#0EA5E9' }]}>{item.percent}%</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function PerformanceSummary({ rows }: { rows: PerformanceHistoryRow[] }) {
  const { t } = useI18n();
  const total = rows.length;
  const avgAccuracy = total > 0 ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / total) : 0;
  const passedCount = rows.filter((r) => r.status === 'PASSED').length;
  const successRate = total > 0 ? Math.round((passedCount / total) * 100) : 0;

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{total}</Text>
            <Text style={styles.summaryLab}>{t('performance.totalExams')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{avgAccuracy}%</Text>
            <Text style={styles.summaryLab}>{t('performance.avgAccuracy')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{successRate}%</Text>
            <Text style={styles.summaryLab}>{t('performance.successRate')}</Text>
          </View>
      </View>
    </View>
  );
}

function HistoryBackground({
  navigation,
  rows,
  loading,
  loadError,
  onRetry,
}: {
  navigation: PerfProps['navigation'] | DetailProps['navigation'];
  rows: PerformanceHistoryRow[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  return (
    <>
      <TopHeader title={t('performance.title')} onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <PerformanceSummary rows={rows} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('performance.history')}</Text>
          <TouchableOpacity onPress={onRetry} disabled={loading} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={14} color="#4A78D0" />
            <Text style={styles.refreshText}>{t('performance.refresh')}</Text>
          </TouchableOpacity>
        </View>
        {loadError ? <View style={styles.errorBox}><Text style={styles.inlineError}>{loadError}</Text></View> : null}
        {loading && rows.length === 0 ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="large" color="#4A78D0" />
          </View>
        ) : null}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.listPad, { paddingBottom: tabScrollBottomPad }]}>
          {rows.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>{t('performance.emptyTitle')}</Text>
              <Text style={styles.emptyText}>{t('performance.empty')}</Text>
            </View>
          ) : null}
          {rows.map((item, idx) => (
            <HistoryCard
              key={item.id}
              item={item}
              index={idx}
              onPress={() =>
                navigation.navigate('PerformanceDetailNative', {
                  correct: item.correct,
                  total: item.total,
                  percent: item.percent,
                  timeLabel: item.duration,
                  passed: item.status === 'PASSED',
                  dateLabel: item.date,
                  title: item.title,
                  answeredCount: item.answeredCount,
                  startedAt: item.startedAt,
                  finishedAt: item.finishedAt,
                  elapsedSec: item.elapsedSec,
                  answerDetails: item.answerDetails,
                })
              }
            />
          ))}
        </ScrollView>
      </View>
    </>
  );
}

function ProgressRow({ title, value }: { title: string; value: number }) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>{title}</Text>
        <Text style={styles.progressValue}>{value}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${value}%` }]} />
      </View>
    </View>
  );
}

export function PerformanceNativeScreen({ navigation }: PerfProps) {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<PerformanceHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const local = await readLocalExamRecords();
      if (!accessToken) {
        setRows(mergePerformanceHistory([], local));
        return;
      }
      const remote = await getPerformanceHistory(accessToken);
      setRows(mergePerformanceHistory(remote, local));
    } catch (e) {
      setLoadError(getMessageFromUnknownError(e));
      const local = await readLocalExamRecords();
      setRows(mergePerformanceHistory([], local));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <HistoryBackground navigation={navigation} rows={rows} loading={loading} loadError={loadError} onRetry={load} />
      <BottomTabs navigation={navigation} />
    </ScreenColumn>
  );
}

export function PerformanceDetailNativeScreen({ navigation, route }: DetailProps) {
  const { t, lang } = useI18n();
  const p = route.params;
  const passed = p?.passed ?? true;
  const correct = p?.correct ?? 18;
  const total = p?.total ?? 20;
  const percent = p?.percent ?? Math.round((correct / Math.max(total, 1)) * 100);
  const timeLabel = p?.timeLabel ?? '—';
  const dateRaw = p?.dateLabel ?? '';
  const dateLabel = formatHistoryDateForLanguage(dateRaw, lang, t('common.na'));
  const titleRaw = p?.title ?? 'performance.detail.title';
  const title = titleRaw.startsWith('performance.') ? t(titleRaw) : titleRaw;
  const durationLabel = formatDurationForLanguage(timeLabel, t('common.minShort'), t('common.na'));
  const answeredCount = p?.answeredCount ?? correct;
  const startedAt = p?.startedAt ?? '';
  const finishedAt = p?.finishedAt ?? dateRaw;

  return (
    <ScreenColumn backgroundColor="#F8FAFC">
      <TopHeader
        title={t('performance.title')}
        onBack={() => navigation.goBack()}
        navigation={navigation}
        plain
      />
      <View style={styles.detailBody}>
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View>
              <View style={[styles.statusTag, passed ? styles.statusTagPass : styles.statusTagFail]}>
                <Text style={[styles.statusTagText, passed ? styles.statusTagTextPass : styles.statusTagTextFail]}>
                  {(passed ? t('performance.passed') : t('performance.failed')).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.detailExamTitle}>{title}</Text>
              <Text style={styles.detailDate}>{dateLabel}</Text>
            </View>
          </View>

          <View style={styles.detailStatsGrid}>
            <View style={styles.detailStatItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text style={styles.detailStatVal}>{correct}/{total}</Text>
              <Text style={styles.detailStatLab}>{t('performance.score')}</Text>
            </View>
            <View style={styles.detailStatItem}>
              <Ionicons name="time-outline" size={20} color="#4A78D0" />
              <Text style={styles.detailStatVal}>{durationLabel}</Text>
              <Text style={styles.detailStatLab}>{t('performance.time')}</Text>
            </View>
            <View style={styles.detailStatItem}>
              <Ionicons name="trending-up" size={20} color="#F59E0B" />
              <Text style={styles.detailStatVal}>{percent}%</Text>
              <Text style={styles.detailStatLab}>{t('performance.accuracy')}</Text>
            </View>
          </View>

          <View style={styles.detailInfoBox}>
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoLabel}>{t('performance.startedAt')}</Text>
              <Text style={styles.detailInfoValue}>{formatHistoryDateForLanguage(startedAt, lang, t('common.na'))}</Text>
            </View>
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoLabel}>{t('performance.finishedAt')}</Text>
              <Text style={styles.detailInfoValue}>{formatHistoryDateForLanguage(finishedAt, lang, t('common.na'))}</Text>
            </View>
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoLabel}>{t('performance.answered')}</Text>
              <Text style={styles.detailInfoValue}>{answeredCount}/{total}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />
          <Text style={styles.breakdownTitle}>{t('test.results').toUpperCase()}</Text>
          <ProgressRow title={t('performance.overall')} value={percent} />

          <View style={styles.detailActions}>
            <TouchableOpacity
              style={styles.detailPrimaryBtn}
              onPress={() =>
                navigation.navigate('PerformanceReviewNative', {
                  title,
                  dateLabel,
                  correct,
                  total,
                  percent,
                  timeLabel: durationLabel,
                  passed,
                  answeredCount,
                  startedAt,
                  finishedAt,
                  elapsedSec: p?.elapsedSec,
                  answerDetails: p?.answerDetails,
                })
              }
            >
              <Ionicons name="eye-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.detailPrimaryBtnText}>{t('performance.review')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailSecondaryBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.detailSecondaryBtnText}>{t('performance.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <BottomTabs navigation={navigation} />
    </ScreenColumn>
  );
}

export function PerformanceReviewNativeScreen({ navigation, route }: ReviewProps) {
  const { t, lang } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const [attempt, setAttempt] = useState<ReviewAttempt | null>(() => coerceReviewAttempt(route.params));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const directAttempt = coerceReviewAttempt(route.params);
    if (directAttempt) {
      setAttempt(directAttempt);
      setCurrentIndex(0);
      return () => {
        cancelled = true;
        void cancelled;
      };
    }

    const loadLatest = async () => {
      const local = await readLocalExamRecords();
      if (cancelled) return;
      const latest = local[0] ? mapLocalExamRecord(local[0]) : null;
      setAttempt(latest);
      setCurrentIndex(0);
    };
    void loadLatest();
    return () => {
      cancelled = true;
    };
  }, [route.params]);

  const answerDetails = attempt?.answerDetails ?? [];
  const totalQuestions = answerDetails.length || attempt?.total || 1;
  const currentQuestion = answerDetails[Math.min(currentIndex, Math.max(answerDetails.length - 1, 0))];
  const currentLabel = `${t('exam.question')} ${Math.min(currentIndex + 1, totalQuestions)} ${t('common.of')} ${totalQuestions}`;
  const startedLabel = attempt?.startedAt ? formatHistoryDateForLanguage(attempt.startedAt, lang, t('common.na')) : t('common.na');
  const finishedLabel = attempt?.finishedAt ? formatHistoryDateForLanguage(attempt.finishedAt, lang, t('common.na')) : t('common.na');
  const durationLabel = attempt?.duration ?? t('common.na');
  const reviewTitle = attempt?.title?.startsWith('performance.') ? t(attempt.title) : attempt?.title ?? t('test.results');
  const selectedAnswerText = currentQuestion?.selectedOptionText ?? t('performance.noAnswer');
  const correctAnswerText = currentQuestion?.correctOptionText ?? t('common.na');
  const selectedIsCorrect = Boolean(currentQuestion?.isCorrect);

  return (
    <ScreenColumn backgroundColor="#F8FAFC">
      <TopHeader title={t('test.results')} onBack={() => navigation.goBack()} navigation={navigation} plain />
      <View style={styles.detailBody}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.reviewPad, { paddingBottom: tabScrollBottomPad }]}>
          {attempt ? (
            <View style={styles.reviewSummaryBox}>
              <Text style={styles.reviewSummaryTitle}>{reviewTitle}</Text>
              <View style={styles.reviewSummaryGrid}>
                <View style={styles.reviewSummaryItem}>
                  <Text style={styles.reviewSummaryLabel}>{t('performance.startedAt')}</Text>
                  <Text style={styles.reviewSummaryValue}>{startedLabel}</Text>
                </View>
                <View style={styles.reviewSummaryItem}>
                  <Text style={styles.reviewSummaryLabel}>{t('performance.finishedAt')}</Text>
                  <Text style={styles.reviewSummaryValue}>{finishedLabel}</Text>
                </View>
                <View style={styles.reviewSummaryItem}>
                  <Text style={styles.reviewSummaryLabel}>{t('performance.duration')}</Text>
                  <Text style={styles.reviewSummaryValue}>{durationLabel}</Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.reviewStepBox}>
            <Text style={styles.reviewStepText}>
              {currentLabel}
            </Text>
            <View style={styles.reviewStepDots}>
              {answerDetails.slice(0, 5).map((_, i) => (
                <View key={i} style={[styles.stepDot, i === currentIndex && styles.stepDotActive]} />
              ))}
            </View>
          </View>

          {currentQuestion ? (
            <>
              <View style={styles.questionCard}>
                <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
              </View>

              <View style={styles.optionsSection}>
                <View style={[styles.answerOption, selectedIsCorrect ? styles.correctOption : styles.wrongOption]}>
                  <View style={styles.optionMarker}>
                    <Ionicons
                      name={selectedIsCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.answerStack}>
                    <Text style={styles.answerLabel}>{t('performance.yourAnswer')}</Text>
                    <Text style={styles.answerLight}>{selectedAnswerText}</Text>
                  </View>
                </View>

                <View style={[styles.answerOption, styles.correctOption]}>
                  <View style={styles.optionMarker}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.answerStack}>
                    <Text style={styles.answerLabel}>{t('performance.correctAnswer')}</Text>
                    <Text style={styles.answerLight}>{correctAnswerText}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.explanationBox}>
                <View style={styles.explainHeader}>
                  <Ionicons name="bulb-outline" size={16} color="#4A78D0" />
                  <Text style={styles.explainTitle}>{t('performance.review')}</Text>
                </View>
                <Text style={styles.explainText}>
                  {t('performance.reviewExplanation')}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyReviewBox}>
              <Text style={styles.emptyReviewTitle}>{t('performance.emptyTitle')}</Text>
              <Text style={styles.emptyReviewText}>{t('performance.empty')}</Text>
            </View>
          )}

          <View style={styles.reviewNav}>
            <TouchableOpacity
              style={[styles.reviewNavBtn, currentIndex === 0 && styles.navBtnDisabled]}
              onPress={() => setCurrentIndex((idx) => Math.max(idx - 1, 0))}
              disabled={currentIndex === 0}
            >
              <Ionicons name="chevron-back" size={20} color="#475569" />
              <Text style={styles.reviewNavBtnText}>{t('exam.previous')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reviewNavBtn, styles.reviewNavBtnPrimary, currentIndex >= answerDetails.length - 1 && styles.navBtnDisabled]}
              onPress={() => {
                if (currentIndex < answerDetails.length - 1) {
                  setCurrentIndex((idx) => Math.min(idx + 1, answerDetails.length - 1));
                  return;
                }
                navigation.navigate('PerformanceNative');
              }}
            >
              <Text style={[styles.reviewNavBtnText, { color: '#FFFFFF' }]}>{t('exam.next')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 110,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerBlue: { backgroundColor: '#4A78D0' },
  headerPlain: { backgroundColor: '#F8FAFC' },
  backBtn: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18 },
  body: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  summaryContainer: {
    backgroundColor: '#4A78D0',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 20, color: '#FFFFFF' },
  summaryLab: { marginTop: 4, fontFamily: 'PlusJakartaSans-Medium', fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  summaryDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: '#1E293B' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: '#4A78D0' },
  errorBox: { marginHorizontal: 20, marginBottom: 16, padding: 12, borderRadius: 8, backgroundColor: '#FEF2F2' },
  inlineError: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, color: '#B91C1C' },
  centerPad: { paddingVertical: 40, alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, color: '#334155', marginBottom: 8 },
  emptyText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  listPad: { paddingHorizontal: 18, paddingTop: 6 },
  historyCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  historyMeta: { flex: 1, marginRight: 8 },
  historyTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: '#0F172A', marginBottom: 4 },
  historyDate: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: '#64748B' },
  statusPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillPass: { backgroundColor: '#DCFCE7' },
  statusPillFail: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 10 },
  statusPillTextPass: { color: '#166534' },
  statusPillTextFail: { color: '#991B1B' },
  historyBottom: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metricItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  metricIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  metricLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 9, color: '#94A3B8', marginBottom: 2 },
  metricValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: '#334155' },

  detailBody: { flex: 1, paddingHorizontal: 20 },
  detailCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  detailCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  statusTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 10 },
  statusTagPass: { backgroundColor: '#22C55E' },
  statusTagFail: { backgroundColor: '#EF4444' },
  statusTagText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, color: '#FFFFFF' },
  statusTagTextPass: { color: '#FFFFFF' },
  statusTagTextFail: { color: '#FFFFFF' },
  detailExamTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: '#0F172A', marginBottom: 6 },
  detailDate: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: '#64748B' },
  detailStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  detailStatItem: { flex: 1, alignItems: 'center' },
  detailStatVal: { marginTop: 8, fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: '#1E293B' },
  detailStatLab: { marginTop: 2, fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, color: '#94A3B8' },
  detailInfoBox: { marginBottom: 24, padding: 14, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  detailInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailInfoLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 11, color: '#64748B', textTransform: 'uppercase' },
  detailInfoValue: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, color: '#0F172A', flexShrink: 1, textAlign: 'right', marginLeft: 8 },
  detailDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 24 },
  breakdownTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 11, color: '#94A3B8', letterSpacing: 1, marginBottom: 16 },
  progressRow: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: '#1E293B' },
  progressValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: '#1E293B' },
  progressTrack: { marginTop: 8, height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#4A78D0', borderRadius: 4 },
  detailActions: { marginTop: 32, gap: 12 },
  detailPrimaryBtn: { height: 56, borderRadius: 28, backgroundColor: '#4A78D0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#4A78D0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  detailPrimaryBtnText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: '#FFFFFF' },
  detailSecondaryBtn: { height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  detailSecondaryBtnText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: '#475569' },

  reviewStepBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  reviewStepText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: '#64748B' },
  reviewStepDots: { flexDirection: 'row', gap: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0' },
  stepDotActive: { width: 16, backgroundColor: '#4A78D0' },
  questionCard: { borderRadius: 20, backgroundColor: '#FFFFFF', padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  questionText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, color: '#0F172A', marginBottom: 18, lineHeight: 26 },
  diagramContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, alignItems: 'center' },
  diagram: { width: '100%', height: 200 },
  optionsSection: { gap: 10, marginBottom: 24 },
  answerOption: { minHeight: 64, borderRadius: 16, backgroundColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  correctOption: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#22C55E' },
  wrongOption: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' },
  optionMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  answerStack: { flex: 1, paddingVertical: 12 },
  answerLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, color: '#64748B', textTransform: 'uppercase', marginBottom: 3 },
  markerText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: '#475569' },
  answerLight: { flex: 1, fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: '#1E293B' },
  answerDark: { flex: 1, fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: '#1E293B' },
  explanationBox: { backgroundColor: '#F0F9FF', borderRadius: 16, padding: 16, marginBottom: 32 },
  explainHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  explainTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: '#4A78D0', letterSpacing: 0.5 },
  explainText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: '#334155', lineHeight: 22 },
  reviewNav: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  reviewNavBtn: { flex: 1, height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  reviewNavBtnPrimary: { backgroundColor: '#4A78D0', borderColor: '#4A78D0' },
  reviewNavBtnText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: '#475569' },
  navBtnDisabled: { opacity: 0.45 },
  reviewPad: { paddingVertical: 20 },
  reviewSummaryBox: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  reviewSummaryTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, color: '#0F172A', marginBottom: 12 },
  reviewSummaryGrid: { flexDirection: 'row', gap: 12 },
  reviewSummaryItem: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12 },
  reviewSummaryLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 },
  reviewSummaryValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: '#1E293B' },
  emptyReviewBox: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20 },
  emptyReviewTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, color: '#0F172A', marginBottom: 8 },
  emptyReviewText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: '#64748B', textAlign: 'center' },
});
