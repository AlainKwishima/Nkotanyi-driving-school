import React, { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { useAppFlow } from '../context/AppFlowContext';
import { HeaderMenu } from '../components/HeaderMenu';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamNative'>;

type ExamQuestion = {
  id: number;
  prompt: string;
  options: string[];
};

const TOTAL_QUESTIONS = 25;
const START_QUESTION_NO = 19;

const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 19,
    prompt: 'What should you do if fog closes in completely while you are driving, and visibility is reduced to near zero?',
    options: ['Slow down and take a detour', 'Use your low beams', 'Carefully pull as far off the road'],
  },
  {
    id: 20,
    prompt: 'When approaching a pedestrian crossing with people waiting, what is the safest action?',
    options: ['Increase speed to pass before they step in', 'Slow down and prepare to stop completely', 'Use horn continuously and proceed'],
  },
  {
    id: 21,
    prompt: 'If your vehicle starts to skid on a wet road, what should you do first?',
    options: ['Brake hard immediately', 'Ease off the accelerator and steer smoothly', 'Turn sharply in the opposite direction'],
  },
  {
    id: 22,
    prompt: 'At an unmarked intersection, who has right of way?',
    options: ['The vehicle from the right', 'The faster vehicle', 'The larger vehicle'],
  },
  {
    id: 23,
    prompt: 'Which lights should you use when driving at night on an unlit road with no oncoming traffic?',
    options: ['Hazard lights', 'High beams', 'Parking lights only'],
  },
  {
    id: 24,
    prompt: 'What is the main purpose of keeping a safe following distance?',
    options: ['To save fuel', 'To reduce braking time and avoid collisions', 'To allow faster overtaking'],
  },
  {
    id: 25,
    prompt: 'Before changing lanes, which sequence is correct?',
    options: ['Signal, mirror check, shoulder check, move', 'Shoulder check, move, signal', 'Mirror check, brake hard, move'],
  },
];

export function ExamNativeScreen({ navigation }: Props) {
  const { hasSubscription, hasUsedFreeTrial, setHasUsedFreeTrial } = useAppFlow();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(3 * 60 + 48);

  const currentQuestion = EXAM_QUESTIONS[questionIndex];
  const currentQuestionNo = START_QUESTION_NO + questionIndex;
  const progress = useMemo(() => Math.max(0, Math.min(1, currentQuestionNo / TOTAL_QUESTIONS)), [currentQuestionNo]);
  const canGoPrev = questionIndex > 0;
  const canGoNext = questionIndex < EXAM_QUESTIONS.length - 1;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View style={styles.safe}>
      <View style={styles.headerBlue}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backTap}>
            <Ionicons name="chevron-back" size={24} color="#F5F7FC" />
          </TouchableOpacity>
          <Text style={styles.title}>Exam</Text>
          <View style={styles.rightCluster}>
            <Ionicons name="timer-outline" size={20} color="#2F3C56" />
            <Text style={styles.timerText}>{timerText}</Text>
            <HeaderMenu navigation={navigation} iconColor="#F5F7FC" topOffset={74} rightOffset={14} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Question</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentQuestionNo}/{TOTAL_QUESTIONS}
            </Text>
          </View>

          <View style={styles.questionCard}>
            <Image source={require('../assets/exam-fog-question.jpg')} style={styles.questionImage} resizeMode="cover" />
            <Text style={styles.questionText}>{currentQuestion.prompt}</Text>
          </View>

          {currentQuestion.options.map((opt) => (
            <View key={opt} style={styles.optionCard}>
              <Text style={styles.optionText}>{opt}</Text>
            </View>
          ))}

          <View style={styles.navButtonsRow}>
            <TouchableOpacity
              style={[styles.prevBtn, !canGoPrev && styles.navBtnDisabled]}
              onPress={() => canGoPrev && setQuestionIndex((prev) => prev - 1)}
              disabled={!canGoPrev}
            >
              <View style={styles.btnInner}>
                <Ionicons name="arrow-back" size={24} color="#434854" />
                <Text style={styles.prevText}>Previous</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, !canGoNext && styles.navBtnDisabledBlue]}
              onPress={() => canGoNext && setQuestionIndex((prev) => prev + 1)}
              disabled={!canGoNext}
            >
              <View style={styles.btnInner}>
                <Text style={styles.nextText}>Next</Text>
                <Ionicons name="arrow-forward" size={24} color="#F5F7FC" />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.finishWrap}
            onPress={async () => {
              if (!hasSubscription && !hasUsedFreeTrial) {
                await setHasUsedFreeTrial(true);
              }
              navigation.navigate('TestPassedNative');
            }}
          >
            <Text style={styles.finishText}>Finish The Test</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: '#4A78D0',
  },
  headerBlue: {
    height: 92,
    backgroundColor: '#4A78D0',
    paddingHorizontal: 20,
  },
  topRow: {
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backTap: {
    width: 24,
    height: 24,
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
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E6E6E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 14,
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
