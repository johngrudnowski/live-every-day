import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen, LedText, LogoMark, PrimaryButton, Wordmark, colors, radii, spacing } from '@led/design-system';

export function WelcomeScreen() {
  return (
    <AppScreen scroll contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <LogoMark size={86} />
        <Wordmark size="medium" />
      </View>

      <View style={styles.copyStack}>
        <LedText variant="body" style={styles.storyText}>
          Weekly shifts in how we feel are simply a part of our lives. Those of us with chronic cancer? Noticing those
          shifts carries deeper meaning.
        </LedText>

        <View style={styles.questionBlock}>
          <LedText variant="body" color="textMid" style={styles.questionText}>
            Is my dosage right? Am I getting proper rest? Is my disease progressing?
          </LedText>
        </View>

        <LedText variant="body" style={styles.storyText}>
          Knowing — having the data — is our best way to be our own advocates. Live Every Day was built by a patient,
          for all of us living this every day.
        </LedText>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Get Started" fullWidth onPress={() => router.push('/auth/register')} />
        <PrimaryButton
          label="I already have an account"
          variant="secondary"
          fullWidth
          onPress={() => router.push('/auth/login')}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.md,
  },
  copyStack: {
    gap: spacing.lg,
  },
  storyText: {
    fontSize: 15,
    lineHeight: 26,
  },
  questionBlock: {
    borderLeftWidth: 2,
    borderLeftColor: colors.sunrise,
    borderRadius: radii.xs,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.xs,
  },
  questionText: {
    fontSize: 14,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actions: {
    gap: spacing.sm,
  },
});
