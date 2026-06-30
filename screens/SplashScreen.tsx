import { AppText } from '../components/AppText';
import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { RootStackParamList } from '../navigation/types';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, spacing, typography } from '../constants/theme';

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
        <View style={styles.logoCard}>
          <Image source={FIGMA_ASSETS.brandingLogo} style={styles.logo} resizeMode="contain" />
        </View>
        <AppText style={styles.brandName}>{t('splash.brandName')}</AppText>
        <AppText style={styles.brandDescriptor}>{t('splash.brandDescriptor')}</AppText>
        <ActivityIndicator size="small" color={colors.brand} style={styles.spinner} />
        <AppText style={styles.waitText}>{t('splash.wait')}</AppText>
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
    backgroundColor: colors.canvas,
    overflow: 'hidden',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 108,
  },
  logoCard: {
    width: 132,
    height: 132,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  logo: {
    width: 112,
    height: 112,
  },
  brandName: {
    ...typography.heading,
    marginTop: spacing.xl,
    color: colors.ink,
    letterSpacing: 2,
  },
  brandDescriptor: {
    ...typography.eyebrow,
    marginTop: spacing.xs,
    color: colors.brand,
  },
  spinner: {
    marginTop: 42,
  },
  waitText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.inkMuted,
  },
  cityWrap: {
    width: '100%',
    height: 214,
    justifyContent: 'flex-end',
  },
  cityImage: {
    width: '100%',
    height: 214,
  },
});
