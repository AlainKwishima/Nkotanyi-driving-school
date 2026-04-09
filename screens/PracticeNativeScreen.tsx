import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';

type NoSelectedProps = NativeStackScreenProps<RootStackParamList, 'PracticeNoSelectedNative'>;
type SelectedProps = NativeStackScreenProps<RootStackParamList, 'PracticeSelectedNative'>;

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
  const options = [
    'Slowly and safely accelerate while steering in the direction of the skid',
    'Turn your front wheels in the same direction that the rear of the vehicle is sliding',
    'If your car does start to skid, take your foot off the gas, keep both hands on the wheel',
  ];

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={34} color="#F5F7FC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam</Text>
        <HeaderMenu navigation={navigation} iconColor="#F5F7FC" topOffset={80} rightOffset={20} />
      </View>

      <View style={styles.body}>
        <View style={styles.qCard}>
          <Text style={styles.question}>
            When skidding, if the rear end of the car is skidding to the right, turn your wheel to the:
          </Text>
          <Image source={require('../assets/practice-road-diagram.png')} style={styles.road} resizeMode="contain" />
        </View>

        {options.map((opt, i) => (
          <View key={opt} style={[styles.option, selected && i === 0 && styles.optionSelected]}>
            <Text style={[styles.optionText, selected && i === 0 && styles.optionTextSelected]}>{opt}</Text>
          </View>
        ))}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.answerBtn} onPress={onAnswer}>
            <Text style={styles.answerText}>Answer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  safe: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: '#4A78D0' },
  header: {
    height: 86,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 16,
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
    fontSize: 15 / 2,
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
    fontSize: 13 / 2,
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
    fontSize: 15 / 2,
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
    fontSize: 15 / 2,
    lineHeight: 22,
    color: '#F4F7FF',
  },
});

