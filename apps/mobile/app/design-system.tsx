import {
  AppScreen,
  BrandLogo,
  CardOption,
  ChipGroup,
  LedText,
  LogoMark,
  PrimaryButton,
  ProgressBar,
  Wordmark,
  colors,
  radii,
  spacing,
} from '@led/design-system';
import { AnimatedLogoMark } from '@/features/launch/components/AnimatedLogoMark';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const chipOptions = [
  { label: 'Fatigue', value: 'fatigue' },
  { label: 'Night sweats', value: 'night-sweats' },
  { label: 'Brain fog', value: 'brain-fog' },
  { label: 'Bone pain', value: 'bone-pain' },
] as const;

const palette = [
  'midnight',
  'predawn',
  'sunrise',
  'morning',
  'midday',
  'sunset',
  'canvas',
  'surface',
  'border',
  'flagHigh',
  'flagOk',
] as const;

export default function DesignSystemScreen() {
  const [selectedCard, setSelectedCard] = useState('mpn');
  const [selectedChips, setSelectedChips] = useState<string[]>(['fatigue']);
  const [progress, setProgress] = useState(4);

  return (
    <AppScreen scroll contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <BrandLogo inverse />
        <LedText variant="displayMedium" color="canvas">
          Design system preview
        </LedText>
        <LedText variant="body" color="afternoon">
          Tokens and primitives extracted from the prototype for Expo and React Native.
        </LedText>
      </View>

      <Section eyebrow="Brand" title="Logo primitives">
        <View style={styles.logoRow}>
          <LogoMark size={64} />
          <Wordmark />
        </View>
        <View style={styles.loadingPreview}>
          <AnimatedLogoMark />
          <LedText variant="bodySmall" color="textMid" align="center">
            Loading mark
          </LedText>
        </View>
      </Section>

      <Section eyebrow="Color" title="Palette">
        <View style={styles.paletteGrid}>
          {palette.map((name) => (
            <View key={name} style={styles.swatchWrap}>
              <View style={[styles.swatch, { backgroundColor: colors[name] }]} />
              <LedText variant="bodySmall" color="textMid">
                {name}
              </LedText>
            </View>
          ))}
        </View>
      </Section>

      <Section eyebrow="Type" title="Typography">
        <LedText variant="displayLarge">Display large</LedText>
        <LedText variant="displayMedium">Display medium</LedText>
        <LedText variant="title">Title text</LedText>
        <LedText variant="subtitle">Subtitle text</LedText>
        <LedText variant="body" color="textMid">
          Body copy carries longer patient-facing context with a softer reading rhythm.
        </LedText>
        <LedText variant="label" color="predawn">
          Section label
        </LedText>
      </Section>

      <Section eyebrow="Controls" title="Buttons">
        <View style={styles.buttonStack}>
          <PrimaryButton label="Continue" fullWidth />
          <PrimaryButton label="Save draft" variant="secondary" fullWidth />
          <PrimaryButton label="Dark action" variant="dark" fullWidth />
        </View>
      </Section>

      <Section eyebrow="Choices" title="Card options">
        <View style={styles.stack}>
          <CardOption
            title="MPNs"
            subtitle="ET, PV, or Myelofibrosis"
            selected={selectedCard === 'mpn'}
            onPress={() => setSelectedCard('mpn')}
          />
          <CardOption
            title="CLL"
            subtitle="Watch and wait or active surveillance"
            selected={selectedCard === 'cll'}
            onPress={() => setSelectedCard('cll')}
          />
          <CardOption
            title="Major clotting event"
            subtitle="Past or present"
            selectionVariant="checkbox"
            selected={selectedCard === 'event'}
            onPress={() => setSelectedCard('event')}
          />
        </View>
      </Section>

      <Section eyebrow="Choices" title="Chips">
        <ChipGroup
          multiple
          options={[...chipOptions]}
          value={selectedChips}
          onChange={(nextValue) =>
            setSelectedChips(Array.isArray(nextValue) ? nextValue : [nextValue])
          }
        />
      </Section>

      <Section eyebrow="Progress" title="Progress bar">
        <View style={styles.progressHeader}>
          <LedText variant="bodySmall" color="textMid">
            Step {progress} of 7
          </LedText>
          <PrimaryButton
            label="Advance"
            onPress={() => setProgress((value) => (value === 7 ? 1 : value + 1))}
          />
        </View>
        <ProgressBar value={progress} max={7} />
      </Section>
    </AppScreen>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <LedText variant="label" color="predawn">
        {eyebrow}
      </LedText>
      <LedText variant="title">{title}</LedText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    gap: spacing.lg,
    borderRadius: radii.xxl,
    backgroundColor: colors.midnight,
    padding: spacing.xl,
  },
  section: {
    gap: spacing.xs,
  },
  sectionBody: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingPreview: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.canvas,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  swatchWrap: {
    width: 86,
    gap: spacing.xs,
  },
  swatch: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
  },
  buttonStack: {
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
