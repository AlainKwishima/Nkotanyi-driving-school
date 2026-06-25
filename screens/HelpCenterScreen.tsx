import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomNavBar } from '../components/BottomNavBar';
import { AppHeader } from '../components/AppHeader';
import { ScreenColumn } from '../components/ScreenColumn';
import { SectionHeading } from '../components/SectionHeading';
import { RootStackParamList } from '../navigation/types';
import { useI18n } from '../i18n/useI18n';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpCenter'>;

export function HelpCenterScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const faqs = [t('help.faq1'), t('help.faq2'), t('help.faq3'), t('help.faq4')];

  return (
    <ScreenColumn>
      <AppHeader title={t('help.title')} navigation={navigation} onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Ionicons name="chatbubbles-outline" size={27} color={colors.brand} />
            </View>
            <View style={styles.introCopy}>
              <Text style={styles.introTitle}>{t('help.directContact')}</Text>
              <Text style={styles.introText}>{t('reading.helpIntro')}</Text>
            </View>
          </View>

          <SectionHeading title={t('help.directContact')} />
          <View style={styles.contactCard}>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => void Linking.openURL('mailto:support@nkotanyi.rw')}
              activeOpacity={0.78}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={21} color={colors.brandStrong} />
              </View>
              <View style={styles.contactCopy}>
                <Text style={styles.contactLabel}>{t('help.emailSupport')}</Text>
                <Text style={styles.contactValue}>support@nkotanyi.rw</Text>
              </View>
              <Ionicons name="arrow-forward" size={19} color={colors.inkSoft} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => void Linking.openURL('tel:+250788123456')}
              activeOpacity={0.78}
            >
              <View style={[styles.contactIcon, styles.contactIconAmber]}>
                <Ionicons name="call-outline" size={21} color="#9A641B" />
              </View>
              <View style={styles.contactCopy}>
                <Text style={styles.contactLabel}>{t('help.phoneNumber')}</Text>
                <Text style={styles.contactValue}>+250 788 123 456</Text>
              </View>
              <Ionicons name="arrow-forward" size={19} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>

          <SectionHeading title={t('help.faqTitle')} />
          {faqs.map((question, index) => (
            <View key={`${question}-${index}`} style={styles.faqItem}>
              <View style={styles.faqNumber}>
                <Text style={styles.faqNumberText}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <Text style={styles.faqText}>{question}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </View>
          ))}
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  introCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  introCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  introTitle: {
    ...typography.title,
    color: colors.ink,
  },
  introText: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.inkMuted,
  },
  contactCard: {
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  contactRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  contactIconAmber: {
    backgroundColor: colors.amberSoft,
  },
  contactCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactLabel: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  contactValue: {
    ...typography.bodyStrong,
    marginTop: 3,
    color: colors.ink,
  },
  divider: {
    height: 1,
    marginLeft: 56,
    backgroundColor: colors.line,
  },
  faqItem: {
    minHeight: 70,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  faqNumber: {
    width: 36,
    height: 36,
    marginRight: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  faqNumberText: {
    ...typography.caption,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.amber,
  },
  faqText: {
    ...typography.bodyStrong,
    flex: 1,
    marginRight: spacing.sm,
    color: colors.ink,
  },
});
