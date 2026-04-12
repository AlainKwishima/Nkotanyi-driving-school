import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, ImageSourcePropType, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  const { setLanguageChosen, setContentLanguage, contentLanguage } = useAppFlow();
  const changeOnly = Boolean(route.params?.changeOnly);

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
      <ScrollView contentContainerStyle={[styles.phoneFrame, { width: m.contentWidth }]} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={[styles.header, { width: m.contentWidth, height: m.verticalScale(216) }]}>
          <Image source={FIGMA_ASSETS.brandingLogo} style={[styles.logo, { width: m.scale(184), height: m.scale(184) }]} resizeMode="cover" />
          <Text style={[styles.brandTitle, { width: m.scale(266), fontSize: m.fontScale(20), lineHeight: m.fontScale(32) }]}>
            {t('language.brand')}
          </Text>
        </View>

        <View style={[styles.main, { width: m.contentWidth, paddingTop: m.verticalScale(30), paddingHorizontal: m.scale(24) }]}>
          <View>
            <View style={[styles.titleMargin, { width: m.contentWidth - m.scale(48), paddingBottom: m.verticalScale(32) }]}>
              <View style={[styles.titleSection, { width: m.contentWidth - m.scale(48) }]}>
                <Text style={[styles.heading, { width: m.scale(260), fontSize: m.fontScale(18), lineHeight: m.fontScale(28) }]}>
                  {changeOnly ? t('language.changeTitle') : t('language.chooseTitle')}
                </Text>
                <Text style={[styles.subHeading, { marginTop: m.verticalScale(8), maxWidth: m.scale(280), fontSize: m.fontScale(14), lineHeight: m.fontScale(20) }]}>
                  {changeOnly ? t('language.changeHint') : t('language.chooseSubtitle')}
                </Text>
              </View>
            </View>

            <View style={[styles.languageList, { width: m.contentWidth - m.scale(48) }]}>
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

          <View style={[styles.footerActions, { width: m.contentWidth - m.scale(48), paddingBottom: m.verticalScale(24), paddingTop: m.verticalScale(20) }]}>
            <PrimaryButton
              label={t('language.continue')}
              onPress={async () => {
                await setContentLanguage(apiLang(selectedLanguage));
                await setLanguageChosen(true);
                if (changeOnly) {
                  navigation.goBack();
                  return;
                }
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
    backgroundColor: '#FBF8FD',
    alignItems: 'center',
  },
  phoneFrame: {
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#FBF8FD',
    alignItems: 'center',
  },
  header: {
    width: 390,
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
    color: '#04103A',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 20,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  main: {
    width: 390,
    flex: 1,
    paddingTop: 34,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleMargin: {
    width: 342,
    paddingBottom: 40,
  },
  titleSection: {
    width: 342,
    alignItems: 'center',
  },
  heading: {
    width: 222.89,
    textAlign: 'center',
    color: '#1B1B1E',
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    lineHeight: 28,
  },
  subHeading: {
    marginTop: 8,
    width: 98.69,
    textAlign: 'center',
    color: 'rgba(69, 70, 78, 0.7)',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  languageList: {
    width: 342,
  },
  languageCardSpacing: {
    marginTop: 16,
  },
  footerActions: {
    width: 342,
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 20,
  },
  copyright: {
    marginTop: 24,
    textAlign: 'center',
    color: 'rgba(69, 70, 78, 0.5)',
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
