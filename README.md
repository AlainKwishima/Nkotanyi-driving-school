# Nkotanyi Driving School

Mobile learning app for driving school students, built with Expo + React Native.

## Overview

Nkotanyi Driving School is a mobile-first learning app that helps users prepare for driving tests through:

- Guided onboarding and authentication
- Exam instructions + exam simulation flow
- Reading modules and road-sign references
- Video lessons
- Performance tracking and review
- Subscription and payment gating

## Features

- Language selection and authentication flow
- Home dashboard with quick actions
- Exam flow with instructions, gating modal, timer, and question navigation
- Reading, road signs, video course, and performance screens
- Subscription, payment, and profile flows
- Reusable bottom navigation and header menu components

## Tech Stack

- Expo
- React Native
- TypeScript
- React Navigation

## Prerequisites

- Node.js 18+
- npm 9+
- Expo Go (for physical device testing)

## Run Locally

```bash
npm install
npx expo start
```

Then:

- Press `w` to open web preview
- Scan the QR code with Expo Go for mobile testing

## Project Structure

```text
assets/         Static images/icons/reference screens
components/     Reusable UI building blocks (buttons, nav, menu, inputs)
context/        App-level state (auth/flow/subscription/modal)
hooks/          Reusable hooks (mobile scaling/utilities)
navigation/     Route type definitions
screens/        Feature screens (auth, home, exam, learning, payment, etc.)
App.tsx         Navigation container + route registration
```

## Core User Flow

1. Splash -> Language Selection
2. Login / Create Account
3. Home
4. Exam entry:
   - Tap `Exam` -> `Exam Instructions` screen
   - Tap `Start Exam` -> gate modal
   - Continue to exam (or subscription if required)
5. After first free exam, subscription is required for further exams

## State Management

`context/AppFlowContext.tsx` persists flow state with AsyncStorage:

- `hasChosenLanguage`
- `isSignedIn`
- `hasUsedFreeTrial`
- `hasSubscription`

`context/GateModalContext.tsx` controls animated gating popups used across tabs/screens.

## Scripts

```bash
npm run start      # Expo dev server
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator (macOS only)
npm run web        # Run web build
```

## Design Notes

- Implemented from provided Figma/exported reference screens
- Shared header and bottom navigation patterns for visual consistency
- Pixel-tight adjustments applied to typography, spacing, and component sizing

## Troubleshooting

- If `localhost` does not load, ensure Expo dev server is running and port is not occupied
- If QR scanning fails, switch Expo connection mode (`LAN` / `Tunnel`)
- If UI changes do not appear, reload (`r`) or clear cache:

```bash
npx expo start -c
```
