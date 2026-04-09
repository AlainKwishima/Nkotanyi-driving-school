import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';

type PerfProps = NativeStackScreenProps<RootStackParamList, 'PerformanceNative'>;
type DetailProps = NativeStackScreenProps<RootStackParamList, 'PerformanceDetailNative'>;
type ReviewProps = NativeStackScreenProps<RootStackParamList, 'PerformanceReviewNative'>;

type HistoryItem = {
  id: string;
  title: string;
  date: string;
  status: 'PASSED' | 'FAILED';
  answers: string;
  duration: string;
};

const HISTORY_ITEMS: HistoryItem[] = [
  { id: '1', title: 'Exam #1', date: 'Oct 12, 2023 • 14:20 PM', status: 'PASSED', answers: '30/30', duration: '27 min' },
  { id: '2', title: 'Exam #2', date: 'Oct 10, 2023 • 09:15 AM', status: 'FAILED', answers: '22/30', duration: '45 min' },
  { id: '3', title: 'Exam #1', date: 'Oct 08, 2023 • 18:45 PM', status: 'PASSED', answers: '15/15', duration: '08 min' },
  { id: '4', title: 'Theory Test #3', date: 'Oct 05, 2023 • 11:30 AM', status: 'PASSED', answers: '27/30', duration: '31 min' },
];

function TopHeader({
  title,
  onBack,
  navigation,
}: {
  title: string;
  onBack: () => void;
  navigation: PerfProps['navigation'] | DetailProps['navigation'] | ReviewProps['navigation'];
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color="#F5F7FC" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <HeaderMenu navigation={navigation} iconColor="#F5F7FC" topOffset={72} rightOffset={16} />
    </View>
  );
}

function BottomTabs({ navigation }: { navigation: PerfProps['navigation'] | DetailProps['navigation'] | ReviewProps['navigation'] }) {
  return <BottomNavBar navigation={navigation} />;
}

