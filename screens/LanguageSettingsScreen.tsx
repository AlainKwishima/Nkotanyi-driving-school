import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { ScreenColumn } from '../components/ScreenColumn';
import { AppHeader } from '../components/AppHeader';
import { useAppFlow, type ContentLanguageCode } from '../context/AppFlowContext';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSettings'>;

const OPTIONS: Array<{ code: ContentLanguageCode; label: string }> = [
  { code: 'rw', label: 'Kinyarwanda' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
];

export function LanguageSettingsScreen({ navigation }: Props) {
  const { contentLanguage, canChangeLanguage, setContentLanguage } = useAppFlow();
  const { t } = useI18n();

  return (
    <ScreenColumn>
      <AppHeader title={t('language.settingsTitle')} navigation={navigation} onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        {!canChangeLanguage ? (
          <View style={styles.lockNotice}>
            <Ionicons name="lock-closed-outline" size={16} color="#475569" />
            <Text style={styles.lockNoticeText}>{t('language.lockedBody')}</Text>
          </View>
        ) : null}
        <View style={styles.listCard}>
          {OPTIONS.map((option, idx) => {
            const selected = contentLanguage === option.code;
            return (
              <Pressable
                key={option.code}
                onPress={() => {
                  if (!canChangeLanguage) return;
                  void setContentLanguage(option.code);
                }}
                style={[styles.row, idx < OPTIONS.length - 1 && styles.rowDivider]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={!canChangeLanguage}
              >
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.rowLabel}>{option.label}</Text>
                {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.brand} /> : <View style={styles.checkSpacer} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.canvas,
  },
  lockNotice: {
    marginBottom: 12,
    borderRadius: radii.md,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: '#F1D7A7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockNoticeText: {
    marginLeft: 8,
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  listCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  row: {
    minHeight: 62,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: colors.brand,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  rowLabel: {
    flex: 1,
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.ink,
  },
  checkSpacer: {
    width: 22,
    height: 22,
  },
});
