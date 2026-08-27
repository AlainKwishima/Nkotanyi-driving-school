import React, { useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { AppHeader } from '../components/AppHeader';
import { ScreenColumn } from '../components/ScreenColumn';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';

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
  const options = useMemo(() => OPTION_KEYS.map((k) => t(k)), [t]);

  return (
    <ScreenColumn>
      <AppHeader title={t('exam.title')} navigation={navigation} onBack={onBack} truncateTitle={false} />

      <View style={styles.body}>
        <View style={styles.qCard}>
          <View style={styles.questionLabel}>
            <Ionicons name="help-circle-outline" size={16} color={colors.amber} />
            <Text style={styles.questionLabelText}>{t('exam.chooseAnswer')}</Text>
          </View>
          <Text style={styles.question}>{t('performance.mock.question')}</Text>
          <Image source={require('../assets/practice-road-diagram.png')} style={styles.road} resizeMode="contain" />
        </View>

        {options.map((opt, i) => (
          <TouchableOpacity
            key={OPTION_KEYS[i]}
            style={[styles.option, selected && i === 0 && styles.optionSelected]}
            onPress={onAnswer}
            activeOpacity={0.84}
          >
            <View style={[styles.optionMarker, selected && i === 0 && styles.optionMarkerSelected]}>
              <Text style={[styles.optionMarkerText, selected && i === 0 && styles.optionTextSelected]}>
                {String.fromCharCode(65 + i)}
              </Text>
            </View>
            <Text style={[styles.optionText, selected && i === 0 && styles.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
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
  body: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  qCard: {
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  questionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  questionLabelText: {
    ...typography.eyebrow,
    color: colors.amber,
    textTransform: 'uppercase',
  },
  question: {
    ...typography.title,
    color: colors.ink,
  },
  road: {
    marginTop: spacing.lg,
    width: '100%',
    height: 250,
    borderRadius: radii.md,
  },
  option: {
    minHeight: 68,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  optionSelected: {
    backgroundColor: colors.brandStrong,
    borderColor: colors.brandStrong,
  },
  optionMarker: {
    width: 38,
    height: 38,
    marginRight: spacing.md,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  optionMarkerSelected: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  optionMarkerText: {
    ...typography.bodyStrong,
    color: colors.brandStrong,
  },
  optionText: {
    ...typography.body,
    flex: 1,
    color: colors.ink,
  },
  optionTextSelected: {
    color: colors.white,
  },
  actions: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.md,
  },
  answerBtn: {
    flex: 1,
    height: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  answerText: {
    ...typography.bodyStrong,
    color: colors.brand,
  },
  nextBtn: {
    flex: 1,
    height: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});
