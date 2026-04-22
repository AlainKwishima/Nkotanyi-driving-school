import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, ImageSourcePropType, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../navigation/types';
import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { LanguageOptionCard } from '../components/LanguageOptionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { useMobile } from '../hooks/useMobile';
import { useAppFlow } from '../context/AppFlowContext';
import type { ContentLanguageCode } from '../context/AppFlowContext';
import { useI18n } from '../i18n/useI18n';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;
type LanguageKey = 'kinyarwanda' | 'english' | 'francais';

type LanguageOption = {
  key: LanguageKey;
  titleKey: string;
  subtitleKey: string;
  flagUri: ImageSourcePropType;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { key: 'kinyarwanda', titleKey: 'language.opt.rw.title', subtitleKey: 'language.opt.rw.sub', flagUri: FIGMA_ASSETS.flagKinyarwanda },
  { key: 'english', titleKey: 'language.opt.en.title', subtitleKey: 'language.opt.en.sub', flagUri: FIGMA_ASSETS.flagEnglish },
  { key: 'francais', titleKey: 'language.opt.fr.title', subtitleKey: 'language.opt.fr.sub', flagUri: FIGMA_ASSETS.flagFrancais },
];

function contentLangToCardKey(code: ContentLanguageCode): LanguageKey {
  if (code === 'rw') return 'kinyarwanda';
  if (code === 'fr') return 'francais';
  return 'english';
}

export function LanguageSelectionScreen({ navigation, route }: Props) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>('kinyarwanda');
  const m = useMobile();
  const { t } = useI18n();
  const { setContentLanguage, contentLanguage, commitLanguageSelection } = useAppFlow();
  const changeOnly = Boolean(route.params?.changeOnly);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (changeOnly) {
      setSelectedLanguage(contentLangToCardKey(contentLanguage));
    }
  }, [changeOnly, contentLanguage]);

  const apiLang = (key: LanguageKey): ContentLanguageCode => {
    if (key === 'kinyarwanda') return 'rw';
    if (key === 'francais') return 'fr';
    return 'en';
  };

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter }]}>
      <ScrollView
        style={{ width: '100%', maxWidth: m.contentWidth, alignSelf: 'center' }}
        contentContainerStyle={[
          styles.phoneFrame,
          { paddingBottom: Math.max(insets.bottom, m.verticalScale(16)), flexGrow: 1 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.header, { height: m.verticalScale(216) }]}>
          <Image source={FIGMA_ASSETS.brandingLogo} style={[styles.logo, { width: m.scale(184), height: m.scale(184) }]} resizeMode="cover" />
          <Text style={[styles.brandTitle, { width: m.scale(266), fontSize: m.fontScale(20), lineHeight: m.fontScale(32) }]}>
            {t('language.brand')}
          </Text>
        </View>

        <View style={[styles.main, { paddingTop: m.verticalScale(30), paddingHorizontal: m.scale(24) }]}>
          <View style={styles.mainInner}>
            <View style={[styles.titleMargin, { paddingBottom: m.verticalScale(32) }]}>
              <View style={styles.titleSection}>
                <Text style={[styles.heading, { maxWidth: m.scale(280), fontSize: m.fontScale(18), lineHeight: m.fontScale(28) }]}>
                  {changeOnly ? t('language.changeTitle') : t('language.chooseTitle')}
                </Text>
                <Text style={[styles.subHeading, { marginTop: m.verticalScale(8), maxWidth: m.scale(280), fontSize: m.fontScale(14), lineHeight: m.fontScale(20) }]}>
                  {changeOnly ? t('language.changeHint') : t('language.chooseSubtitle')}
                </Text>
              </View>
            </View>

            <View style={styles.languageList}>
              {LANGUAGE_OPTIONS.map((option) => (
                <View key={option.key} style={option.key === 'kinyarwanda' ? undefined : [styles.languageCardSpacing, { marginTop: m.verticalScale(16) }]}>
                  <LanguageOptionCard
                    title={t(option.titleKey)}
                    subtitle={t(option.subtitleKey)}
                    flagUri={option.flagUri}
                    selected={option.key === selectedLanguage}
                    onPress={() => setSelectedLanguage(option.key)}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.footerActions, { paddingBottom: m.verticalScale(24), paddingTop: m.verticalScale(20) }]}>
            <PrimaryButton
              label={t('language.continue')}
              onPress={async () => {
                const lang = apiLang(selectedLanguage);
                if (changeOnly) {
                  await setContentLanguage(lang);
                  navigation.goBack();
                  return;
                }
                await commitLanguageSelection(lang);
                navigation.replace('CreateAccount');
              }}
            />
            <Text style={[styles.copyright, { marginTop: m.verticalScale(24), fontSize: m.fontScale(10), lineHeight: m.fontScale(15) }]}>
              {t('language.copyright')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F5FA',
    alignItems: 'center',
  },
  phoneFrame: {
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#F3F5FA',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: 216,
    alignItems: 'center',
  },
  logo: {
    width: 184,
    height: 184,
  },
  brandTitle: {
    width: 266.22,
    textAlign: 'center',
    color: '#1E293B',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  main: {
    width: '100%',
    flex: 1,
    paddingTop: 34,
    paddingHorizontal: 24,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  mainInner: {
    width: '100%',
    alignItems: 'stretch',
  },
  titleMargin: {
    width: '100%',
    paddingBottom: 40,
  },
  titleSection: {
    width: '100%',
    alignItems: 'center',
  },
  heading: {
    textAlign: 'center',
    color: '#1E293B',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 22,
    lineHeight: 32,
  },
  subHeading: {
    marginTop: 8,
    textAlign: 'center',
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 22,
  },
  languageList: {
    width: '100%',
  },
  languageCardSpacing: {
    marginTop: 16,
  },
  footerActions: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 20,
  },
  copyright: {
    marginTop: 24,
    textAlign: 'center',
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
