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
import { colors, radii, shadows, spacing, typography } from '../constants/theme';

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
    <ScreenColumn backgroundColor={colors.brandStrong}>
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
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="shield-checkmark-outline" size={29} color={colors.brandStrong} />
            </View>
            <Text style={styles.heroTitle}>{t('examInstructions.readyTitle')}</Text>
            <Text style={styles.heroBody}>{t('examInstructions.readySub')}</Text>
            <TouchableOpacity style={styles.startButton} onPress={startExam} activeOpacity={0.88}>
              <Text style={styles.startText}>{t('examInstructions.startExam')}</Text>
              <Ionicons name="arrow-forward" size={19} color={colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>{t('examInstructions.sectionTitle')}</Text>
          <Text style={styles.sectionBody}>{t('examInstructions.sectionSub')}</Text>

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
              <Ionicons name="list-outline" size={20} color={colors.brandStrong} />
              <Text style={styles.guideTitle}>{t('examInstructions.guidelinesTitle')}</Text>
            </View>
            {GUIDE_KEYS.map((key, index) => (
              <View key={key} style={styles.guideRow}>
                <View style={styles.guideNumber}>
                  <Text style={styles.guideNumberText}>{index + 1}</Text>
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
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    padding: spacing.xxl,
    borderRadius: radii.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  heroTitle: {
    ...typography.heading,
    marginTop: spacing.lg,
    color: colors.ink,
    textAlign: 'center',
  },
  heroBody: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  startButton: {
    minHeight: 54,
    width: '100%',
    marginTop: spacing.xl,
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
    marginTop: spacing.xxxl,
    color: colors.ink,
    textAlign: 'center',
  },
  sectionBody: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  statsGrid: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48.5%',
    minHeight: 128,
    marginBottom: spacing.md,
    padding: spacing.lg,
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
    marginTop: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  guideHeading: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  guideTitle: {
    ...typography.title,
    color: colors.ink,
  },
  guideRow: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guideNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.amberSoft,
  },
  guideNumberText: {
    ...typography.caption,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#9A5A18',
  },
  guideText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.md,
    color: colors.inkMuted,
  },
});
