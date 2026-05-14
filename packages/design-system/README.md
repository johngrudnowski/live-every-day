# Live Every Day Design System

This package is the React Native and Expo design foundation for Live Every Day. It captures the prototype's visual language as reusable tokens and small primitives, without converting prototype screens into app flows.

## Why This Lives In `packages`

The mobile app is the first consumer, but these tokens and primitives are shared product language. Keeping them in `packages/design-system` gives us one source of truth for colors, typography, spacing, brand marks, and common controls as the app grows.

Expo supports workspace packages in monorepos, and SDK 55 automatically handles most Metro monorepo resolution. The mobile app imports this package with `@led/design-system`.

## Structure

```txt
packages/design-system/
  src/
    brand/
      BrandLogo.tsx
      LogoMark.tsx
      Wordmark.tsx
    components/
      AppScreen.tsx
      CardOption.tsx
      Chip.tsx
      ChipGroup.tsx
      LedText.tsx
      PrimaryButton.tsx
      ProgressBar.tsx
      YearStepper.tsx
    theme/
      colors.ts
      radii.ts
      shadows.ts
      spacing.ts
      typography.ts
      theme.ts
```

## Design Tokens

Tokens were extracted from `public/led_simulation.html`:

- `colors`: dawn-to-dusk palette, surfaces, borders, text, and health status colors.
- `spacing`: small numeric scale for consistent layout rhythm.
- `radii`: common corner radii for cards, controls, pills, and framed previews.
- `typography`: React Native font styles using Expo Google Font family names.
- `shadows`: reusable elevation treatments for cards and phone-like previews.

Use tokens inside `StyleSheet.create` when a primitive is not enough:

```tsx
import { colors, spacing } from '@led/design-system';
import { StyleSheet, View } from 'react-native';

export function ExampleBlock() {
  return <View style={styles.block} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
});
```

## Components

These components are intentionally small:

- `AppScreen`: base screen surface with optional scrolling and padding.
- `LedText`: text primitive tied to typography and color tokens.
- `PrimaryButton`: pressable button with LED variants and accessibility role.
- `CardOption`: selectable card for radio or checkbox-style choices.
- `Chip` and `ChipGroup`: compact selection controls.
- `ProgressBar`: accessible horizontal progress indicator.
- `YearStepper`: bounded year increment/decrement control.
- `LogoMark`, `Wordmark`, `BrandLogo`: React Native brand primitives based on `assets/logos`.

Example:

```tsx
import { AppScreen, CardOption, LedText, PrimaryButton } from '@led/design-system';

export function ExampleComposition() {
  return (
    <AppScreen>
      <LedText variant="displayMedium">Live Every Day</LedText>
      <CardOption title="MPNs" subtitle="ET, PV, or Myelofibrosis" selected />
      <PrimaryButton label="Continue" fullWidth />
    </AppScreen>
  );
}
```

## Fonts

The design system expects these Expo Google Font family names:

- `DMSans_400Regular`
- `DMSans_500Medium`
- `DMSans_600SemiBold`
- `DMSans_700Bold`
- `Raleway_200ExtraLight`
- `Raleway_300Light`

The mobile app embeds them with the `expo-font` config plugin in `apps/mobile/app.config.ts`. This follows Expo's recommended native-build path for Android and iOS instead of loading brand fonts at runtime on every launch.

## SVGs And Logos

React Native does not render raw SVG files the same way the web does. The logo mark is implemented with `react-native-svg`, which Expo supports directly. The source SVG files remain in `assets/logos` as brand assets, while the RN components live in `src/brand`.

## Working Rules

- Keep primitives small and composable.
- Do not put onboarding flow logic, step config, or screen state in this package yet.
- Prefer tokens over one-off values.
- Prefer `StyleSheet.create` for component styles because React Native gives stronger type checking there.
- Add new components only when repeated UI patterns emerge from real screens.
- Keep native dependencies declared by the consuming app to avoid duplicate native modules.

## References Used

- Expo monorepo guidance: https://docs.expo.dev/guides/monorepos/
- Expo font guidance: https://docs.expo.dev/versions/latest/sdk/font/
- Expo SVG guidance: https://docs.expo.dev/versions/latest/sdk/svg/
- React Native StyleSheet guidance: https://reactnative.dev/docs/stylesheet.html
- React Native accessibility roles: https://reactnative.dev/docs/accessibility
