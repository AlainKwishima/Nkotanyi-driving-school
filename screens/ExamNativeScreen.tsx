import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { ScreenColumn } from '../components/ScreenColumn';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth } from '../context/AuthContext';
import { HeaderMenu } from '../components/HeaderMenu';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { getExamQuestions, getSignQuestions, type TrafficQuestion } from '../services/trafficApi';
import { appendLocalExamRecord } from '../services/examHistoryStorage';
import { getMessageFromUnknownError } from '../services/api/client';
import { useI18n } from '../i18n/useI18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamNative'>;

const EXAM_DURATION_SEC = 30 * 60;
const PASS_PERCENT = 60;

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ExamNativeScreen({ navigation, route }: Props) {
  const { hasSubscription, hasUsedFreeTrial, setHasUsedFreeTrial } = useAppFlow();
  const { accessToken } = useAuth();
  const { insets } = useResponsiveLayout();
  const { t } = useI18n();
  const mode = route.params?.mode ?? 'traffic';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TrafficQuestion[]>([]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SEC);
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<number, string>>({});

  const totalQuestions = questions.length;
  const current = questions[questionIndex];
  const currentQuestionNo = questionIndex + 1;
  const progress = useMemo(
    () => (totalQuestions > 0 ? Math.max(0, Math.min(1, currentQuestionNo / totalQuestions)) : 0),
    [currentQuestionNo, totalQuestions],
  );
  const canGoPrev = questionIndex > 0;
  const canGoNext = questionIndex < totalQuestions - 1;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!accessToken) {
        setLoadError(t('exam.needSignIn'));
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const data = mode === 'signs' ? await getSignQuestions(accessToken) : await getExamQuestions(accessToken);
        if (!cancelled) {
          setQuestions(data);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(getMessageFromUnknownError(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, mode, t]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedSec = EXAM_DURATION_SEC - secondsLeft;
  const timerText = formatTime(secondsLeft);

  const selectOption = useCallback((optionId: string) => {
    setSelectedByQuestion((prev) => ({ ...prev, [questionIndex]: optionId }));
  }, [questionIndex]);

  const performExamSubmit = useCallback(async () => {
    if (!hasSubscription && !hasUsedFreeTrial) {
      await setHasUsedFreeTrial(true);
    }

    let correct = 0;
    questions.forEach((q, idx) => {
      const picked = selectedByQuestion[idx];
      if (!picked) return;
      const opt = q.options.find((o) => o._id === picked);
      if (opt?.is_correct) correct += 1;
    });

    const total = totalQuestions || 1;
    const percent = Math.round((correct / total) * 100);
    const passed = percent >= PASS_PERCENT;
    const timeLabel = formatTime(elapsedSec);

    await appendLocalExamRecord({ correct, total, percent, timeLabel, mode });

    const payload = { correct, total, timeLabel, percent };
    if (passed) {
      navigation.navigate('TestPassedNative', payload);
    } else {
      navigation.navigate('TestFailedNative', payload);
    }
  }, [
    elapsedSec,
    hasSubscription,
    hasUsedFreeTrial,
    mode,
    navigation,
    questions,
    selectedByQuestion,
    setHasUsedFreeTrial,
    totalQuestions,
  ]);

  const onPressFinishExam = useCallback(() => {
    const unanswered = questions.reduce((n, _, idx) => (selectedByQuestion[idx] ? n : n + 1), 0);
    if (unanswered > 0) {
      Alert.alert(t('exam.unansweredTitle'), t('exam.unansweredBody', { count: unanswered }), [
        { text: t('exam.keepWorking'), style: 'cancel' },
        { text: t('exam.finishAnyway'), style: 'destructive', onPress: () => void performExamSubmit() },
      ]);
      return;
    }
    void performExamSubmit();
  }, [performExamSubmit, questions, selectedByQuestion, t]);

  if (loading) {
    return (
      <ScreenColumn backgroundColor="#4A78D0">
        <View style={[styles.centered, { paddingTop: insets.top, flex: 1 }]}>
          <ActivityIndicator size="large" color="#F5F7FC" />
          <Text style={styles.loadingText}>{t('exam.loading')}</Text>
        </View>
      </ScreenColumn>
    );
  }

  if (loadError || !current) {
    return (
      <ScreenColumn backgroundColor="#4A78D0">
        <View style={[styles.centered, { paddingHorizontal: 24, paddingTop: insets.top, flex: 1 }]}>
          <Text style={styles.loadingText}>{loadError ?? t('exam.noQuestions')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>{t('exam.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </ScreenColumn>
    );
  }

  const imageUri = current.question.imageURLs?.[0];
  const selectedId = selectedByQuestion[questionIndex];

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backTap}>
            <Ionicons name="chevron-back" size={24} color="#F5F7FC" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('exam.title')}</Text>
          <View style={styles.rightCluster}>
            <Ionicons name="timer-outline" size={20} color="#2F3C56" />
            <Text style={styles.timerText}>{timerText}</Text>
            <HeaderMenu navigation={navigation} iconColor="#F5F7FC" topOffset={56} rightOffset={14} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>{t('exam.question')}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentQuestionNo}/{totalQuestions}
            </Text>
          </View>

          <View style={styles.questionCard}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.questionImage} resizeMode="cover" />
            ) : null}
            <Text style={styles.questionText}>{current.question.description}</Text>
          </View>

          {current.options.map((opt) => {
            const active = selectedId === opt._id;
            return (
              <TouchableOpacity
                key={opt._id}
                style={[styles.optionCard, active && styles.optionCardSelected]}
                onPress={() => selectOption(opt._id)}
                activeOpacity={0.85}
              >
                <Text style={styles.optionText}>{opt.optionText}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.navButtonsRow}>
            <TouchableOpacity
              style={[styles.prevBtn, !canGoPrev && styles.navBtnDisabled]}
              onPress={() => canGoPrev && setQuestionIndex((prev) => prev - 1)}
              disabled={!canGoPrev}
            >
              <View style={styles.btnInner}>
                <Ionicons name="arrow-back" size={24} color="#434854" />
                <Text style={styles.prevText}>{t('exam.previous')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, !canGoNext && styles.navBtnDisabledBlue]}
              onPress={() => canGoNext && setQuestionIndex((prev) => prev + 1)}
              disabled={!canGoNext}
            >
              <View style={styles.btnInner}>
                <Text style={styles.nextText}>{t('exam.next')}</Text>
                <Ionicons name="arrow-forward" size={24} color="#F5F7FC" />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.finishWrap} onPress={() => onPressFinishExam()}>
            <Text style={styles.finishText}>{t('exam.finish')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: '#F5F7FC',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  retryBtnText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#F5F7FC',
  },
  headerBlue: {
    backgroundColor: '#4A78D0',
    paddingHorizontal: 14,
  },
  topRow: {
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
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 30 / 2,
    lineHeight: 40 / 2,
    color: '#F5F7FC',
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  timerText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14 * 1,
    lineHeight: 18,
    color: '#2F3C56',
  },
  body: {
    flex: 1,
    backgroundColor: '#CBD1DD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 36 / 2,
    lineHeight: 48 / 2,
    color: '#282B67',
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#8DABE3',
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#477AD8',
  },
  progressText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 16 * 1,
    lineHeight: 20,
    color: '#282B67',
  },
  questionCard: {
    borderRadius: 14,
    backgroundColor: '#DEDEDF',
    padding: 14,
    marginBottom: 14,
  },
  questionImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 12,
  },
  questionText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 20 / 2 * 2,
    lineHeight: 30 / 2 * 2,
    color: '#3F414D',
  },
  optionCard: {
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: '#E6E6E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#4A78D0',
    backgroundColor: '#D8E4F8',
  },
  optionText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15 * 1,
    lineHeight: 22,
    color: '#282B67',
    textAlign: 'center',
  },
  navButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14,
  },
  prevBtn: {
    width: '47%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6E6E7',
    justifyContent: 'center',
  },
  nextBtn: {
    width: '47%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A78D0',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.55,
  },
  navBtnDisabledBlue: {
    opacity: 0.7,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevText: {
    marginLeft: 8,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 22,
    color: '#434854',
  },
  nextText: {
    marginRight: 8,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 22,
    color: '#F5F7FC',
  },
  finishWrap: {
    height: 70,
    borderRadius: 26,
    backgroundColor: '#D2D6DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 24,
    color: '#3F424F',
    textDecorationLine: 'underline',
  },
});
