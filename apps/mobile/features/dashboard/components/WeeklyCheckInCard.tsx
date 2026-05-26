import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LedText, PrimaryButton, colors, radii, shadows, spacing } from '@led/design-system';
import { useWeeklyCheckinSummaryQuery } from '@/features/weekly-checkin/api/weekly-checkin-queries';
import { formatWeeklyCheckinBurdenWithRawParen } from '@/features/weekly-checkin/lib/weeklyCheckinScorePresentation';
import { routeToWeeklyCheckin } from '@/features/weekly-checkin/lib/weeklyCheckinRoutes';

export function WeeklyCheckInCard() {
  const summaryQuery = useWeeklyCheckinSummaryQuery();
  const summary = summaryQuery.data;
  const previous = summary?.previousWeekCheckin;
  const completed = summary?.hasCompletedCurrentWeek;

  return (
    <View style={styles.card}>
      <LedText variant="label" style={styles.eyebrow}>
        This week
      </LedText>
      <LedText variant="title" style={styles.title}>
        Weekly check-in
      </LedText>
      <LedText variant="bodySmall" style={styles.copy}>
        {completed
          ? 'This week is saved. You can review your answers anytime.'
          : 'Daily or weekly. The foundation of everything.'}
      </LedText>

      {previous ? (
        <View style={styles.lastWeekPanel}>
          <LedText variant="label" style={styles.lastWeekLabel}>
            Last week
          </LedText>
          <View style={styles.symptomList}>
            <View style={styles.symptomPill}>
              <LedText variant="bodySmall" style={styles.symptomText}>
                {formatWeeklyCheckinBurdenWithRawParen(
                  previous.score.percent,
                  previous.score.total,
                  previous.score.max,
                )}
              </LedText>
            </View>
          </View>
        </View>
      ) : null}

      <PrimaryButton
        label={completed ? 'View saved check-in' : 'Start this week'}
        variant="secondary"
        fullWidth
        style={styles.button}
        onPress={() => {
          if (summary) {
            routeToWeeklyCheckin(summary);
            return;
          }

          router.push('/check-in');
        }}
      />
      <PrimaryButton
        label="View history"
        variant="secondary"
        fullWidth
        style={styles.button}
        onPress={() => router.push('/check-in/history')}
      />
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
