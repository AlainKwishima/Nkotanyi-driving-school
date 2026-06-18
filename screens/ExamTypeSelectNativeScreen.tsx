import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { ScreenColumn } from '../components/ScreenColumn';
import { AppHeader } from '../components/AppHeader';
import { BottomNavBar } from '../components/BottomNavBar';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamTypeSelectNative'>;

export function ExamTypeSelectNativeScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const { hasSubscription, hasUsedFreeTrial, isSigningOut } = useAppFlow();
  const { openGateModal } = useGateModal();

  const examTypes = [
    {
      mode: 'traffic' as const,
      title: t('examType.mixed.title'),
      subtitle: t('examType.mixed.subtitle'),
      description: t('examType.mixed.desc'),
      badge: t('examType.mixed.badge'),
      icon: 'file-question-outline' as const,
      color: colors.brand,
      background: colors.brandSoft,
    },
    {
      mode: 'signs' as const,
      title: t('examType.signs.title'),
      subtitle: t('examType.signs.subtitle'),
      description: t('examType.signs.desc'),
      badge: t('examType.signs.badge'),
      icon: 'sign-caution' as const,
      color: '#A55F1D',
      background: colors.amberSoft,
    },
  ];

  const selectExam = (mode: 'traffic' | 'signs') => {
    if (!hasSubscription && hasUsedFreeTrial) {
      if (!isSigningOut) {
        openGateModal('subscription_exam', () => navigation.navigate('SubscriptionNative'));
      }
      return;
    }
    navigation.navigate('ExamNative', { mode });
  };

  return (
    <ScreenColumn backgroundColor={colors.brandStrong}>
      <AppHeader
        title={t('examType.title')}
        eyebrow={t('examType.subtitle')}
        onBack={() => navigation.goBack()}
        navigation={navigation}
      />

      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottomPad + spacing.xl }]}
        >
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.brandStrong} />
            <Text style={styles.infoText}>{t('examType.info')}</Text>
          </View>

          {examTypes.map((type) => (
            <TouchableOpacity
              key={type.mode}
              style={styles.examCard}
              onPress={() => selectExam(type.mode)}
              activeOpacity={0.86}
            >
              <View style={[styles.accent, { backgroundColor: type.color }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={[styles.typeIcon, { backgroundColor: type.background }]}>
                    <MaterialCommunityIcons name={type.icon} size={28} color={type.color} />
                  </View>
                  <View style={[styles.badge, { backgroundColor: type.background }]}>
                    <Text style={[styles.badgeText, { color: type.color }]}>{type.badge}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{type.title}</Text>
                <Text style={styles.cardSubtitle}>{type.subtitle}</Text>
                <Text style={styles.cardBody}>{type.description}</Text>
                <View style={styles.startRow}>
                  <Text style={[styles.startText, { color: type.color }]}>{t('examType.start')}</Text>
                  <View style={[styles.startArrow, { backgroundColor: type.background }]}>
                    <Ionicons name="arrow-forward" size={17} color={type.color} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.hint}>
            <Ionicons name="shield-checkmark-outline" size={17} color={colors.green} />
            <Text style={styles.hintText}>{t('examType.hint')}</Text>
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
  infoCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.brandSoft,
  },
  infoText: {
    ...typography.body,
    flex: 1,
    color: colors.brandStrong,
  },
  examCard: {
    minHeight: 245,
    marginTop: spacing.xl,
    overflow: 'hidden',
    borderRadius: radii.xl,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  accent: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: spacing.xl,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  badgeText: {
    ...typography.caption,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  cardTitle: {
    ...typography.title,
    marginTop: spacing.lg,
    color: colors.ink,
  },
  cardSubtitle: {
    ...typography.caption,
    marginTop: 2,
    color: colors.inkSoft,
  },
  cardBody: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.inkMuted,
  },
  startRow: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startText: {
    ...typography.bodyStrong,
  },
  startArrow: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  hintText: {
    ...typography.caption,
    flex: 1,
    color: colors.inkMuted,
  },
});
