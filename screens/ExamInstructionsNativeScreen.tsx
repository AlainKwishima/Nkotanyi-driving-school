import React, { useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomNavBar } from '../components/BottomNavBar';
import { HeaderMenu } from '../components/HeaderMenu';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useAppFlow } from '../context/AppFlowContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useGateModal } from '../context/GateModalContext';
import { RootStackParamList } from '../navigation/types';
import { useI18n } from '../i18n/useI18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamInstructionsNative'>;

type StatCardDef = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  labelKey: string;
  valueKey: string;
};

const STAT_CARD_DEFS: StatCardDef[] = [
  { icon: 'timer-outline', labelKey: 'examInstructions.statTimeLimit', valueKey: 'examInstructions.statTimeValue' },
  { icon: 'help-circle-outline', labelKey: 'examInstructions.statQuestions', valueKey: 'examInstructions.statQuestionsValue' },
  { icon: 'ribbon-outline', labelKey: 'examInstructions.statPassing', valueKey: 'examInstructions.statPassingValue' },
  { icon: 'clipboard-outline', labelKey: 'examInstructions.statExamType', valueKey: 'examInstructions.statExamTypeValue' },
];

const GUIDE_KEYS = ['examInstructions.guide1', 'examInstructions.guide2', 'examInstructions.guide3', 'examInstructions.guide4'] as const;

export function ExamInstructionsNativeScreen({ navigation }: Props) {
  const { hasSubscription, hasUsedFreeTrial } = useAppFlow();
  const { openGateModal } = useGateModal();
  const { insets, tabScrollBottomPad } = useResponsiveLayout();
  const { t } = useI18n();

  const statCards = useMemo(
    () =>
      STAT_CARD_DEFS.map((c) => ({
        icon: c.icon,
        label: t(c.labelKey),
        value: t(c.valueKey),
      })),
    [t],
  );

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backTap} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('examInstructions.title')}</Text>
          <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={14} />
        </View>
      </View>

      <View style={styles.body}>
        <ScrollView contentContainerStyle={[styles.scrollPad, { paddingBottom: tabScrollBottomPad }]} showsVerticalScrollIndicator={false}>
          <View style={styles.readyStrip}>
            <Text style={styles.readyTitle}>{t('examInstructions.readyTitle')}</Text>
            <Text style={styles.readySub}>{t('examInstructions.readySub')}</Text>
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
            <Text style={styles.startBtnText}>{t('examInstructions.startExam')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#F4F7FE" />
          </TouchableOpacity>

          <View style={styles.contentWrap}>
            <Text style={styles.sectionTitle}>{t('examInstructions.sectionTitle')}</Text>
            <Text style={styles.sectionSub}>{t('examInstructions.sectionSub')}</Text>

            <View style={styles.statsGrid}>
              {statCards.map((card) => (
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
                <Text style={styles.guideTitle}>{t('examInstructions.guidelinesTitle').toUpperCase()}</Text>
              </View>

              {GUIDE_KEYS.map((key, index) => (
                <View key={key} style={styles.guideItem}>
                  <View style={styles.numberDot}>
                    <Text style={styles.numberDotText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.guideText}>{t(key)}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 0,
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
