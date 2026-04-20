import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { ScreenColumn } from '../components/ScreenColumn';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow, type ContentLanguageCode } from '../context/AppFlowContext';
import { useI18n } from '../i18n/useI18n';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSettings'>;

const OPTIONS: Array<{ code: ContentLanguageCode; label: string }> = [
  { code: 'rw', label: 'Kinyarwanda' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
];

export function LanguageSettingsScreen({ navigation }: Props) {
  const { insets } = useResponsiveLayout();
  const { contentLanguage, canChangeLanguage, setContentLanguage } = useAppFlow();
  const { t } = useI18n();

  return (
    <ScreenColumn backgroundColor="#F4F6FB">
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{t('language.settingsTitle')}</Text>
        <View style={styles.backBtn} />
      </View>

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
                {selected ? <Ionicons name="checkmark-circle" size={22} color="#4A78D0" /> : <View style={styles.checkSpacer} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 94,
    paddingHorizontal: 16,
    backgroundColor: '#4A78D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  lockNotice: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#E8ECF5',
    borderWidth: 1,
    borderColor: '#D5DCEB',
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
    color: '#475569',
  },
  listCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9F5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  row: {
    minHeight: 62,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F8',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#AAB7CF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: '#4A78D0',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A78D0',
  },
  rowLabel: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#25314D',
  },
  checkSpacer: {
    width: 22,
    height: 22,
  },
});
