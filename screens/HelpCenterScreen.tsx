import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpCenter'>;

const FAQS = [
  'How do I book practical driving lessons?',
  'Can I switch between Kinyarwanda and English in the app?',
  'How can I track my learning performance?',
  'Where can I find support if the app is not working?',
];

export function HelpCenterScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <ScreenHeader title="help center" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Direct Contact</Text>
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <View style={styles.iconCircle} />
            <View>
              <Text style={styles.contactLabel}>Email Support</Text>
              <Text style={styles.contactValue}>support@nkotanyi.rw</Text>
            </View>
          </View>
          <View style={styles.contactRow}>
            <View style={styles.iconCircle} />
            <View>
              <Text style={styles.contactLabel}>Phone Number</Text>
              <Text style={styles.contactValue}>+250 788 123 456</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((question) => (
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
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqText: {
    maxWidth: 256,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: '#1B1B1E',
  },
  chevron: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    lineHeight: 20,
    color: '#6E6F76',
  },
});

