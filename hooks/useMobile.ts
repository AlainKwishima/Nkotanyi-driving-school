import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function useMobile() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);

    const horizontalRatio = shortSide / BASE_WIDTH;
    const verticalRatio = longSide / BASE_HEIGHT;

    const scale = (size: number) => Math.round(size * clamp(horizontalRatio, 0.86, 1.18));
    const verticalScale = (size: number) => Math.round(size * clamp(verticalRatio, 0.9, 1.16));
    const moderateScale = (size: number, factor = 0.5) => {
      const scaled = scale(size);
      return Math.round(size + (scaled - size) * factor);
    };
    const fontScale = (size: number) => moderateScale(size, 0.4);

    const contentWidth = clamp(shortSide, 320, 430);
    const sideGutter = Math.max(14, Math.round((shortSide - contentWidth) / 2));
    const isSmallDevice = shortSide <= 360;
    const isLargeDevice = shortSide >= 412;

    return {
      width,
      height,
      shortSide,
      longSide,
      contentWidth,
      sideGutter,
      isSmallDevice,
      isLargeDevice,
      scale,
      verticalScale,
      moderateScale,
      fontScale,
    };
  }, [height, width]);
}
