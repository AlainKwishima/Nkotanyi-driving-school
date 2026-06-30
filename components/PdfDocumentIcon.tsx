import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useResponsiveMetrics } from '../utils/responsive';

type PdfDocumentIconProps = {
  size?: number;
};

export function PdfDocumentIcon({ size = 64 }: PdfDocumentIconProps) {
  const r = useResponsiveMetrics();
  const scaledSize = r.scale(size);
  const documentWidth = scaledSize * 0.42;
  const documentHeight = scaledSize * 0.5;

  return (
    <View style={[styles.root, { width: scaledSize, height: scaledSize, borderRadius: scaledSize * 0.28 }]}>
      <Svg width={documentWidth} height={documentHeight} viewBox="0 0 42 52" accessibilityRole="image">
        <Path
          d="M7 0h20l15 15v32a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5Z"
          fill="#F05252"
        />
        <Path d="M27 1v14h14" fill="#FFFFFF" opacity={0.9} />
        <Path
          d="M12 36c5.5-2.4 10.7-8.6 12.6-17.9.4-2.1-.2-4.2-1.6-4.2-2 0-2.2 4.9-.7 9.2 2.4 6.9 7.6 12.5 11.7 12.2 2-.2 2.7-1.9 1.2-3-3.1-2.3-13.6.3-20.1 3.7-3 1.6-4.5 3.7-3.5 4.7 1.1 1 3.2-.2 5.4-3.1"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDE8E8',
  },
});
