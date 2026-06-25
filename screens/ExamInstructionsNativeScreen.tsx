import React, { useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomNavBar } from '../components/BottomNavBar';
import { AppHeader } from '../components/AppHeader';
import { ScreenColumn } from '../components/ScreenColumn';
import { useAppFlow } from '../context/AppFlowContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useGateModal } from '../context/GateModalContext';
import { RootStackParamList } from '../navigation/types';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, spacing, typography } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamInstructionsNative'>;

const STAT_DEFINITIONS = [
  { icon: 'timer-outline', label: 'examInstructions.statTimeLimit', value: 'examInstructions.statTimeValue' },
  { icon: 'help-circle-outline', label: 'examInstructions.statQuestions', value: 'examInstructions.statQuestionsValue' },
  { icon: 'ribbon-outline', label: 'examInstructions.statPassing', value: 'examInstructions.statPassingValue' },
  { icon: 'clipboard-outline', label: 'examInstructions.statExamType', value: 'examInstructions.statExamTypeValue' },
] as const;

const GUIDE_KEYS = [
  'examInstructions.guide1',
  'examInstructions.guide2',
  'examInstructions.guide3',
  'examInstructions.guide4',
] as const;

export function ExamInstructionsNativeScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const { hasSubscription, hasUsedFreeTrial, isSigningOut } = useAppFlow();
  const { openGateModal } = useGateModal();

  const stats = useMemo(
    () =>
      STAT_DEFINITIONS.map((item) => ({
        icon: item.icon,
        label: t(item.label),
        value: t(item.value),
      })),
    [t],
  );

  const startExam = () => {
    if (!hasSubscription && hasUsedFreeTrial) {
      if (!isSigningOut) {
        openGateModal('subscription_exam', () => navigation.navigate('SubscriptionNative'));
      }
      return;
    }
    navigation.navigate('ExamTypeSelectNative');
  };

  return (
    <ScreenColumn>
      <AppHeader
        title={t('examInstructions.title')}
        eyebrow={t('home.action.exams')}
        onBack={() => navigation.goBack()}
        navigation={navigation}
      />

      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottomPad + spacing.xl }]}
        >
          <View style={styles.introCard}>
            <View style={styles.introHeader}>
              <View style={styles.introIcon}>
                <Ionicons name="shield-checkmark-outline" size={23} color={colors.brandStrong} />
              </View>
              <View style={styles.introCopy}>
                <Text style={styles.introEyebrow}>{t('home.action.exams')}</Text>
                <Text style={styles.introTitle}>{t('examInstructions.readyTitle')}</Text>
              </View>
            </View>
            <Text style={styles.introBody}>{t('examInstructions.readySub')}</Text>
            <TouchableOpacity style={styles.startButton} onPress={startExam} activeOpacity={0.88}>
              <Text style={styles.startText}>{t('examInstructions.startExam')}</Text>
              <Ionicons name="arrow-forward" size={19} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('examInstructions.sectionTitle')}</Text>
            <Text style={styles.sectionBody}>{t('examInstructions.sectionSub')}</Text>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name={stat.icon} size={19} color={colors.brand} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.guideCard}>
            <View style={styles.guideHeading}>
              <Text style={styles.guideTitle}>{t('examInstructions.guidelinesTitle')}</Text>
              <Ionicons name="list-outline" size={20} color={colors.brandStrong} />
            </View>
            {GUIDE_KEYS.map((key, index) => (
              <View key={key} style={styles.guideRow}>
                <View style={styles.guideNumber}>
                  <Ionicons name="checkmark" size={15} color={colors.brandStrong} />
                </View>
                <Text style={styles.guideText}>{t(key)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  introCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  introCopy: {
    flex: 1,
  },
  introEyebrow: {
    ...typography.eyebrow,
    color: colors.brand,
    textTransform: 'uppercase',
  },
  introTitle: {
    ...typography.heading,
    marginTop: 2,
    color: colors.ink,
  },
  introBody: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.inkMuted,
  },
  startButton: {
    minHeight: 50,
    width: '100%',
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brand,
  },
  startText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.ink,
  },
  sectionBody: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.inkMuted,
  },
  sectionHeader: {
    marginTop: spacing.xl,
  },
  statsGrid: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48.5%',
    minHeight: 112,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  statValue: {
    ...typography.bodyStrong,
    marginTop: spacing.md,
    color: colors.ink,
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
    color: colors.inkSoft,
  },
  guideCard: {
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  guideHeading: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guideTitle: {
    ...typography.title,
    color: colors.ink,
  },
  guideRow: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guideNumber: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  guideText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.md,
    color: colors.inkMuted,
  },
});
