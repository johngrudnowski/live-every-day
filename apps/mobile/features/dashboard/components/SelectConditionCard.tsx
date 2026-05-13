import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LedText, PrimaryButton, colors, radii, shadows, spacing } from '@led/design-system';

export function SelectConditionCard() {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <LedText variant="label" color="predawn">
          Getting started
        </LedText>
        <LedText variant="title">Select your condition to get started</LedText>
        <LedText variant="body" color="textMid">
          We will tailor check-ins, labs, research, and reminders around what you are managing.
        </LedText>
      </View>
      <PrimaryButton label="Choose condition" onPress={() => router.push('/conditions')} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    padding: spacing.xl,
    ...shadows.card,
  },
  copy: {
    gap: spacing.sm,
  },
});
