import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { RootStackParamList } from '../navigation/types';
import { useAppFlow } from '../context/AppFlowContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const { hydrated, hasChosenLanguage, isSignedIn } = useAppFlow();

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const timer = setTimeout(() => {
      if (!hasChosenLanguage) {
        navigation.replace('LanguageSelection');
      } else if (!isSignedIn) {
        navigation.replace('Login');
      } else {
        navigation.replace('HomeNative');
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [hasChosenLanguage, hydrated, isSignedIn, navigation]);

  return (
    <View style={styles.root}>
      <View style={styles.centerArea}>
        <Image source={FIGMA_ASSETS.brandingLogo} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator size="large" color="#2E67CC" style={styles.spinner} />
        <Text style={styles.waitText}>Wait a second...</Text>
      </View>

      <View style={styles.cityWrap}>
        <View style={[styles.building, styles.b1]} />
        <View style={[styles.building, styles.b2]} />
        <View style={[styles.building, styles.b3]} />
        <View style={[styles.building, styles.b4]} />
        <View style={styles.road} />
        <View style={styles.carBody} />
        <View style={[styles.wheel, styles.wheelLeft]} />
        <View style={[styles.wheel, styles.wheelRight]} />
      </View>
    </View>
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
    height: 220,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  building: {
    position: 'absolute',
    bottom: 46,
    backgroundColor: '#D0D4DD',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  b1: {
    left: 10,
    width: 96,
    height: 82,
  },
  b2: {
    left: 96,
    width: 86,
    height: 120,
    backgroundColor: '#C5CBD6',
  },
  b3: {
    left: 178,
    width: 72,
    height: 100,
  },
  b4: {
    right: 18,
    width: 106,
    height: 130,
    backgroundColor: '#BCC2CD',
  },
  road: {
    height: 4,
    backgroundColor: '#D4D7DE',
    borderRadius: 2,
    marginBottom: 20,
  },
  carBody: {
    alignSelf: 'flex-end',
    width: 180,
    height: 48,
    borderRadius: 20,
    backgroundColor: '#D3D3D3',
    marginRight: 20,
  },
  wheel: {
    position: 'absolute',
    bottom: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 4,
    borderColor: '#E4E4E4',
    backgroundColor: '#D8D8D8',
  },
  wheelLeft: {
    right: 132,
  },
  wheelRight: {
    right: 36,
  },
});
