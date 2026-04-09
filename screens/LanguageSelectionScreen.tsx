import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, ImageSourcePropType, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../navigation/types';
import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { LanguageOptionCard } from '../components/LanguageOptionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { useMobile } from '../hooks/useMobile';
import { useAppFlow } from '../context/AppFlowContext';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;
type LanguageKey = 'kinyarwanda' | 'english' | 'francais';

type LanguageOption = {
  key: LanguageKey;
  title: string;
  subtitle: string;
  flagUri: ImageSourcePropType;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    key: 'kinyarwanda',
    title: 'Kinyarwanda',
    subtitle: "Ururimi rw'Ikinyarwanda",
    flagUri: FIGMA_ASSETS.flagKinyarwanda,
  },
  {
    key: 'english',
    title: 'English',
    subtitle: 'International Language',
    flagUri: FIGMA_ASSETS.flagEnglish,
  },
  {
    key: 'francais',
    title: 'Francais',
    subtitle: 'Langue Francaise',
    flagUri: FIGMA_ASSETS.flagFrancais,
  },
];

export function LanguageSelectionScreen({ navigation }: Props) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>('kinyarwanda');
  const m = useMobile();
  const { setLanguageChosen } = useAppFlow();

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter }]}>
      <ScrollView contentContainerStyle={[styles.phoneFrame, { width: m.contentWidth }]} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={[styles.header, { width: m.contentWidth, height: m.verticalScale(216) }]}>
          <Image source={FIGMA_ASSETS.brandingLogo} style={[styles.logo, { width: m.scale(184), height: m.scale(184) }]} resizeMode="cover" />
          <Text style={[styles.brandTitle, { width: m.scale(266), fontSize: m.fontScale(20), lineHeight: m.fontScale(32) }]}>Nkotanyi Driving School</Text>
        </View>

        <View style={[styles.main, { width: m.contentWidth, paddingTop: m.verticalScale(30), paddingHorizontal: m.scale(24) }]}>
          <View>
            <View style={[styles.titleMargin, { width: m.contentWidth - m.scale(48), paddingBottom: m.verticalScale(32) }]}>
              <View style={[styles.titleSection, { width: m.contentWidth - m.scale(48) }]}>
                <Text style={[styles.heading, { width: m.scale(223), fontSize: m.fontScale(18), lineHeight: m.fontScale(28) }]}>Choose Your Language</Text>
                <Text style={[styles.subHeading, { marginTop: m.verticalScale(8), width: m.scale(99), fontSize: m.fontScale(14), lineHeight: m.fontScale(20) }]}>Hitamo Ururimi</Text>
              </View>
            </View>

            <View style={[styles.languageList, { width: m.contentWidth - m.scale(48) }]}>
              {LANGUAGE_OPTIONS.map((option) => (
                <View key={option.key} style={option.key === 'kinyarwanda' ? undefined : [styles.languageCardSpacing, { marginTop: m.verticalScale(16) }]}>
                  <LanguageOptionCard
                    title={option.title}
                    subtitle={option.subtitle}
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
              label="Continue"
              onPress={async () => {
                await setLanguageChosen(true);
                navigation.replace('CreateAccount');
              }}
            />
            <Text style={[styles.copyright, { marginTop: m.verticalScale(24), fontSize: m.fontScale(10), lineHeight: m.fontScale(15) }]}>© 2024 NKOTANYI DRIVING SCHOOL</Text>
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
