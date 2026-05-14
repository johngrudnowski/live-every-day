import { colors } from './colors';
import { radii } from './radii';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { fontFamilies, fontWeights, typography } from './typography';

export const ledTheme = {
  colors,
  spacing,
  radii,
  typography,
  fontFamilies,
  fontWeights,
  shadows,
} as const;

export type LedTheme = typeof ledTheme;
