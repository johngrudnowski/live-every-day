export const fontFamilies = {
  bodyRegular: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  displayExtraLight: 'Raleway_200ExtraLight',
  displayLight: 'Raleway_300Light',
} as const;

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

export const typography = {
  displayLarge: {
    fontFamily: fontFamilies.displayExtraLight,
    fontSize: 32,
    lineHeight: 40,
  },
  displayMedium: {
    fontFamily: fontFamilies.displayLight,
    fontSize: 26,
    lineHeight: 32,
  },
  title: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
  },
  bodySmall: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  chip: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
} as const;

export type TypographyToken = keyof typeof typography;
