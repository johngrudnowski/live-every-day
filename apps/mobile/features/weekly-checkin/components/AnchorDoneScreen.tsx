import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useSubmitWeeklyCheckinMutation,
  useWeeklyCheckinSummaryQuery,
} from '../api/weekly-checkin-queries';
import { getCurrentAnswers } from '../lib/weeklyCheckinProgress';
import { routeToSaved } from '../lib/weeklyCheckinRoutes';
import { calculateWeeklyCheckinScore } from '../lib/weeklyCheckinScoring';

export function AnchorDoneScreen() {
  const summaryQuery = useWeeklyCheckinSummaryQuery();
  const submitMutation = useSubmitWeeklyCheckinMutation();
  const summary = summaryQuery.data;

  if (summaryQuery.isPending) {
    return <LoadingScreen message="Loading check-in" />;
  }

  if (!summary) {
    return <LoadingScreen message="Opening check-in" />;
  }

  const score = calculateWeeklyCheckinScore(
    summary.activeDefinition,
    summary.currentCheckin?.answers ?? {},
  );
  const activeDefinition = summary.activeDefinition;
  const answers = getCurrentAnswers(summary);

  async function handleSkipForNow() {
    await submitMutation.mutateAsync({
      data: {
        definitionId: activeDefinition.id,
        definitionVersion: activeDefinition.version,
        answers,
      },
    });
    routeToSaved(true);
  }

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <LedText variant="subtitle">Check-in</LedText>
          <View style={styles.headerSpacer} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.checkMarkWrap}>
            <LedText style={styles.checkMark}>✓</LedText>
          </View>
          <LedText variant="displayMedium" align="center">
            Anchor done.
          </LedText>
          <LedText variant="body" color="textMid" align="center">
            All 10 MPN-10 questions answered. Want to add more detail this week?
          </LedText>
        </View>

        <View style={styles.detailsCard}>
          <LedText variant="label" color="predawn">
            Going deeper
          </LedText>
          <LedText variant="body" color="textMid">
            22 additional symptoms patients with MPN report — across sleep, cognition, joints, GI, and
            quality of life. Quick three-tap rating: none, some, a lot. Helps the brief and Talk to
            LED get richer over time.
          </LedText>
        </View>

        <View style={styles.scoreRow}>
          <LedText variant="bodySmall" color="predawn">
            Current score
          </LedText>
          <LedText variant="subtitle">
            {score.total} / {score.max}
          </LedText>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Go deeper ->"
            fullWidth
            onPress={() => router.push('/check-in/go-deeper')}
          />
          <PrimaryButton
            label="Skip for now"
            fullWidth
            variant="secondary"
            disabled={submitMutation.isPending}
            onPress={() => void handleSkipForNow()}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkMarkWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.flagOkBg,
  },
  checkMark: {
    color: '#1A6040',
    fontSize: 28,
    lineHeight: 30,
  },
  detailsCard: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
});
