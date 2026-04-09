import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Dimensions, Image, ImageResolvedAssetSource, ScrollView, StyleSheet, View } from 'react-native';

import { REFERENCE_BY_KEY } from '../assets/referenceScreens';
import { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/ScreenHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'ReferenceImage'>;

export function ReferenceImageScreen({ route, navigation }: Props) {
  const screen = REFERENCE_BY_KEY[route.params.key];
  const phoneWidth = Math.min(Dimensions.get('window').width, 420);
  const resolved = Image.resolveAssetSource(screen.source) as ImageResolvedAssetSource | undefined;
  const aspectRatio = resolved?.width && resolved?.height ? resolved.width / resolved.height : 1125 / 2433;

  return (
    <View style={styles.root}>
      <ScreenHeader title={screen.title} onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Image source={screen.source} style={{ width: phoneWidth, aspectRatio }} resizeMode="contain" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FBF8FD',
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 24,
  },
});