function HistoryCard({ item, onPress }: { item: HistoryItem; onPress?: () => void }) {
  const passed = item.status === 'PASSED';

  return (
    <TouchableOpacity style={styles.historyCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.historyTop}>
        <View style={[styles.resultIconWrap, passed ? styles.resultIconWrapPass : styles.resultIconWrapFail]}>
          <Ionicons name={passed ? 'checkmark' : 'close'} size={18} color={passed ? '#0E9A73' : '#C61E1E'} />
        </View>
        <View style={styles.historyMeta}>
          <Text style={styles.historyTitle}>{item.title}</Text>
          <Text style={styles.historyDate}>{item.date}</Text>
        </View>
        <View style={[styles.statusPill, passed ? styles.statusPillPass : styles.statusPillFail]}>
          <Text style={[styles.statusPillText, passed ? styles.statusPillTextPass : styles.statusPillTextFail]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.historyDivider} />

      <View style={styles.historyBottom}>
        <View style={styles.metricBlock}>
          <MaterialIcons name="fact-check" size={16} color="#5B5F6A" />
          <View style={styles.metricTextWrap}>
            <Text style={styles.metricLabel}>ANSWERS</Text>
            <Text style={styles.metricValue}>{item.answers}</Text>
          </View>
        </View>
        <View style={styles.metricBlock}>
          <Ionicons name="time-outline" size={16} color="#5B5F6A" />
          <View style={styles.metricTextWrap}>
            <Text style={styles.metricLabel}>DURATION</Text>
            <Text style={styles.metricValue}>{item.duration}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function HistoryBackground({ navigation }: { navigation: PerfProps['navigation'] | DetailProps['navigation'] }) {
  return (
    <>
      <TopHeader title="Performance" onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>History</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listPad}>
          {HISTORY_ITEMS.map((item) => (
            <HistoryCard key={item.id} item={item} onPress={() => navigation.navigate('PerformanceDetailNative')} />
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
  return (
    <View style={styles.safe}>
      <HistoryBackground navigation={navigation} />
      <BottomTabs navigation={navigation} />
    </View>
  );
}

export function PerformanceDetailNativeScreen({ navigation }: DetailProps) {
  return (
    <View style={styles.safe}>
      <HistoryBackground navigation={navigation} />

      <View style={styles.overlay} />
      <View style={styles.modal}>
        <View style={styles.modalTop}>
          <View>
            <View style={[styles.statusPill, styles.statusPillPass]}>
              <Text style={[styles.statusPillText, styles.statusPillTextPass]}>PASSED</Text>
            </View>
            <Text style={styles.modalExamTitle}>Exam #1</Text>
            <Text style={styles.modalDate}>Oct 12, 2023</Text>
          </View>
          <View style={styles.scoreWrap}>
            <Text style={styles.scoreValue}>28/30</Text>
            <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
          </View>
        </View>

        <View style={styles.modalDivider} />
        <View style={styles.modalMetaRow}>
          <View style={styles.metricBlock}>
            <Ionicons name="time-outline" size={16} color="#2C355C" />
            <View style={styles.metricTextWrap}>
              <Text style={styles.modalMetaMain}>27 min</Text>
              <Text style={styles.modalMetaSub}>Time Spent</Text>
            </View>
          </View>
          <View style={styles.metricBlock}>
            <Ionicons name="trending-up-outline" size={16} color="#2C355C" />
            <View style={styles.metricTextWrap}>
              <Text style={styles.modalMetaMain}>93%</Text>
              <Text style={styles.modalMetaSub}>Accuracy</Text>
            </View>
          </View>
        </View>

        <View style={styles.modalDivider} />
        <Text style={styles.breakdownTitle}>TOPIC BREAKDOWN</Text>
        <ProgressRow title="Road Signs" value={100} />
        <ProgressRow title="Traffic Rules" value={85} />
        <ProgressRow title="Basic Controls" value={90} />

        <TouchableOpacity style={styles.reviewBtn} onPress={() => navigation.navigate('PerformanceReviewNative')}>
          <Text style={styles.reviewBtnText}>Review Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <BottomTabs navigation={navigation} />
    </View>
  );
}

export function PerformanceReviewNativeScreen({ navigation }: ReviewProps) {
  const options = [
    'Slowly and safely accelerate while steering in the direction of the skid',
    'Turn your front wheels in the same direction that the rear of the vehicle is sliding',
    'If your car does start to skid, take your foot off the gas, keep both hands on the wheel',
  ];

  return (
    <View style={styles.safe}>
      <TopHeader title="Results" onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.reviewPad}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>
              When skidding, if the rear end of the car is skidding to the right, turn your wheel to the:
            </Text>
            <Image source={require('../assets/practice-road-diagram.png')} style={styles.diagram} resizeMode="contain" />
          </View>

          <View style={[styles.answerOption, styles.correctOption]}>
            <Text style={styles.answerLight}>{options[0]}</Text>
          </View>
          <View style={[styles.answerOption, styles.wrongOption]}>
            <Text style={styles.answerLight}>{options[1]}</Text>
          </View>
          <View style={styles.answerOption}>
            <Text style={styles.answerDark}>{options[2]}</Text>
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('PerformanceNative')}>
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: '#4A78D0' },
  header: {
    height: 78,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, lineHeight: 24, color: '#F5F7FC' },
  body: {
    flex: 1,
    backgroundColor: '#CBD1DF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, lineHeight: 28, color: '#1F2A52' },
  viewAll: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, lineHeight: 18, color: '#1F2A52' },
  listPad: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 },
  historyCard: {
    borderRadius: 12,
    backgroundColor: '#F2F3F5',
    padding: 14,
    marginBottom: 14,
  },
  historyTop: { flexDirection: 'row', alignItems: 'center' },
  resultIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconWrapPass: { backgroundColor: '#E2F1EB' },
  resultIconWrapFail: { backgroundColor: '#F2E6E6' },
  historyMeta: { marginLeft: 10, flex: 1 },
  historyTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, lineHeight: 22, color: '#1E2951' },
  historyDate: { marginTop: 1, fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, lineHeight: 17, color: '#5F6370' },
  statusPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillPass: { backgroundColor: '#D2F0DF' },
  statusPillFail: { backgroundColor: '#F6D9D7' },
  statusPillText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 11, lineHeight: 14 },
  statusPillTextPass: { color: '#13835F' },
  statusPillTextFail: { color: '#C53A31' },
  historyDivider: { height: 1, backgroundColor: '#DEE0E6', marginVertical: 12 },
  historyBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  metricBlock: { width: '48%', flexDirection: 'row', alignItems: 'center' },
  metricTextWrap: { marginLeft: 8 },
  metricLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, lineHeight: 13, color: '#5A5E69' },
  metricValue: { marginTop: 1, fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, lineHeight: 20, color: '#222834' },
  tabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#EFF0F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tab: { alignItems: 'center' },
  tabBubble: { width: 46, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabBubbleActive: { backgroundColor: '#4A78D0' },
  tabText: { marginTop: 2, fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, lineHeight: 14, color: '#8A98B2' },
  tabTextActive: { color: '#4A78D0' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(74,90,122,0.45)',
  },
  modal: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: 104,
    borderRadius: 14,
    backgroundColor: '#F7F7F8',
    padding: 16,
  },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between' },
  modalExamTitle: { marginTop: 10, fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, lineHeight: 28, color: '#101A45' },
  modalDate: { marginTop: 6, fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, lineHeight: 20, color: '#555B67' },
  scoreWrap: { alignItems: 'flex-end' },
  scoreValue: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 24, lineHeight: 30, color: '#0C163F' },
  scoreLabel: { marginTop: 2, fontFamily: 'PlusJakartaSans-Medium', fontSize: 10, lineHeight: 13, color: '#586071' },
  modalDivider: { height: 1, backgroundColor: '#E0E2E8', marginVertical: 12 },
  modalMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalMetaMain: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, lineHeight: 18, color: '#1B234A' },
  modalMetaSub: { marginTop: 1, fontFamily: 'PlusJakartaSans-Medium', fontSize: 11, lineHeight: 14, color: '#5D6270' },
  breakdownTitle: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#4A5373',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  progressRow: { marginBottom: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, lineHeight: 20, color: '#1C2448' },
  progressValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, lineHeight: 20, color: '#1C2448' },
  progressTrack: {
    marginTop: 6,
    height: 8,
    backgroundColor: '#E2E3E9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: { height: 8, backgroundColor: '#4979D5', borderRadius: 999 },
  reviewBtn: {
    marginTop: 12,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A78D0',
  },
  reviewBtnText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, lineHeight: 20, color: '#F5F7FC' },
  closeText: {
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: '#0E1A48',
  },
  reviewPad: { padding: 16, paddingBottom: 24 },
  questionCard: {
    borderRadius: 12,
    backgroundColor: '#ECEDEF',
    padding: 14,
    marginBottom: 12,
  },
  questionText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, lineHeight: 20, color: '#3A3E4B' },
  diagram: { width: '100%', height: 190, marginTop: 10 },
  answerOption: {
    minHeight: 62,
    borderRadius: 12,
    backgroundColor: '#ECEDEF',
    marginBottom: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  correctOption: { backgroundColor: '#2FA865' },
  wrongOption: { backgroundColor: '#F25559' },
  answerLight: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, lineHeight: 16, color: '#F6F8FC', textAlign: 'center' },
  answerDark: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, lineHeight: 16, color: '#252B62', textAlign: 'center' },
  nextBtn: {
    marginTop: 8,
    alignSelf: 'center',
    width: 160,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, lineHeight: 20, color: '#F5F7FC' },
});

