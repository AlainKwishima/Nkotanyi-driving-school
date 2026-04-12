import type { EdgeInsets } from 'react-native-safe-area-context';

/** Phone-sized column cap (design reference ~390pt wide). */
export const PHONE_COLUMN_MAX = 430;

/** Readable max width on tablets / large windows (centered column). */
export const TABLET_COLUMN_MAX = 800;

export const TABLET_SHORT_SIDE_BREAKPOINT = 600;

export function computeContentMaxWidth(width: number, height: number, insets: EdgeInsets): number {
  const avail = width - insets.left - insets.right;
  const shortSide = Math.min(width, height);
  if (shortSide >= TABLET_SHORT_SIDE_BREAKPOINT) {
    return Math.min(avail * 0.96, TABLET_COLUMN_MAX);
  }
  return Math.min(avail, PHONE_COLUMN_MAX);
}

/** Bottom padding for scroll areas above the floating tab bar + home indicator (matches BottomNavBar chrome). */
export function scrollBottomPaddingWithTabs(insetsBottom: number, tabChromeHeight = 100, extra = 12): number {
  return tabChromeHeight + extra + Math.max(insetsBottom, 0);
}
