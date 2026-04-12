import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { RootStackParamList } from '../navigation/types';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/useI18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const { hydrated, hasChosenLanguage, isSignedIn } = useAppFlow();
  const { authReady, accessToken } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!hydrated || !authReady) {
      return;
    }
    const timer = setTimeout(() => {
      if (!hasChosenLanguage) {
        navigation.replace('LanguageSelection');
      } else if (!isSignedIn || !accessToken) {
        navigation.replace('Login');
      } else {
        navigation.replace('HomeNative');
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [hasChosenLanguage, hydrated, isSignedIn, navigation, authReady, accessToken]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.centerArea}>
        <Image source={FIGMA_ASSETS.brandingLogo} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator size="large" color="#2E67CC" style={styles.spinner} />
        <Text style={styles.waitText}>{t('splash.wait')}</Text>
      </View>

      <View style={styles.cityWrap}>
        <Image source={require('../assets/Group 5201.png')} style={styles.cityImage} resizeMode="contain" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E8EBF2',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
  },
  logo: {
    width: 122,
    height: 122,
  },
  spinner: {
    marginTop: 68,
    transform: [{ scale: 1.45 }],
  },
  waitText: {
    marginTop: 24,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 17,
    lineHeight: 21,
    color: '#3F434D',
  },
  cityWrap: {
    width: '100%',
    height: 244,
    justifyContent: 'flex-end',
  },
  cityImage: {
    width: '100%',
    height: 244,
  },
});
