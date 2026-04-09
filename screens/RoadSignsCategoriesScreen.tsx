import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RoadSignsCategories'>;

const CATEGORIES = [
  'Warning signs',
  'Priority signs',
  'Prohibitory signs',
  'Mandatory signs',
  'Informative signs',
  'Directional signs',
  'Road markings',
  'Traffic signals',
];

export function RoadSignsCategoriesScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <ScreenHeader title="Road Signs" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((category, idx) => (
          <TouchableOpacity
            key={category}
            style={[styles.card, idx % 2 === 1 && styles.cardRight]}
            onPress={() => navigation.navigate('RoadSignsListNative')}
            activeOpacity={0.9}
          >
            <View style={styles.icon} />
            <Text style={styles.cardText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <BottomNavBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FBF8FD',
    alignItems: 'center',
  },
  grid: {
    width: 375,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    width: 156,
    height: 132,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(198, 197, 208, 0.2)',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 14,
  },
  cardRight: {
    marginLeft: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5ECFB',
    marginBottom: 14,
  },
  cardText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: '#1B1B1E',
  },
});
