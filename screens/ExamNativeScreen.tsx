import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { ScreenColumn } from '../components/ScreenColumn';
import { AppHeader } from '../components/AppHeader';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth } from '../context/AuthContext';
import { getExamQuestions, getSignQuestions, type TrafficQuestion } from '../services/trafficApi';
import { appendLocalExamRecord } from '../services/examHistoryStorage';
import { getMessageFromUnknownError } from '../services/api/client';
import { useI18n } from '../i18n/useI18n';
import { resolveExamLanguage } from '../utils/subscriptionAccess';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamNative'>;

const EXAM_DURATION_SEC = 20 * 60;
const EXAM_QUESTION_LIMIT = 20;
const PASS_PERCENT = 60;
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ExamNativeScreen({ navigation, route }: Props) {
  const { t } = useI18n();
  const {
    hasSubscription,
    hasUsedFreeTrial,
    setHasUsedFreeTrial,
    subscriptionLanguage,
    contentLanguage,
  } = useAppFlow();
  const { accessToken } = useAuth();
  const mode = route.params?.mode ?? 'traffic';
  const examLanguage = resolveExamLanguage({
    hasSubscription,
    subscriptionLanguage,
    contentLanguage,
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TrafficQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SEC);
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<number, string>>({});
  const questionNavRef = useRef<ScrollView>(null);
  const contentRef = useRef<ScrollView>(null);
  const startedAtRef = useRef(new Date().toISOString());

  const totalQuestions = questions.length;
  const current = questions[questionIndex];
  const currentQuestionNumber = questionIndex + 1;
  const selectedId = selectedByQuestion[questionIndex];
  const answeredCount = Object.keys(selectedByQuestion).length;
  const progress = totalQuestions ? currentQuestionNumber / totalQuestions : 0;
  const canGoPrevious = questionIndex > 0;
  const canGoNext = questionIndex < totalQuestions - 1;
  const timerUrgent = secondsLeft <= 5 * 60;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!accessToken) {
        setLoadError(t('exam.needSignIn'));
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const data =
          mode === 'signs'
            ? await getSignQuestions(accessToken, examLanguage)
            : await getExamQuestions(accessToken, examLanguage);
        if (!cancelled) {
          setQuestions(data.slice(0, EXAM_QUESTION_LIMIT));
          setQuestionIndex(0);
          setSecondsLeft(EXAM_DURATION_SEC);
          setSelectedByQuestion({});
          startedAtRef.current = new Date().toISOString();
        }
      } catch (error) {
        if (!cancelled) setLoadError(getMessageFromUnknownError(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, examLanguage, mode, t]);

  useEffect(() => {
    if (loading || !current) return;
    const timer = setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [current, loading]);

  useEffect(() => {
    questionNavRef.current?.scrollTo({
      x: Math.max(0, questionIndex * 42 - 24),
      animated: true,
    });
    contentRef.current?.scrollTo({ y: 0, animated: true });
  }, [questionIndex]);

  const selectOption = useCallback(
    (optionId: string) => {
      setSelectedByQuestion((currentSelections) => ({
        ...currentSelections,
        [questionIndex]: optionId,
      }));
    },
    [questionIndex],
  );

  const submitExam = useCallback(async () => {
    if (!hasSubscription && !hasUsedFreeTrial) await setHasUsedFreeTrial(true);

    let correct = 0;
    questions.forEach((question, index) => {
      const selected = selectedByQuestion[index];
      if (question.options.find((option) => option._id === selected)?.is_correct) correct += 1;
    });

    const total = totalQuestions || 1;
    const percent = Math.round((correct / total) * 100);
    const elapsedSeconds = EXAM_DURATION_SEC - secondsLeft;
    const timeLabel = formatTime(elapsedSeconds);
    const finishedAt = new Date().toISOString();
    const answers = questions.map((question, index) => {
      const selectedOption = question.options.find((option) => option._id === selectedByQuestion[index]);
      const correctOption = question.options.find((option) => option.is_correct);
      return {
        questionId: question._id,
        questionText: question.question.description,
        selectedOptionId: selectedOption?._id ?? null,
        selectedOptionText: selectedOption?.optionText ?? null,
        correctOptionId: correctOption?._id ?? null,
        correctOptionText: correctOption?.optionText ?? null,
        isCorrect: Boolean(selectedOption?.is_correct),
      };
    });

    await appendLocalExamRecord({
      correct,
      total,
      percent,
      timeLabel,
      mode,
      startedAt: startedAtRef.current,
      finishedAt,
      elapsedSec: elapsedSeconds,
      answeredCount,
      answers,
    });

    const result = { correct, total, timeLabel, percent };
    navigation.navigate(percent >= PASS_PERCENT ? 'TestPassedNative' : 'TestFailedNative', result);
  }, [
    answeredCount,
    hasSubscription,
    hasUsedFreeTrial,
    mode,
    navigation,
    questions,
    secondsLeft,
    selectedByQuestion,
    setHasUsedFreeTrial,
    totalQuestions,
  ]);

  const confirmSubmit = useCallback(() => {
    const unanswered = totalQuestions - answeredCount;
    if (unanswered > 0) {
      Alert.alert(t('exam.unansweredTitle'), t('exam.unansweredBody', { count: unanswered }), [
        { text: t('exam.keepWorking'), style: 'cancel' },
        { text: t('exam.finishAnyway'), style: 'destructive', onPress: () => void submitExam() },
      ]);
      return;
    }
    void submitExam();
  }, [answeredCount, submitExam, t, totalQuestions]);

  const timer = (
    <View style={[styles.timerPill, timerUrgent && styles.timerPillUrgent]}>
      <Ionicons name="time-outline" size={17} color={timerUrgent ? colors.red : colors.white} />
      <Text style={[styles.timerText, timerUrgent && styles.timerTextUrgent]}>{formatTime(secondsLeft)}</Text>
    </View>
  );

  if (loading) {
    return (
      <ScreenColumn backgroundColor={colors.brandStrong}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.amber} />
          <Text style={styles.loadingTitle}>{t('exam.loading')}</Text>
          <Text style={styles.loadingBody}>{t('exam.loadingHint')}</Text>
        </View>
      </ScreenColumn>
    );
  }

  if (loadError || !current) {
    return (
      <ScreenColumn backgroundColor={colors.brandStrong}>
        <AppHeader title={t('exam.title')} onBack={() => navigation.goBack()} />
        <View style={[styles.body, styles.errorBody]}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.red} />
          </View>
          <Text style={styles.errorTitle}>{t('exam.noQuestions')}</Text>
          <Text style={styles.errorText}>{loadError ?? t('exam.loadError')}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>{t('exam.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </ScreenColumn>
    );
  }

  const imageUri = current.question.imageURLs?.[0];

  return (
    <ScreenColumn backgroundColor={colors.brandStrong}>
      <AppHeader
        title={mode === 'signs' ? t('examType.signs.title') : t('exam.title')}
        eyebrow={t('exam.liveExam')}
        onBack={() => navigation.goBack()}
        right={timer}
      />

      <View style={styles.body}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.questionPosition}>
              {t('exam.questionPosition', { current: currentQuestionNumber, total: totalQuestions })}
            </Text>
            <Text style={styles.answeredLabel}>
              {t('exam.answeredCount', { answered: answeredCount, total: totalQuestions })}
            </Text>
          </View>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <ScrollView
          ref={questionNavRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.questionNav}
          contentContainerStyle={styles.questionNavContent}
        >
          {questions.map((_, index) => {
            const active = index === questionIndex;
            const answered = Boolean(selectedByQuestion[index]);
            return (
              <TouchableOpacity
                key={`question-${index + 1}`}
                style={[
                  styles.questionChip,
                  answered && styles.questionChipAnswered,
                  active && styles.questionChipActive,
                ]}
                onPress={() => setQuestionIndex(index)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.questionChipText,
                    answered && styles.questionChipTextAnswered,
                    active && styles.questionChipTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          ref={contentRef}
          style={styles.questionScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.questionContent}
        >
          <View style={styles.questionCard}>
            <View style={styles.questionLabelRow}>
              <Text style={styles.questionLabel}>{t('exam.question')}</Text>
              <Ionicons name="help-circle-outline" size={18} color={colors.brand} />
            </View>
            {imageUri ? (
              <View style={styles.imageStage}>
                <Image source={{ uri: imageUri }} style={styles.questionImage} resizeMode="contain" />
              </View>
            ) : null}
            <Text style={styles.questionText}>{current.question.description}</Text>
          </View>

          <Text style={styles.chooseLabel}>{t('exam.chooseAnswer')}</Text>
          <View style={styles.optionList}>
            {current.options.map((option, index) => {
              const selected = selectedId === option._id;
              return (
                <TouchableOpacity
                  key={option._id}
                  style={[styles.optionCard, selected && styles.optionCardSelected]}
                  onPress={() => selectOption(option._id)}
                  activeOpacity={0.82}
                >
                  <View style={[styles.optionMarker, selected && styles.optionMarkerSelected]}>
                    <Text style={[styles.optionMarkerText, selected && styles.optionMarkerTextSelected]}>
                      {OPTION_LABELS[index] ?? index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option.optionText}
                  </Text>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={21}
                    color={selected ? colors.brand : '#BAC2CF'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
            onPress={() => canGoPrevious && setQuestionIndex((index) => index - 1)}
            disabled={!canGoPrevious}
          >
            <Ionicons name="arrow-back" size={19} color={canGoPrevious ? colors.ink : colors.inkSoft} />
            <Text style={[styles.navText, !canGoPrevious && styles.navTextDisabled]}>{t('exam.previous')}</Text>
          </TouchableOpacity>

          {canGoNext ? (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary]}
              onPress={() => setQuestionIndex((index) => index + 1)}
            >
              <Text style={[styles.navText, styles.navTextPrimary]}>{t('exam.next')}</Text>
              <Ionicons name="arrow-forward" size={19} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.navButton, styles.finishButton]} onPress={confirmSubmit}>
              <Text style={[styles.navText, styles.navTextPrimary]}>{t('exam.finish')}</Text>
              <Ionicons name="checkmark" size={19} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    flex: 1,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    ...typography.title,
    marginTop: spacing.lg,
    color: colors.white,
  },
  loadingBody: {
    ...typography.body,
    marginTop: spacing.sm,
    color: '#BFD0E8',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  errorBody: {
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.redSoft,
  },
  errorTitle: {
    ...typography.title,
    marginTop: spacing.lg,
    color: colors.ink,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  errorButton: {
    minHeight: 46,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  errorButtonText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  timerPill: {
    minWidth: 76,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  timerPillUrgent: {
    backgroundColor: colors.redSoft,
  },
  timerText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
    color: colors.white,
  },
  timerTextUrgent: {
    color: colors.red,
  },
  progressHeader: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  questionPosition: {
    ...typography.title,
    color: colors.ink,
  },
  answeredLabel: {
    ...typography.caption,
    marginTop: 2,
    color: colors.inkMuted,
  },
  progressPercent: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 16,
    color: colors.brand,
  },
  progressTrack: {
    height: 5,
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: '#DCE2DD',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.brand,
  },
  questionNav: {
    flexGrow: 0,
    marginTop: spacing.lg,
  },
  questionNavContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  questionChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  questionChipAnswered: {
    borderColor: '#B8D8C9',
    backgroundColor: colors.greenSoft,
  },
  questionChipActive: {
    borderColor: colors.brandStrong,
    backgroundColor: colors.brandStrong,
  },
  questionChipText: {
    ...typography.caption,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.inkMuted,
  },
  questionChipTextAnswered: {
    color: colors.green,
  },
  questionChipTextActive: {
    color: colors.white,
  },
  questionScroll: {
    flex: 1,
  },
  questionContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  questionCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  questionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionLabel: {
    ...typography.eyebrow,
    color: colors.brand,
    textTransform: 'uppercase',
  },
  imageStage: {
    height: 220,
    marginTop: spacing.lg,
    overflow: 'hidden',
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  questionImage: {
    width: '94%',
    height: '94%',
  },
  questionText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    lineHeight: 26,
    marginTop: spacing.lg,
    color: colors.ink,
  },
  chooseLabel: {
    ...typography.eyebrow,
    marginTop: spacing.xxl,
    color: colors.inkSoft,
    textTransform: 'uppercase',
  },
  optionList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  optionCard: {
    minHeight: 66,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  optionCardSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  optionMarker: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF0EC',
  },
  optionMarkerSelected: {
    backgroundColor: colors.brand,
  },
  optionMarkerText: {
    ...typography.bodyStrong,
    color: colors.inkMuted,
  },
  optionMarkerTextSelected: {
    color: colors.white,
  },
  optionText: {
    ...typography.body,
    flex: 1,
    marginHorizontal: spacing.md,
    color: colors.ink,
  },
  optionTextSelected: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.brandStrong,
  },
  footer: {
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
  navButton: {
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
  navButtonPrimary: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  finishButton: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
  navButtonDisabled: {
    opacity: 0.45,
  },
  navText: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  navTextPrimary: {
    color: colors.white,
  },
  navTextDisabled: {
    color: colors.inkSoft,
  },
});
