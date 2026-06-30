import { AppText } from './AppText';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../constants/theme';
import { useResponsiveMetrics } from '../utils/responsive';

export function ProgressRing({
  value,
  size = 92,
  strokeWidth = 9,
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const r = useResponsiveMetrics();
  const scaledSize = r.scale(size);
  const scaledStrokeWidth = Math.max(1, r.scale(strokeWidth));
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (scaledSize - scaledStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);
  const center = scaledSize / 2;

  return (
    <View style={[styles.root, { width: scaledSize, height: scaledSize }]}>
      <Svg width={scaledSize} height={scaledSize} style={styles.svg}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={scaledStrokeWidth}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.amber}
          strokeWidth={scaledStrokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation={-90}
          originX={center}
          originY={center}
        />
      </Svg>
      <View style={styles.center}>
        <AppText style={[styles.value, { fontSize: r.font(19), lineHeight: r.lineHeight(19) }]}>{clamped}%</AppText>
        {label ? <AppText style={[styles.label, { marginTop: -r.verticalScale(1), fontSize: r.font(10, 0.2), lineHeight: r.lineHeight(10, 0.2) }]}>{label}</AppText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
  },
  value: {
    fontFamily: 'Poppins-ExtraBold',
    color: colors.white,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    color: '#EFF6FF',
  },
});
