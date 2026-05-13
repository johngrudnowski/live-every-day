export const radii = {
  none: 0,
  xs: 3,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  pill: 999,
  phone: 48,
} as const;

export type RadiusToken = keyof typeof radii;
