import { StyleSheet, View } from 'react-native';
import { LedText, PrimaryButton, colors, radii, shadows, spacing } from '@led/design-system';

const lastWeekSymptoms = ['Fatigue 8/10', 'Night sweats 5/10', 'Brain fog 6/10'];

export function WeeklyCheckInCard() {
  return (
    <View style={styles.card}>
      <LedText variant="label" style={styles.eyebrow}>
        This week
      </LedText>
      <LedText variant="title" style={styles.title}>
        Weekly check-in
      </LedText>
      <LedText variant="bodySmall" style={styles.copy}>
        Daily or weekly. The foundation of everything.
      </LedText>

      <View style={styles.lastWeekPanel}>
        <LedText variant="label" style={styles.lastWeekLabel}>
          Last week
        </LedText>
        <View style={styles.symptomList}>
          {lastWeekSymptoms.map((symptom) => (
            <View key={symptom} style={styles.symptomPill}>
              <LedText variant="bodySmall" style={styles.symptomText}>
                {symptom}
              </LedText>
            </View>
          ))}
        </View>
      </View>

      <PrimaryButton label="Start this week's check-in" variant="secondary" fullWidth style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.midday,
    padding: spacing.xl,
    ...shadows.card,
  },
  eyebrow: {
    color: 'rgba(26, 40, 48, 0.6)',
  },
  title: {
    color: colors.midnight,
  },
  copy: {
    color: 'rgba(26, 40, 48, 0.68)',
  },
  lastWeekPanel: {
    gap: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    padding: spacing.md,
  },
  lastWeekLabel: {
    color: 'rgba(26, 40, 48, 0.58)',
  },
  symptomList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  symptomPill: {
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  symptomText: {
    color: colors.midnight,
    fontFamily: 'DMSans_500Medium',
  },
  button: {
    borderColor: colors.white,
  },
});
