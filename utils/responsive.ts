import { PixelRatio, useWindowDimensions } from 'react-native';

export const RESPONSIVE_REFERENCE_WIDTH = 375;
export const RESPONSIVE_REFERENCE_HEIGHT = 812;
export const MIN_TOUCH_TARGET = 44;

type ResponsiveInput = {
  width: number;
  height: number;
  fontScale?: number;
};

export type ResponsiveMetrics = ReturnType<typeof createResponsiveMetrics>;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return PixelRatio.roundToNearestPixel(value);
}

/**
 * Creates proportional scaling helpers from the current window size.
 *
 * The reference frame is the requested 375pt mobile design width. Scaling is
 * intentionally clamped and moderated so the app adapts to tablets and small
 * phones without looking globally zoomed in or crushed.
 */
export function createResponsiveMetrics({ width, height, fontScale = PixelRatio.getFontScale() }: ResponsiveInput) {
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const isTablet = shortSide >= 600;
  const isSmallPhone = shortSide <= 360;
  const isLargePhone = shortSide >= 412 && shortSide < 600;

  const horizontalRatio = shortSide / RESPONSIVE_REFERENCE_WIDTH;
  const verticalRatio = longSide / RESPONSIVE_REFERENCE_HEIGHT;
  const maxScale = isTablet ? 1.34 : isLargePhone ? 1.16 : 1.08;
  const maxVerticalScale = isTablet ? 1.28 : 1.18;
  const minScale = isSmallPhone ? 0.84 : 0.9;

  const scale = (size: number) => round(size * clamp(horizontalRatio, minScale, maxScale));
  const verticalScale = (size: number) => round(size * clamp(verticalRatio, 0.86, maxVerticalScale));
  const moderateScale = (size: number, factor = 0.5) => {
    const scaled = scale(size);
    return round(size + (scaled - size) * factor);
  };
  const moderateVerticalScale = (size: number, factor = 0.5) => {
    const scaled = verticalScale(size);
    return round(size + (scaled - size) * factor);
  };
  const font = (size: number, factor = 0.35) => moderateScale(size, factor);
  const lineHeight = (size: number, factor = 0.35) => round(font(size, factor) * 1.42);
  const radius = (size: number) => moderateScale(size, 0.45);
  const touch = (size = MIN_TOUCH_TARGET) => Math.max(MIN_TOUCH_TARGET, moderateScale(size, 0.35));
  const icon = (size: number) => moderateScale(size, 0.4);

  return {
    width,
    height,
    shortSide,
    longSide,
    isTablet,
    isSmallPhone,
    isLargePhone,
    isLandscape: width > height,
    systemFontScale: fontScale,
    scale,
    verticalScale,
    moderateScale,
    moderateVerticalScale,
    font,
    lineHeight,
    radius,
    touch,
    icon,
  };
}

export function useResponsiveMetrics() {
  const { width, height } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  return createResponsiveMetrics({ width, height, fontScale });
}
