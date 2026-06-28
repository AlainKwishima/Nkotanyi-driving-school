import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenColumn } from '../components/ScreenColumn';
import { AppHeader } from '../components/AppHeader';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAuth } from '../context/AuthContext';
import { getPerformanceHistory } from '../services/performanceApi';
import { readLocalExamRecords } from '../services/examHistoryStorage';
import { mapLocalExamRecord, mergePerformanceHistory, type PerformanceHistoryRow } from '../services/performanceHistory';
import { getMessageFromUnknownError } from '../services/api/client';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';

type PerfProps = NativeStackScreenProps<RootStackParamList, 'PerformanceNative'>;
type DetailProps = NativeStackScreenProps<RootStackParamList, 'PerformanceReviewNative'>;
type ReviewProps = NativeStackScreenProps<RootStackParamList, 'PerformanceReviewNative'>;

type ReviewAttempt = NonNullable<PerformanceHistoryRow>;
const REVIEW_OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function coerceReviewAttempt(params?: ReviewProps['route']['params']): ReviewAttempt | null {
  if (!params) return null;
  const hasAnswerDetails = Array.isArray(params.answerDetails) && params.answerDetails.length > 0;
  const hasAttemptIdentity = Boolean(params.title || params.dateLabel || params.startedAt || params.finishedAt);
  if (!hasAnswerDetails && !hasAttemptIdentity) return null;
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

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreTone(percent: number) {
  if (percent >= 60) {
    return {
      color: colors.success,
      backgroundColor: colors.successSoft,
    };
  }
  if (percent >= 50) {
    return {
      color: colors.brandStrong,
      backgroundColor: colors.brandSoft,
    };
  }
  return {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
  };
}

function TopHeader({
  title,
  onBack,
  navigation,
}: {
  title: string;
  onBack: () => void;
  navigation: PerfProps['navigation'] | ReviewProps['navigation'];
}) {
  return (
    <AppHeader title={title} onBack={onBack} navigation={navigation} />
  );
}

function BottomTabs({ navigation }: { navigation: PerfProps['navigation'] | ReviewProps['navigation'] }) {
  return <BottomNavBar navigation={navigation} />;
}

function HistoryCard({ item, onPress, index }: { item: PerformanceHistoryRow; onPress?: () => void; index: number }) {
  const { t, lang } = useI18n();
  const passed = item.status === 'PASSED';
  const statusText = passed ? t('performance.passed') : t('performance.failed');
  const displayTitle = item.title.startsWith('performance.') ? t(item.title) : item.title;
  const displayDate = formatHistoryDateForLanguage(item.date, lang, item.date);
  const tone = scoreTone(item.percent);

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
      <TouchableOpacity style={styles.historyRow} onPress={onPress} activeOpacity={0.78}>
        <Text style={styles.historyIndex}>{index + 1}</Text>
        <View style={styles.historyMeta}>
          <View>
            <Text style={styles.historyTitle}>{displayTitle}</Text>
            <Text style={styles.historyDate}>{displayDate}</Text>
          </View>
        </View>
        <View style={styles.historyScoreColumn}>
          <View style={[styles.scoreChip, { backgroundColor: tone.backgroundColor }]}>
            <Text style={[styles.scoreChipText, { color: tone.color }]}>{clampPercent(item.percent)}%</Text>
          </View>
          <Text style={[styles.historyStatus, passed ? styles.historyStatusPass : styles.historyStatusFail]}>
            {statusText}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatTile({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'brand';
}) {
  const color =
    tone === 'negative'
      ? colors.danger
      : tone === 'positive'
        ? colors.success
        : tone === 'brand'
          ? colors.brand
          : colors.ink;

  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function PerformanceSummary({ rows }: { rows: PerformanceHistoryRow[] }) {
  const { t } = useI18n();
  const total = rows.length;
  const avgAccuracy = total > 0 ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / total) : 0;
  const passedCount = rows.filter((r) => r.status === 'PASSED').length;
  const totalQuestions = rows.reduce((sum, row) => sum + row.total, 0);
  const recentDelta = total > 1 ? clampPercent(rows[0].percent) - clampPercent(rows[1].percent) : 0;
  const lowestScore = total > 0 ? Math.min(...rows.map((row) => clampPercent(row.percent))) : 0;
  const highestScore = total > 0 ? Math.max(...rows.map((row) => clampPercent(row.percent))) : 0;
  const deltaLabel = `${recentDelta > 0 ? '+' : ''}${recentDelta}%`;
  const averageWidth: `${number}%` = `${clampPercent(avgAccuracy)}%`;

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.performanceBanner}>
        <Text style={styles.performanceBannerTitle}>{t('performance.yourScore')}</Text>
        <Text style={styles.performanceBannerBody}>
          {t('performance.avgAccuracy')}: {avgAccuracy}%
        </Text>
        <View style={styles.performanceBannerStats}>
          <View style={styles.performanceBannerPill}>
            <Text style={styles.performanceBannerPillText}>
              {t('performance.totalExams')}: {total}
            </Text>
          </View>
          <View style={styles.performanceBannerPill}>
            <Text style={styles.performanceBannerPillText}>
              {t('performance.passedExams')}: {passedCount}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <StatTile label={t('performance.avgAccuracy')} value={`${avgAccuracy}%`} tone={avgAccuracy >= 60 ? 'positive' : 'negative'} />
        <StatTile label={t('performance.passedExams')} value={`${passedCount}`} tone="brand" />
        <StatTile label={t('performance.totalQuestions')} value={`${totalQuestions}`} />
        <StatTile
          label={t('performance.scoreTrend')}
          value={deltaLabel}
          tone={recentDelta >= 0 ? 'positive' : 'negative'}
        />
      </View>

      <View style={styles.scoreBand}>
        <Text style={styles.scoreBandTitle}>{t('performance.yourScore')}</Text>
        <View style={styles.scoreBandValues}>
          <View>
            <Text style={styles.scoreBandMin}>{lowestScore}%</Text>
            <Text style={styles.scoreBandLabel}>{t('performance.lowestScore')}</Text>
          </View>
          <View style={styles.scoreBandCenter}>
            <View style={styles.scoreTrack}>
              <View style={[styles.scoreFill, { width: averageWidth }]} />
            </View>
            <Text style={styles.scoreAverage}>
              {t('performance.avgAccuracy')} <Text style={styles.scoreAverageValue}>{avgAccuracy}%</Text>
            </Text>
          </View>
          <View style={styles.scoreBandRight}>
            <Text style={styles.scoreBandMax}>{highestScore}%</Text>
            <Text style={styles.scoreBandLabel}>{t('performance.highestScore')}</Text>
          </View>
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
  navigation: PerfProps['navigation'];
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.listPad, { paddingBottom: tabScrollBottomPad }]}>
          <PerformanceSummary rows={rows} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('performance.examList')}</Text>
            <TouchableOpacity onPress={onRetry} disabled={loading} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={14} color={colors.brand} />
              <Text style={styles.refreshText}>{loading ? t('common.loading') : t('performance.refresh')}</Text>
            </TouchableOpacity>
          </View>
          {loadError ? <View style={styles.errorBox}><Text style={styles.inlineError}>{loadError}</Text></View> : null}
          {rows.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>{t('performance.emptyTitle')}</Text>
              <Text style={styles.emptyText}>{t('performance.empty')}</Text>
            </View>
          ) : null}
          {rows.length > 0 ? (
            <View style={styles.historyTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.tableIndex]}>#</Text>
                <Text style={[styles.tableHeaderText, styles.tableExam]}>{t('performance.examColumn')}</Text>
                <Text style={[styles.tableHeaderText, styles.tableScore]}>{t('performance.scoreColumn')}</Text>
              </View>
              {rows.map((item, idx) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  index={idx}
                  onPress={() =>
                    navigation.navigate('PerformanceReviewNative', {
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
            </View>
          ) : null}
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
    <ScreenColumn>
      <HistoryBackground navigation={navigation} rows={rows} loading={loading} loadError={loadError} onRetry={load} />
      <BottomTabs navigation={navigation} />
    </ScreenColumn>
  );
}

function PerformanceDetailNativeScreen({ navigation, route }: DetailProps) {
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
    <ScreenColumn>
      <TopHeader
        title={t('performance.title')}
        onBack={() => navigation.goBack()}
        navigation={navigation}
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
              <Ionicons name="time-outline" size={20} color={colors.brand} />
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
  const selectedIsCorrect = Boolean(currentQuestion?.isCorrect);
  const reviewOptions =
    currentQuestion?.options && currentQuestion.options.length > 0
      ? currentQuestion.options
      : [
          ...(currentQuestion?.selectedOptionText
            ? [{
                id: currentQuestion.selectedOptionId ?? 'selected',
                text: currentQuestion.selectedOptionText,
                imageUrl: null,
                isCorrect: selectedIsCorrect,
              }]
            : []),
          ...(!selectedIsCorrect && currentQuestion?.correctOptionText
            ? [{
                id: currentQuestion.correctOptionId ?? 'correct',
                text: currentQuestion.correctOptionText,
                imageUrl: null,
                isCorrect: true,
              }]
            : []),
        ];
  const incorrectCount = answerDetails.filter((item) => !item.isCorrect).length;
  const correctionPercent = attempt?.percent ?? (attempt ? Math.round((attempt.correct / Math.max(attempt.total, 1)) * 100) : 0);
  const returnToExamInstructions = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'ExamInstructionsNative' }],
    });
  };

  return (
    <ScreenColumn>
      <TopHeader title={t('test.results')} onBack={returnToExamInstructions} navigation={navigation} />
      <View style={styles.reviewExamBody}>
        {currentQuestion ? (
          <>
            <View style={styles.reviewExamProgressHeader}>
              <View>
                <Text style={styles.reviewExamQuestionPosition}>{currentLabel}</Text>
                <Text style={styles.reviewExamAnsweredLabel}>
                  {t('exam.answeredCount', { answered: attempt?.answeredCount ?? answerDetails.length, total: totalQuestions })}
                </Text>
              </View>
              <View style={[styles.currentStatusChip, selectedIsCorrect ? styles.currentStatusCorrect : styles.currentStatusWrong]}>
                <Ionicons
                  name={selectedIsCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={selectedIsCorrect ? colors.success : colors.danger}
                />
                <Text style={[styles.currentStatusText, selectedIsCorrect ? styles.currentStatusTextCorrect : styles.currentStatusTextWrong]}>
                  {selectedIsCorrect ? t('performance.correct') : t('performance.incorrect')}
                </Text>
              </View>
            </View>
            <View style={styles.reviewExamProgressTrack}>
              <View style={[styles.reviewExamProgressFill, { width: `${((currentIndex + 1) / totalQuestions) * 100}%` }]} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.reviewQuestionNav}
              contentContainerStyle={styles.reviewQuestionNavContent}
            >
              {answerDetails.map((detail, index) => {
                const active = index === currentIndex;
                const correct = Boolean(detail.isCorrect);
                return (
                  <TouchableOpacity
                    key={`${detail.questionId}-chip-${index}`}
                    style={[
                      styles.reviewQuestionChip,
                      correct ? styles.reviewQuestionChipCorrect : styles.reviewQuestionChipWrong,
                      active && styles.reviewQuestionChipActive,
                    ]}
                    onPress={() => setCurrentIndex(index)}
                    activeOpacity={0.78}
                  >
                    <Text
                      style={[
                        styles.reviewQuestionChipText,
                        correct ? styles.reviewQuestionChipTextCorrect : styles.reviewQuestionChipTextWrong,
                        active && styles.reviewQuestionChipTextActive,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.reviewExamScroll}
              contentContainerStyle={styles.reviewExamContent}
            >
              <View style={styles.reviewQuestionCard}>
                {currentQuestion.questionImageUrls?.[0] ? (
                  <View style={styles.reviewImageStage}>
                    <Image source={{ uri: currentQuestion.questionImageUrls[0] }} style={styles.reviewQuestionImage} resizeMode="contain" />
                  </View>
                ) : null}
                <Text style={styles.reviewQuestionText}>{currentQuestion.questionText}</Text>
              </View>

              <Text style={styles.reviewChooseLabel}>{t('exam.chooseAnswer')}</Text>
              <View style={styles.reviewOptionList}>
                {reviewOptions.map((option, index) => {
                  const isSelected = option.id === currentQuestion.selectedOptionId || option.text === currentQuestion.selectedOptionText;
                  const isCorrect = Boolean(option.isCorrect);
                  const isWrongSelection = isSelected && !isCorrect;
                  const optionTone = isCorrect
                    ? styles.reviewOptionCorrect
                    : isWrongSelection
                      ? styles.reviewOptionWrong
                      : styles.reviewOptionNeutral;
                  const markerTone = isCorrect
                    ? styles.reviewOptionMarkerCorrect
                    : isWrongSelection
                      ? styles.reviewOptionMarkerWrong
                      : styles.reviewOptionMarkerNeutral;
                  return (
                    <View key={`${option.id}-${index}`} style={[styles.reviewOptionCard, optionTone]}>
                      <View style={[styles.reviewOptionMarker, markerTone]}>
                        {isCorrect || isWrongSelection ? (
                          <Ionicons
                            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                            size={18}
                            color="#FFFFFF"
                          />
                        ) : (
                          <Text style={styles.reviewOptionMarkerText}>{REVIEW_OPTION_LABELS[index] ?? index + 1}</Text>
                        )}
                      </View>
                      <View style={styles.reviewAnswerStack}>
                        <View style={styles.reviewAnswerLabelRow}>
                          {isSelected ? <Text style={styles.reviewAnswerLabel}>{t('performance.yourAnswer')}</Text> : null}
                          {isCorrect ? <Text style={styles.reviewCorrectLabel}>{t('performance.correctAnswer')}</Text> : null}
                        </View>
                        <Text style={styles.reviewAnswerText}>{option.text}</Text>
                        {option.imageUrl ? (
                          <Image source={{ uri: option.imageUrl }} style={styles.reviewOptionImage} resizeMode="contain" />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.explanationBox}>
                <View style={styles.explainHeader}>
                  <Ionicons name="bulb-outline" size={16} color={colors.brand} />
                  <Text style={styles.explainTitle}>{t('performance.feedback')}</Text>
                </View>
                <Text style={styles.explainText}>
                  {currentQuestion.explanation ?? t('performance.reviewExplanation')}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.reviewExamFooter}>
              <TouchableOpacity
                style={[styles.reviewExamNavButton, currentIndex === 0 && styles.navBtnDisabled]}
                onPress={() => setCurrentIndex((idx) => Math.max(idx - 1, 0))}
                disabled={currentIndex === 0}
              >
                <Ionicons name="arrow-back" size={19} color={currentIndex === 0 ? colors.inkSoft : colors.ink} />
                <Text style={[styles.reviewExamNavText, currentIndex === 0 && styles.navTextDisabled]}>{t('exam.previous')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reviewExamNavButton, styles.reviewExamNavButtonPrimary]}
                onPress={() => {
                  if (currentIndex < answerDetails.length - 1) {
                    setCurrentIndex((idx) => Math.min(idx + 1, answerDetails.length - 1));
                    return;
                  }
                  navigation.navigate('PerformanceNative');
                }}
              >
                <Text style={[styles.reviewExamNavText, styles.reviewExamNavTextPrimary]}>
                  {currentIndex >= answerDetails.length - 1 ? t('performance.finishReview') : t('exam.next')}
                </Text>
                <Ionicons name="arrow-forward" size={19} color={colors.white} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyReviewBox}>
            <Text style={styles.emptyReviewTitle}>{t('performance.reviewUnavailableTitle')}</Text>
            <Text style={styles.emptyReviewText}>{t('performance.reviewUnavailableBody')}</Text>
          </View>
        )}
      </View>
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  summaryContainer: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  performanceBanner: {
    minHeight: 110,
    overflow: 'hidden',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    justifyContent: 'center',
    backgroundColor: colors.brandStrong,
    ...shadows.card,
  },
  performanceBannerTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.25,
    color: colors.white,
  },
  performanceBannerBody: {
    ...typography.caption,
    marginTop: 3,
    color: '#DCE7FA',
  },
  performanceBannerStats: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  performanceBannerPill: {
    minHeight: 28,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  performanceBannerPillText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statTile: {
    width: '48%',
    minHeight: 82,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statLabel: {
    ...typography.caption,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.inkMuted,
  },
  statValue: {
    marginTop: spacing.xs,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 26,
    lineHeight: 32,
  },
  scoreBand: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  scoreBandTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
  },
  scoreBandValues: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreBandMin: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.danger,
  },
  scoreBandMax: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.brand,
    textAlign: 'right',
  },
  scoreBandLabel: {
    ...typography.caption,
    marginTop: 2,
    color: colors.inkMuted,
  },
  scoreBandCenter: {
    flex: 1,
  },
  scoreBandRight: {
    alignItems: 'flex-end',
  },
  scoreTrack: {
    height: 12,
    overflow: 'hidden',
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
  },
  scoreFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
  },
  scoreAverage: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
    color: colors.inkMuted,
  },
  scoreAverageValue: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: colors.danger,
  },
  sectionHeader: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { ...typography.title, color: colors.ink },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: colors.brand },
  errorBox: { marginBottom: 16, padding: 12, borderRadius: radii.md, backgroundColor: colors.redSoft },
  inlineError: { ...typography.caption, color: colors.red },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, color: '#334155', marginBottom: 8 },
  emptyText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  listPad: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  historyTable: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  tableHeader: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tableHeaderText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 10,
    lineHeight: 14,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  tableIndex: { width: 34 },
  tableExam: { flex: 1 },
  tableScore: { width: 74, textAlign: 'center' },
  historyRow: {
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  historyIndex: {
    width: 34,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
    color: colors.brandStrong,
  },
  historyMeta: { flex: 1, paddingRight: spacing.md },
  historyTitle: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, lineHeight: 18, color: colors.ink },
  historyDate: { marginTop: 2, fontFamily: 'PlusJakartaSans-Medium', fontSize: 11, lineHeight: 16, color: colors.inkMuted },
  historyScoreColumn: { width: 86, alignItems: 'flex-end' },
  scoreChip: {
    minWidth: 54,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreChipText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
  },
  historyStatus: {
    marginTop: spacing.xs,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    lineHeight: 15,
  },
  historyStatusPass: { color: colors.success },
  historyStatusFail: { color: colors.danger },

  detailBody: { flex: 1, paddingHorizontal: 20, paddingTop: spacing.md, backgroundColor: colors.canvas },
  reviewExamBody: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  reviewExamProgressHeader: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  reviewExamQuestionPosition: {
    ...typography.title,
    color: colors.ink,
  },
  reviewExamAnsweredLabel: {
    ...typography.caption,
    marginTop: 2,
    color: colors.inkMuted,
  },
  reviewExamProgressTrack: {
    height: 5,
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: '#DCE2DD',
  },
  reviewExamProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.brand,
  },
  reviewQuestionNav: {
    flexGrow: 0,
    marginTop: spacing.lg,
  },
  reviewQuestionNavContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  reviewQuestionChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  reviewQuestionChipCorrect: {
    borderColor: '#B8D8C9',
    backgroundColor: colors.successSoft,
  },
  reviewQuestionChipWrong: {
    borderColor: '#E9B9B9',
    backgroundColor: colors.dangerSoft,
  },
  reviewQuestionChipActive: {
    borderColor: colors.brandStrong,
    backgroundColor: colors.brandStrong,
  },
  reviewQuestionChipText: {
    ...typography.caption,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  reviewQuestionChipTextCorrect: {
    color: colors.success,
  },
  reviewQuestionChipTextWrong: {
    color: colors.danger,
  },
  reviewQuestionChipTextActive: {
    color: colors.white,
  },
  reviewExamScroll: {
    flex: 1,
  },
  reviewExamContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  reviewExamFooter: {
    minHeight: 76,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  reviewExamNavButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceAlt,
  },
  reviewExamNavButtonPrimary: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  reviewExamNavText: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  reviewExamNavTextPrimary: {
    color: colors.white,
  },
  navTextDisabled: {
    color: colors.inkSoft,
  },
  detailCard: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: 24, borderWidth: 1, borderColor: colors.line, ...shadows.card },
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
  progressFill: { height: 8, backgroundColor: colors.brand, borderRadius: 4 },
  detailActions: { marginTop: 32, gap: 12 },
  detailPrimaryBtn: { height: 56, borderRadius: 28, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  detailPrimaryBtnText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: '#FFFFFF' },
  detailSecondaryBtn: { height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  detailSecondaryBtnText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: '#475569' },

  correctionOverview: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.brandStrong,
  },
  correctionScoreBlock: {
    width: 92,
    height: 92,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  correctionScore: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 28,
    lineHeight: 34,
    color: colors.white,
  },
  correctionScoreLabel: {
    ...typography.caption,
    color: '#DCE7FA',
  },
  correctionStats: {
    flex: 1,
    gap: spacing.sm,
  },
  correctionStatPill: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  correctionStatText: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  reviewStepBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  reviewStepText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: '#64748B' },
  reviewStepScore: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
    color: colors.brand,
  },
  currentStatusChip: {
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentStatusCorrect: {
    backgroundColor: colors.successSoft,
  },
  currentStatusWrong: {
    backgroundColor: colors.dangerSoft,
  },
  currentStatusText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
  },
  currentStatusTextCorrect: {
    color: colors.success,
  },
  currentStatusTextWrong: {
    color: colors.danger,
  },
  reviewStepDots: { flexDirection: 'row', gap: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0' },
  stepDotActive: { width: 16, backgroundColor: colors.brand },
  questionCard: { borderRadius: 20, backgroundColor: '#FFFFFF', padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  questionText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, color: '#0F172A', marginBottom: 18, lineHeight: 26 },
  reviewQuestionCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  reviewQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  reviewQuestionLabel: {
    ...typography.eyebrow,
    color: colors.brand,
    textTransform: 'uppercase',
  },
  reviewQuestionText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    lineHeight: 26,
    marginTop: spacing.lg,
    color: colors.ink,
  },
  reviewImageStage: {
    minHeight: 180,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  reviewQuestionImage: {
    width: '100%',
    height: 180,
  },
  diagramContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, alignItems: 'center' },
  diagram: { width: '100%', height: 200 },
  optionsSection: { gap: 10, marginBottom: 24 },
  reviewChooseLabel: {
    ...typography.eyebrow,
    marginBottom: spacing.md,
    color: colors.inkSoft,
    textTransform: 'uppercase',
  },
  reviewOptionList: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  reviewOptionCard: {
    minHeight: 66,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  reviewOptionCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
  },
  reviewOptionWrong: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  reviewOptionNeutral: {
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  reviewOptionMarker: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewOptionMarkerCorrect: {
    backgroundColor: colors.success,
  },
  reviewOptionMarkerWrong: {
    backgroundColor: colors.danger,
  },
  reviewOptionMarkerNeutral: {
    backgroundColor: '#EDF0EC',
  },
  reviewOptionMarkerText: {
    ...typography.bodyStrong,
    color: colors.inkMuted,
  },
  reviewAnswerStack: {
    flex: 1,
    marginLeft: spacing.md,
  },
  reviewAnswerLabelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  reviewAnswerLabel: {
    ...typography.eyebrow,
    color: colors.danger,
    textTransform: 'uppercase',
  },
  reviewCorrectLabel: {
    ...typography.eyebrow,
    color: colors.success,
    textTransform: 'uppercase',
  },
  reviewAnswerText: {
    ...typography.bodyStrong,
    marginTop: 2,
    color: colors.ink,
  },
  reviewOptionImage: {
    width: '100%',
    height: 90,
    marginTop: spacing.sm,
  },
  answerOption: { minHeight: 64, borderRadius: 16, backgroundColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  correctOption: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#22C55E' },
  wrongOption: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' },
  optionMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  answerStack: { flex: 1, paddingVertical: 12 },
  answerLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, color: '#64748B', textTransform: 'uppercase', marginBottom: 3 },
  markerText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: '#475569' },
  answerLight: { flex: 1, fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: '#1E293B' },
  answerDark: { flex: 1, fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: '#1E293B' },
  explanationBox: { backgroundColor: '#F0F9FF', borderRadius: 16, padding: 16, marginBottom: spacing.md },
  explainHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  explainTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: colors.brand, letterSpacing: 0.5 },
  explainText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: '#334155', lineHeight: 22 },
  correctionListTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  correctionList: {
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  correctionRow: {
    minHeight: 74,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  correctionRowActive: {
    backgroundColor: colors.brandSoft,
  },
  correctionIndex: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctionIndexCorrect: {
    backgroundColor: colors.successSoft,
  },
  correctionIndexWrong: {
    backgroundColor: colors.dangerSoft,
  },
  correctionIndexText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
  },
  correctionIndexTextCorrect: {
    color: colors.success,
  },
  correctionIndexTextWrong: {
    color: colors.danger,
  },
  correctionRowBody: {
    flex: 1,
  },
  correctionRowQuestion: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
  correctionRowStatus: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
  },
  correctionRowStatusCorrect: {
    color: colors.success,
  },
  correctionRowStatusWrong: {
    color: colors.danger,
  },
  reviewNav: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  reviewNavBtn: { flex: 1, height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  reviewNavBtnPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
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
