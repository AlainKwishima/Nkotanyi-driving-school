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
  const {
    hasSubscription,
    hasUsedFreeTrial,
  } = useAppFlow();
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
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#F6F8FE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('examInstructions.title')}</Text>
          <View style={styles.headerRight}>
            <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={20} />
          </View>
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
              navigation.navigate('ExamTypeSelectNative');
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerRight: {
    position: 'absolute',
    right: 0,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    color: '#F7F9FE',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: '#F3F5FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    marginTop: -20,
  },
  scrollPad: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  readyStrip: {
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  readyTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 24,
    color: '#1E293B',
  },
  readySub: {
    marginTop: 6,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#64748B',
  },
  startBtn: {
    marginTop: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  startBtnText: {
    marginRight: 8,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  contentWrap: {
    marginTop: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    color: '#1E293B',
  },
  sectionSub: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#64748B',
  },
  statsGrid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    marginTop: 8,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 16,
    color: '#1E293B',
  },
  guideCard: {
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  guideBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#2563EB',
    marginRight: 10,
  },
  guideTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  guideItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  numberDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  numberDotText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 11,
    color: '#2563EB',
  },
  guideText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
});
