import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type VideoCourseItemCardProps = {
  title: string;
  duration: string;
  active?: boolean;
  onPress?: () => void;
};

export function VideoCourseItemCard({ title, duration, active, onPress }: VideoCourseItemCardProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, active && styles.cardActive]}>
      <View style={styles.thumb} />
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.duration, active && styles.playing]}>{active ? 'Playing now.....' : duration}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 346,
    height: 91,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(198, 197, 208, 0.2)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActive: {
    borderColor: '#4378DB',
  },
  thumb: {
    width: 89,
    height: 65,
    borderRadius: 8,
    backgroundColor: '#C8D4F1',
  },
  textWrap: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 18,
    color: '#1B1B1E',
  },
  duration: {
    marginTop: 6,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#6E6F76',
  },
  playing: {
    color: '#4378DB',
  },
});

