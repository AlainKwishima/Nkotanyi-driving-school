import React, { useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useI18n } from '../i18n/useI18n';

type NoSelectedProps = NativeStackScreenProps<RootStackParamList, 'PracticeNoSelectedNative'>;
type SelectedProps = NativeStackScreenProps<RootStackParamList, 'PracticeSelectedNative'>;

const OPTION_KEYS = ['performance.mock.opt1', 'performance.mock.opt2', 'performance.mock.opt3'] as const;

function PracticeLayout({
  selected,
  onNext,
  onAnswer,
  onBack,
  navigation,
}: {
  selected: boolean;
  onNext: () => void;
  onAnswer: () => void;
  onBack: () => void;
  navigation: NoSelectedProps['navigation'] | SelectedProps['navigation'];
}) {
  const { t } = useI18n();
  const { insets } = useResponsiveLayout();
  const options = useMemo(() => OPTION_KEYS.map((k) => t(k)), [t]);

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={34} color="#F5F7FC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('exam.title')}</Text>
        <HeaderMenu navigation={navigation} iconColor="#F5F7FC" topOffset={56} rightOffset={14} />
      </View>

      <View style={styles.body}>
        <View style={styles.qCard}>
          <Text style={styles.question}>{t('performance.mock.question')}</Text>
          <Image source={require('../assets/practice-road-diagram.png')} style={styles.road} resizeMode="contain" />
        </View>

        {options.map((opt, i) => (
          <View key={OPTION_KEYS[i]} style={[styles.option, selected && i === 0 && styles.optionSelected]}>
            <Text style={[styles.optionText, selected && i === 0 && styles.optionTextSelected]}>{opt}</Text>
          </View>
        ))}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.answerBtn} onPress={onAnswer}>
            <Text style={styles.answerText}>{t('practice.answer')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextText}>{t('practice.next')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenColumn>
  );
}

export function PracticeNoSelectedNativeScreen({ navigation }: NoSelectedProps) {
  return (
    <PracticeLayout
      selected={false}
      onBack={() => navigation.goBack()}
      navigation={navigation}
      onAnswer={() => navigation.navigate('PracticeSelectedNative')}
      onNext={() => navigation.navigate('PracticeSelectedNative')}
    />
  );
}

export function PracticeSelectedNativeScreen({ navigation }: SelectedProps) {
  return (
    <PracticeLayout
      selected
      onBack={() => navigation.goBack()}
      navigation={navigation}
      onAnswer={() => navigation.navigate('TestFailedNative')}
      onNext={() => navigation.navigate('TestFailedNative')}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 78,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: '#F4F7FF',
  },
  body: {
    flex: 1,
    backgroundColor: '#CBD1DD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  qCard: {
    borderRadius: 16,
    backgroundColor: '#E4E4E6',
    padding: 14,
    marginBottom: 12,
  },
  question: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#40434F',
  },
  road: {
    marginTop: 16,
    width: '100%',
    height: 290,
  },
  option: {
    minHeight: 78,
    borderRadius: 16,
    backgroundColor: '#E6E6E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  optionSelected: {
    backgroundColor: '#4A78D0',
  },
  optionText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#282B67',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#F4F7FF',
  },
  actions: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  answerBtn: {
    width: '46%',
    height: 74,
    borderRadius: 40,
    backgroundColor: '#E6E6E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 22,
    color: '#4A78D0',
  },
  nextBtn: {
    width: '46%',
    height: 74,
    borderRadius: 40,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 22,
    color: '#F4F7FF',
  },
});
