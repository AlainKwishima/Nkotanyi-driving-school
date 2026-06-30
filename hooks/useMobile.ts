import { useMemo } from 'react';
import { PixelRatio, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeContentMaxWidth } from '../utils/layoutMetrics';
import { createResponsiveMetrics } from '../utils/responsive';

export function useMobile() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const systemFontScale = PixelRatio.getFontScale();

  return useMemo(() => {
    const metrics = createResponsiveMetrics({ width, height, fontScale: systemFontScale });

    const contentWidth = computeContentMaxWidth(width, height, insets);
    const sideGutter = Math.max(insets.left, insets.right, 0);

    return {
      ...metrics,
      width,
      height,
      contentWidth,
      sideGutter,
      isSmallDevice: metrics.isSmallPhone,
      isLargeDevice: metrics.isLargePhone,
      safeInsets: insets,
      fontScale: metrics.font,
      lineScale: metrics.lineHeight,
    };
  }, [height, width, insets, systemFontScale]);
}
