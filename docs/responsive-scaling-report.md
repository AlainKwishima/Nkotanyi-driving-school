# Responsive Scaling Report

## Summary

Implemented a centralized responsive scaling system based on a 375pt reference width and 812pt reference height. The app now uses shared metrics for proportional spacing, radii, typography, icon sizing, vertical sizing, and minimum touch targets while continuing to respect React Native font accessibility behavior.

## Core Utility

- `utils/responsive.ts`
  - Adds `createResponsiveMetrics` and `useResponsiveMetrics`.
  - Provides `scale`, `verticalScale`, `moderateScale`, `font`, `lineHeight`, `radius`, `icon`, and `touch`.
  - Clamps scaling so small phones do not feel cramped and tablets do not look artificially zoomed.
  - Uses `useWindowDimensions` for orientation-aware sizing.

## Updated Layout Hooks

- `hooks/useMobile.ts`
  - Rebased from 390pt to the new 375pt responsive utility.
  - Preserves existing API names such as `fontScale` while routing them through the centralized scaler.

- `hooks/useResponsiveLayout.ts`
  - Reuses the centralized scaler.
  - Scales bottom tab scroll padding.
  - Centers content on larger screens through `useScreenColumnStyle`.

## Shared Components Updated

- `components/AppHeader.tsx`
- `components/AuthButton.tsx`
- `components/AuthInputField.tsx`
- `components/BottomNavBar.tsx`
- `components/HeaderMenu.tsx`
- `components/LanguageOptionCard.tsx`
- `components/OfflineBanner.tsx`
- `components/PdfDocumentIcon.tsx`
- `components/PrimaryButton.tsx`
- `components/ProgressRing.tsx`
- `components/ReadSectionTabs.tsx`
- `components/RequestStates.tsx`
- `components/ScreenColumn.tsx`
- `components/ScreenHeader.tsx`
- `components/SectionHeading.tsx`
- `components/SignOutConfirmationModal.tsx`
- `components/VideoCourseItemCard.tsx`

## Screen-Level Update

- `screens/ReferenceImageScreen.tsx`
  - Removed static `Dimensions.get` usage.
  - Uses responsive window metrics so reference previews update on orientation changes.

## Improvements

- Shared UI chrome now scales across small phones, large phones, tablets, portrait, and landscape.
- Touch targets are guarded at 44pt or greater for primary buttons, inputs, nav buttons, menus, and modal actions.
- Typography scales proportionally while preserving React Native accessibility font scaling.
- Tablet layouts now use a centered content column instead of stretching every screen edge to edge.
- Static `Dimensions.get` usage was removed from TypeScript/TSX code paths.

## Verification

- `npx.cmd tsc --noEmit`
- `npx.cmd expo install --check`
- `git diff --check`
- `rg "Dimensions\\.get" -n --glob "*.ts" --glob "*.tsx"`
