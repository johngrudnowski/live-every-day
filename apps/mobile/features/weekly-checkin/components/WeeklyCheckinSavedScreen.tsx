import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { ScreenFooter, screenFooterNavActiveLabel } from '@/components/screen-footer';
import { showAppointmentBriefPlaceholderAlert } from '@/features/dashboard/lib/appointmentBriefPlaceholder';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  useWeeklyCheckinSummaryQuery,
  type WeeklyCheckin,
  type WeeklyCheckinSummary,
} from '../api/weekly-checkin-queries';
import { ThisWeeksScore } from './ThisWeeksScore';

export function WeeklyCheckinSavedScreen() {
  const params = useLocalSearchParams<{ justCompleted?: string }>();
  const summaryQuery = useWeeklyCheckinSummaryQuery();
  const summary = summaryQuery.data;
  const checkin =
    summary?.currentCheckin?.status === 'submitted'
      ? summary.currentCheckin
      : summary?.lastSubmittedCheckin;

  if (summaryQuery.isPending) {
    return <LoadingScreen message="Loading saved check-in" />;
  }

  if (!summary || !checkin) {
    return <LoadingScreen message="No saved check-in yet" />;
  }

  const isJustCompleted = params.justCompleted === '1';

  return (
    <SavedCheckinContent checkin={checkin} isJustCompleted={isJustCompleted} summary={summary} />
  );
}

function SavedCheckinContent({
  checkin,
  isJustCompleted,
  summary,
}: {
  checkin: WeeklyCheckin;
  isJustCompleted: boolean;
  summary: WeeklyCheckinSummary;
}) {
  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={<ScreenHeaderChevronLink label="Back" onPress={() => router.back()} />}
          title={
            <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
              Check-in complete
            </LedText>
          }
        />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {isJustCompleted ? (
            <View style={styles.checkMarkWrap}>
              <LedText style={styles.checkMark}>✓</LedText>
            </View>
          ) : null}
          <LedText variant="bodySmall" color="predawn" align="center">
            {formatCheckinWeekDateRange(checkin.weekStartDate)}
          </LedText>
        </View>

        <ThisWeeksScore
          checkin={checkin}
          previousCheckin={summary.previousWeekCheckin}
          history={summary.recentSubmittedCheckins ?? []}
        />
        <PrimaryButton
          label="View score history"
          variant="secondary"
          fullWidth
          onPress={() => router.push('/check-in/history')}
        />

        <View style={styles.briefCard}>
          <LedText variant="subtitle" color="midday">
            Building your appt brief
          </LedText>
          <LedText variant="bodySmall" color="textMid">
            This check-in is now included in your next appointment summary.
          </LedText>
          <PrimaryButton
            label="Brief"
            variant="secondary"
            fullWidth
            onPress={showAppointmentBriefPlaceholderAlert}
          />
        </View>
      </ScrollView>

      <ScreenFooter activeLabel={screenFooterNavActiveLabel.checkIn} />
    </AppScreen>
  );
}

function formatCheckinWeekDateRange(weekStartDate: string) {
  const start = new Date(`${weekStartDate}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  };

  const startLabel = start.toLocaleDateString('en-US', options);
  const endLabel = end.toLocaleDateString('en-US', options);

  return `${startLabel} – ${endLabel}`;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  content: {
    gap: spacing.xl,
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
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.flagOkBg,
  },
  checkMark: {
    color: '#1A6040',
    fontSize: 28,
    lineHeight: 30,
  },
  briefCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#C8E4F0',
    borderRadius: radii.xl,
    backgroundColor: colors.selectedBg,
    padding: spacing.md,
  },
});
