import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { BottomNavBar } from '../components/BottomNavBar';
import { HeaderMenu } from '../components/HeaderMenu';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamInstructionsNative'>;

type StatCard = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

const STAT_CARDS: StatCard[] = [
  { icon: 'timer-outline', label: 'TIME LIMIT', value: '20 Minutes' },
  { icon: 'help-circle-outline', label: 'QUESTIONS', value: '20 MCQs' },
  { icon: 'ribbon-outline', label: 'PASSING SCORE', value: '18/20 (90%)' },
  { icon: 'clipboard-outline', label: 'EXAM TYPE', value: 'Definitive Test' },
];

const GUIDELINES = [
  'Read each question carefully before selecting your answer from the multiple choices.',
  'You cannot go back to previous questions once you move forward.',
  'The timer starts as soon as you click the "Start Exam" button.',
  'Ensure you have a stable internet connection throughout the duration.',
];

export function ExamInstructionsNativeScreen({ navigation }: Props) {
  const { hasSubscription, hasUsedFreeTrial } = useAppFlow();
  const { openGateModal } = useGateModal();

  return (
    <View style={styles.safe}>
      <View style={styles.headerBlue}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backTap} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exam Instructions</Text>
          <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={72} rightOffset={14} />
        </View>
      </View>

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={styles.readyStrip}>
            <Text style={styles.readyTitle}>Ready to start?</Text>
            <Text style={styles.readySub}>Good luck, future driver!</Text>
          </View>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => {
              if (!hasSubscription && hasUsedFreeTrial) {
                openGateModal('subscription_exam', () => navigation.navigate('SubscriptionNative'));
                return;
              }
              openGateModal('exam_ready', () => navigation.navigate('ExamNative'));
            }}
          >
            <Text style={styles.startBtnText}>Start Exam</Text>
            <Ionicons name="arrow-forward" size={18} color="#F4F7FE" />
          </TouchableOpacity>

          <View style={styles.contentWrap}>
            <Text style={styles.sectionTitle}>Theory Exam Instructions</Text>
            <Text style={styles.sectionSub}>
              Please review the details below before{'\n'}commencing your definitive driving test{'\n'}simulation.
            </Text>

            <View style={styles.statsGrid}>
              {STAT_CARDS.map((card) => (
                <View key={card.label} style={styles.statCard}>
                  <Ionicons name={card.icon} size={16} color="#4A78D0" />
                  <Text style={styles.statLabel}>{card.label}</Text>
                  <Text style={styles.statValue}>{card.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.guideCard}>
              <View style={styles.guideHeader}>
                <View style={styles.guideBar} />
                <Text style={styles.guideTitle}>ESSENTIAL GUIDELINES</Text>
              </View>

              {GUIDELINES.map((text, index) => (
                <View key={text} style={styles.guideItem}>
                  <View style={styles.numberDot}>
                    <Text style={styles.numberDotText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.guideText}>{text}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <BottomNavBar navigation={navigation} />
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
    height: 78,
    backgroundColor: '#4A78D0',
    paddingHorizontal: 14,
  },
  topRow: {
    height: 78,
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
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: '#F7F9FE',
  },
  body: {
    flex: 1,
    backgroundColor: '#CBD2DE',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  scrollPad: {
    paddingBottom: 94,
  },
  readyStrip: {
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
    backgroundColor: '#CBD2DE',
  },
  readyTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 31 / 2,
    lineHeight: 22,
    color: '#27335A',
  },
  readySub: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 10,
    lineHeight: 14,
    color: '#6B7384',
  },
  startBtn: {
    marginTop: 10,
    marginHorizontal: 16,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#4A78D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A4A89',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 4,
  },
  startBtnText: {
    marginRight: 6,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    lineHeight: 22,
    color: '#F5F8FE',
  },
  contentWrap: {
    marginTop: 12,
    paddingTop: 14,
    paddingHorizontal: 16,
    backgroundColor: '#D7DDE8',
  },
  sectionTitle: {
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 19 * 1.1,
    lineHeight: 31,
    color: '#27335B',
  },
  sectionSub: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15 / 1.2,
    lineHeight: 20,
    color: '#656D7D',
  },
  statsGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 8,
    backgroundColor: '#DFE1E8',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 10,
  },
  statLabel: {
    marginTop: 5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 9,
    lineHeight: 12,
    color: '#6F7687',
  },
  statValue: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 17 / 1.1,
    lineHeight: 22,
    color: '#27335B',
  },
  guideCard: {
    marginTop: 4,
    marginBottom: 18,
    borderRadius: 10,
    backgroundColor: '#DDE2EC',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  guideBar: {
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#26335B',
    marginRight: 8,
  },
  guideTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#3C4664',
    letterSpacing: 0.5,
  },
  guideItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  numberDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2A3460',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  numberDotText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 9,
    lineHeight: 12,
    color: '#F5F8FE',
  },
  guideText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#4D5568',
  },
});
