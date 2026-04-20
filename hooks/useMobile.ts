import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeContentMaxWidth } from '../utils/layoutMetrics';

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function useMobile() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);

    const horizontalRatio = shortSide / BASE_WIDTH;
    const verticalRatio = longSide / BASE_HEIGHT;

    const scale = (size: number) => Math.round(size * clamp(horizontalRatio, 0.82, 1.22));
    const verticalScale = (size: number) => Math.round(size * clamp(verticalRatio, 0.88, 1.2));
    const moderateScale = (size: number, factor = 0.5) => {
      const scaled = scale(size);
      return Math.round(size + (scaled - size) * factor);
    };
    const fontScale = (size: number) => moderateScale(size, 0.4);

    const contentWidth = computeContentMaxWidth(width, height, insets);
    const sideGutter = Math.max(insets.left, insets.right, 0);
    const isSmallDevice = shortSide <= 360;
    const isLargeDevice = shortSide >= 412;
    const isTablet = shortSide >= 600;

    return {
      width,
      height,
      shortSide,
      longSide,
      contentWidth,
      sideGutter,
      isSmallDevice,
      isLargeDevice,
      isTablet,
      safeInsets: insets,
      scale,
      verticalScale,
      moderateScale,
      fontScale,
    };
  }, [height, width, insets]);
}
