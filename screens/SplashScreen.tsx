import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { RootStackParamList } from '../navigation/types';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth } from '../context/AuthContext';
import { colors, radii } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const { hydrated, hasChosenLanguage, isSignedIn } = useAppFlow();
  const { authReady, accessToken } = useAuth();

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
});
