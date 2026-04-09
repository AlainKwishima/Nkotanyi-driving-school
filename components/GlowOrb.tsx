import React from 'react';
import { StyleSheet, View } from 'react-native';

type GlowOrbProps = {
  size: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

export function GlowOrb({ size, top, right, bottom, left }: GlowOrbProps) {
  return (
    <View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top,
          right,
          bottom,
          left,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    backgroundColor: 'rgba(69, 113, 203, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(123, 146, 210, 0.35)',
    shadowColor: '#2B4185',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 4,
  },
});
