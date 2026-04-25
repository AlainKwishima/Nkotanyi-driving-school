import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { RootStackParamList } from '../navigation/types';
import { useI18n } from '../i18n/useI18n';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpCenter'>;

export function HelpCenterScreen({ navigation }: Props) {
  const { t } = useI18n();
  const faqs = [t('help.faq1'), t('help.faq2'), t('help.faq3'), t('help.faq4')];

  return (
    <View style={styles.root}>
      <ScreenHeader title={t('help.title')} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('help.directContact')}</Text>
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <View style={styles.iconCircle} />
            <View>
              <Text style={styles.contactLabel}>{t('help.emailSupport')}</Text>
              <Text style={styles.contactValue}>support@nkotanyi.rw</Text>
            </View>
          </View>
          <View style={styles.contactRow}>
            <View style={styles.iconCircle} />
            <View>
              <Text style={styles.contactLabel}>{t('help.phoneNumber')}</Text>
              <Text style={styles.contactValue}>+250 788 123 456</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('help.faqTitle')}</Text>
        {faqs.map((question) => (
          <Pressable key={question} style={styles.faqItem}>
            <Text style={styles.faqText}>{question}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>
        ))}
      </ScrollView>

      <BottomNavBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FBF8FD',
    alignItems: 'center',
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    width: 375,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    lineHeight: 28,
    color: '#1B1B1E',
    marginBottom: 16,
  },
  contactCard: {
    width: 327,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(198, 197, 208, 0.2)',
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 28,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5ECFB',
    marginRight: 16,
  },
  contactLabel: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 15,
    color: '#6E6F76',
  },
  contactValue: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    lineHeight: 24,
    color: '#1B1B1E',
  },
  faqItem: {
    width: 327,
    minHeight: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(198, 197, 208, 0.2)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  faqText: {
    flex: 1,
    marginRight: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#1B1B1E',
  },
  chevron: {
    fontSize: 20,
    lineHeight: 20,
    color: '#8D8E98',
  },
});
