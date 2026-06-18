import { Platform } from 'react-native';

export const colors = {
  brand: '#315FAE',
  brandStrong: '#214986',
  brandSoft: '#EAF1FC',
  canvas: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F6',
  ink: '#172238',
  inkMuted: '#526078',
  inkSoft: '#7A879A',
  line: '#DDE2EA',
  success: '#247A55',
  successSoft: '#E8F3ED',
  danger: '#B54747',
  dangerSoft: '#F8EAEA',
  white: '#FFFFFF',
  black: '#000000',
  providerMtn: '#FFCC00',
  providerAirtel: '#E3242B',
  // Compatibility aliases keep older screens on the reduced semantic palette
  // while their layouts are migrated incrementally.
  amber: '#315FAE',
  amberSoft: '#EAF1FC',
  green: '#247A55',
  greenSoft: '#E8F3ED',
  red: '#B54747',
  redSoft: '#F8EAEA',
  brandMist: '#EAF1FC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  sheet: 0,
  pill: 999,
} as const;

export const typography = {
  caption: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  body: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 21,
  },
  bodyStrong: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    lineHeight: 23,
  },
  screenTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
  },
  heading: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.25,
  },
  result: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  eyebrow: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    lineHeight: 23,
  },
  display: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
} as const;

export const shadows = {
  card: {},
  floating: Platform.select({
    ios: {
      shadowColor: '#172238',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
    default: {
      elevation: 8,
      shadowColor: '#172238',
    },
  }),
} as const;
