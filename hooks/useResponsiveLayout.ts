import { useMemo } from 'react';
import { PixelRatio, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeContentMaxWidth, scrollBottomPaddingWithTabs } from '../utils/layoutMetrics';
import { createResponsiveMetrics } from '../utils/responsive';

/**
 * Window size, safe areas, column width, and font scaling for responsive layouts.
 * Requires `SafeAreaProvider` at the app root.
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const systemFontScale = PixelRatio.getFontScale();

  return useMemo(() => {
    const metrics = createResponsiveMetrics({ width, height, fontScale: systemFontScale });
    const portrait = height >= width;
    const contentMaxWidth = computeContentMaxWidth(width, height, insets);
    const tabScrollBottomPad = scrollBottomPaddingWithTabs(insets.bottom, metrics.verticalScale(118), metrics.verticalScale(14));

    return {
      ...metrics,
      width,
      height,
      portrait,
      isLandscape: !portrait,
      insets,
      contentMaxWidth,
      systemFontScale,
      tabScrollBottomPad,
    };
  }, [width, height, insets, systemFontScale]);
}

/** Merge into root column styles instead of a fixed maxWidth. */
export function useScreenColumnStyle(): {
  width: '100%';
  maxWidth: number;
  alignSelf: 'center';
} {
  const { contentMaxWidth } = useResponsiveLayout();
  return useMemo(() => ({ width: '100%' as const, maxWidth: contentMaxWidth, alignSelf: 'center' as const }), [contentMaxWidth]);
}
