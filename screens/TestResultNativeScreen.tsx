import React, { useEffect, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { useI18n } from '../i18n/useI18n';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);


function ConfettiPiece({ delay, x, color }: { delay: number; x: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ])
    ).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 800],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: x,
          backgroundColor: color,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    />
  );
}

function ConfettiGroup() {
  const colors = ['#86C74F', '#4A78D0', '#FFD700', '#F25559', '#AA55FF'];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(25)].map((_, i) => (
        <ConfettiPiece
          key={i}
          delay={i * 150}
          x={10 + Math.random() * 350}
          color={colors[i % colors.length]}
        />
      ))}
    </View>
  );
}

type FailedProps = NativeStackScreenProps<RootStackParamList, 'TestFailedNative'>;
type PassedProps = NativeStackScreenProps<RootStackParamList, 'TestPassedNative'>;

function ScoreRing({ passed, percent }: { passed: boolean; percent: number }) {
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percent / 100,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [percent, progressAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={passed ? '#86C74F' : '#F25559'} />
            <Stop offset="100%" stopColor={passed ? '#48A854' : '#C41E1E'} />
          </LinearGradient>
        </Defs>
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E9F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringInner}>
        <Text style={styles.ringValue}>{percent}</Text>
        <Text style={styles.ringPercent}>%</Text>
      </View>
    </View>
  );
}

function ResultTemplate({
  passed,
  score,
  time,
  percent,
  navigation,
  reviewParams,
}: {
  passed: boolean;
  score: string;
  time: string;
  percent: number;
  navigation: FailedProps['navigation'] | PassedProps['navigation'];
  reviewParams?: RootStackParamList['PerformanceReviewNative'];
}) {
  const { t } = useI18n();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.screen}>
      <View style={[styles.headerBlue, { backgroundColor: passed ? '#48A854' : '#F25559' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('test.home')}</Text>
        </View>
      </View>
      <View style={styles.topDiagonal} />

      {passed && <ConfettiGroup />}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.headline, { color: passed ? '#1B4D2E' : '#8B1A1A' }]}>
          {passed ? t('test.passedHeadline') : t('test.failedHeadline')}
        </Text>

        <ScoreRing passed={passed} percent={percent} />

        <Text style={styles.mainTitle}>{passed ? t('test.passedTitle') : t('test.failedTitle')}</Text>

        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>{t('test.results').toUpperCase()}</Text>
          </View>
          <View style={styles.dividerVertical} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{time}</Text>
            <Text style={styles.statLabel}>{t('test.time').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: passed ? '#48A854' : '#F25559' }]}
            onPress={() => navigation.navigate('ExamInstructionsNative')}
          >
            <Text style={styles.primaryText}>{t('test.newExam')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() =>
              navigation.navigate(
                'PerformanceReviewNative',
                reviewParams ?? {
                  correct: Number(score.split('/')[0] ?? 0),
                  total: Number(score.split('/')[1] ?? 0),
                  percent,
                  timeLabel: time,
                  passed,
                },
              )
            }
          >
            <Text style={styles.secondaryText}>{t('test.checkResults')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={[styles.bottomBlueDark, { backgroundColor: passed ? '#1B4D2E' : '#8B1A1A' }]} />
      <View style={[styles.bottomBlueLight, { backgroundColor: passed ? '#48A854' : '#F25559' }]} />
    </View>
  );
}

export function TestFailedNativeScreen({ navigation, route }: FailedProps) {
  const correct = route.params?.correct ?? 7;
  const total = route.params?.total ?? 20;
  const time = route.params?.timeLabel ?? '0:00';
  const percent = route.params?.percent ?? Math.round((correct / Math.max(total, 1)) * 100);
  return (
    <ResultTemplate
      passed={false}
      score={`${correct}/${total}`}
      time={time}
      percent={percent}
      navigation={navigation}
      reviewParams={{ correct, total, timeLabel: time, percent, passed: false }}
    />
  );
}

export function TestPassedNativeScreen({ navigation, route }: PassedProps) {
  const correct = route.params?.correct ?? 18;
  const total = route.params?.total ?? 20;
  const time = route.params?.timeLabel ?? '0:00';
  const percent = route.params?.percent ?? Math.round((correct / Math.max(total, 1)) * 100);
  return (
    <ResultTemplate
      passed
      score={`${correct}/${total}`}
      time={time}
      percent={percent}
      navigation={navigation}
      reviewParams={{ correct, total, timeLabel: time, percent, passed: true }}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  headerBlue: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 160,
    zIndex: 5,
  },
  headerRow: {
    marginTop: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  topDiagonal: {
    position: 'absolute',
    left: -120,
    right: -24,
    top: 100,
    height: 120,
    backgroundColor: '#F8FAFC',
    transform: [{ rotate: '-8deg' }],
    zIndex: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 160,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
  },
  headline: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 20,
  },
  ringWrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
  },
  ringInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 56,
    color: '#1E293B',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  ringPercent: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    color: '#64748B',
    marginLeft: 2,
    marginTop: 8, // Optical adjustment to align with the center/bottom of the number
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  mainTitle: {
    marginTop: 20,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 28,
    color: '#0F172A',
    textAlign: 'center',
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    color: '#1E293B',
  },
  statLabel: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: '#F1F5F9',
  },
  actions: {
    width: '100%',
    marginTop: 40,
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#475569',
  },
  bottomBlueDark: {
    position: 'absolute',
    left: -80,
    right: -80,
    bottom: -80,
    height: 120,
    transform: [{ rotate: '12deg' }],
    zIndex: 1,
  },
  bottomBlueLight: {
    position: 'absolute',
    left: -52,
    right: -52,
    bottom: -120,
    height: 140,
    transform: [{ rotate: '12deg' }],
    zIndex: 2,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
    zIndex: 10,
  },
});
