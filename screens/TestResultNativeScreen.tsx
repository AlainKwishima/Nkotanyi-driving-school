import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';

type FailedProps = NativeStackScreenProps<RootStackParamList, 'TestFailedNative'>;
type PassedProps = NativeStackScreenProps<RootStackParamList, 'TestPassedNative'>;

function ScoreRing({ passed, percent }: { passed: boolean; percent: number }) {
  const size = 172;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const blueProgress = passed ? 0.82 : 0.35;
  const accentProgress = passed ? 0.46 : 0.22;
  const blueOffset = circumference * (1 - blueProgress);
  const accentOffset = circumference * (1 - accentProgress);

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E3E7EF" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4A78D0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={blueOffset}
          fill="none"
          transform={`rotate(-102 ${size / 2} ${size / 2})`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 1}
          stroke={passed ? '#86C74F' : '#E6A145'}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={accentOffset}
          fill="none"
          transform={`rotate(-46 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringInner}>
        <Text style={styles.ringValue}>{percent}%</Text>
      </View>
    </View>
  );
}

function ResultTemplate({
  passed,
  score,
  time,
  navigation,
}: {
  passed: boolean;
  score: string;
  time: string;
  navigation: FailedProps['navigation'] | PassedProps['navigation'];
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.headerBlue}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#F5F8FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Home</Text>
        </View>
      </View>
      <View style={styles.topDiagonal} />

      <View style={styles.content}>
        <Text style={styles.headline}>{passed ? 'Congratulation!' : 'Whoops, sorry...'}</Text>

        <ScoreRing passed={passed} percent={passed ? 85 : 35} />

        <Text style={styles.mainTitle}>{passed ? 'Driving Test Passed' : 'Driving Test Failed'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Results</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{time}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('StartExamNative')}>
          <Text style={styles.primaryText}>Start New Exam</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('PerformanceReviewNative')}>
          <Text style={styles.secondaryText}>Check Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBlueDark} />
      <View style={styles.bottomBlueLight} />
    </View>
  );
}

export function TestFailedNativeScreen({ navigation }: FailedProps) {
  return <ResultTemplate passed={false} score="20/50" time="25:30" navigation={navigation} />;
}

export function TestPassedNativeScreen({ navigation }: PassedProps) {
  return <ResultTemplate passed score="45/50" time="19:20" navigation={navigation} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: '#EEF1F7',
    overflow: 'hidden',
  },
  headerBlue: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 148,
    backgroundColor: '#4A78D0',
    zIndex: 5,
  },
  headerRow: {
    marginTop: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 8,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 32 / 2,
    lineHeight: 42 / 2,
    color: '#F6F8FF',
  },
  topDiagonal: {
    position: 'absolute',
    left: -120,
    right: -24,
    top: 100,
    height: 100,
    backgroundColor: '#EEF1F7',
    transform: [{ rotate: '-10deg' }],
    zIndex: 6,
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 146,
    bottom: 88,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
  },
  headline: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 44 / 2,
    lineHeight: 56 / 2,
    color: '#3E434E',
  },
  ringWrap: {
    marginTop: 16,
    width: 172,
    height: 172,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
  },
  ringInner: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 72 / 2,
    lineHeight: 86 / 2,
    color: '#24295F',
  },
  mainTitle: {
    marginTop: 26,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 54 / 2,
    lineHeight: 66 / 2,
    color: '#23285F',
  },
  statsRow: {
    width: '100%',
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    minWidth: 92,
  },
  statValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 42 / 2,
    lineHeight: 52 / 2,
    color: '#454A55',
  },
  statLabel: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 38 / 4,
    lineHeight: 24,
    color: '#646A77',
  },
  primaryBtn: {
    marginTop: 34,
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 34 / 2,
    lineHeight: 44 / 2,
    color: '#F6F8FF',
  },
  secondaryBtn: {
    marginTop: 14,
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F7F7F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 34 / 2,
    lineHeight: 44 / 2,
    color: '#3F444F',
  },
  bottomBlueDark: {
    position: 'absolute',
    left: -80,
    right: -80,
    bottom: -78,
    height: 104,
    backgroundColor: '#1258B1',
    transform: [{ rotate: '10deg' }],
    zIndex: 1,
  },
  bottomBlueLight: {
    position: 'absolute',
    left: -52,
    right: -52,
    bottom: -118,
    height: 120,
    backgroundColor: '#4A78D0',
    transform: [{ rotate: '10deg' }],
    zIndex: 2,
  },
});
