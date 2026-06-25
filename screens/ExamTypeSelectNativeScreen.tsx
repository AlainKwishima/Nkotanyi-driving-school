import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { ScreenColumn } from '../components/ScreenColumn';
import { AppHeader } from '../components/AppHeader';
import { BottomNavBar } from '../components/BottomNavBar';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, spacing, typography } from '../constants/theme';

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
      color: colors.brand,
      background: colors.brandSoft,
    },
    {
      mode: 'signs' as const,
      title: t('examType.signs.title'),
      subtitle: t('examType.signs.subtitle'),
      description: t('examType.signs.desc'),
      badge: t('examType.signs.badge'),
      color: colors.success,
      background: colors.successSoft,
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
    <ScreenColumn>
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
          <View style={styles.selectorPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{t('examType.subtitle')}</Text>
              <Text style={styles.panelBody}>{t('examType.info')}</Text>
            </View>

            <View style={styles.choiceList}>
              {examTypes.map((type, index) => (
                <TouchableOpacity
                  key={type.mode}
                  style={[styles.choiceRow, index === 0 ? styles.choiceRowPrimary : styles.choiceRowSecondary]}
                  onPress={() => selectExam(type.mode)}
                  activeOpacity={0.86}
                >
                  <View style={styles.choiceMain}>
                    <View style={styles.choiceTitleLine}>
                      <Text style={[styles.choiceTitle, index === 0 && styles.choiceTitlePrimary]}>{type.title}</Text>
                      <Text style={[styles.choiceBadge, { color: type.color, backgroundColor: type.background }]}>
                        {type.badge}
                      </Text>
                    </View>
                    <Text style={[styles.choiceSubtitle, index === 0 && styles.choiceTextOnPrimary]}>{type.subtitle}</Text>
                    <Text style={[styles.choiceDescription, index === 0 && styles.choiceTextOnPrimary]}>
                      {type.description}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={19} color={index === 0 ? colors.white : colors.brandStrong} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.footerNote}>
              <Text style={styles.footerText}>{hasSubscription ? t('examType.subtitle') : t('examType.hint')}</Text>
            </View>
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
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  selectorPanel: {
    overflow: 'hidden',
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  panelHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.brand,
  },
  panelTitle: {
    ...typography.title,
    color: colors.white,
  },
  panelBody: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: '#DCE8FF',
  },
  choiceList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  choiceRow: {
    minHeight: 132,
    padding: spacing.lg,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
  },
  choiceRowPrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  choiceRowSecondary: {
    backgroundColor: colors.white,
    borderColor: colors.line,
  },
  choiceMain: {
    flex: 1,
  },
  choiceTitleLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  choiceTitle: {
    ...typography.title,
    flex: 1,
    color: colors.ink,
  },
  choiceTitlePrimary: {
    color: colors.white,
  },
  choiceBadge: {
    ...typography.caption,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  choiceSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.inkSoft,
  },
  choiceDescription: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.inkMuted,
  },
  choiceTextOnPrimary: {
    color: '#DCE8FF',
  },
  footerNote: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerText: {
    ...typography.caption,
    color: colors.inkMuted,
  },
});
