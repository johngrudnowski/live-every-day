import {
  useWeeklyCheckinSummaryQuery,
  type WeeklyCheckin,
} from '@/features/weekly-checkin/api/weekly-checkin-queries';
import {
  SymptomBarChart,
  type SymptomBarChartPoint,
} from '@/features/weekly-checkin/components/SymptomBarChart';
import { LedText, colors, radii, spacing } from '@led/design-system';
import { StyleSheet, View } from 'react-native';
import { SectionHeader } from './SectionHeader';

export function SymptomTrendSection() {
  const summaryQuery = useWeeklyCheckinSummaryQuery();
  const chartPoints = getChartPoints(summaryQuery.data?.recentSubmittedCheckins ?? []);
  const trendLabel = getTrendLabel(chartPoints);

  return (
    <View style={styles.section}>
      <SectionHeader title="Symptom trend - 8 weeks" />
      <View style={styles.card}>
        {chartPoints.length > 0 ? (
          <>
            <View style={styles.chart}>
              <SymptomBarChart height={80} points={chartPoints} />
            </View>
            <View style={styles.footer}>
              <LedText variant="bodySmall" color="predawn">
                {chartPoints.length >= 8 ? '8 wks ago' : `${chartPoints.length} logged weeks`}
              </LedText>
              <LedText variant="bodySmall" style={styles.trendLabel}>
                {trendLabel}
              </LedText>
            </View>
          </>
        ) : (
          <LedText variant="bodySmall" color="predawn" style={styles.emptyText}>
            Complete a weekly check-in to see symptom trends here.
          </LedText>
        )}
      </View>
    </View>
  );
}

function getChartPoints(checkins: WeeklyCheckin[]): SymptomBarChartPoint[] {
  return checkins.slice(-8).map((checkin) => ({
    id: checkin.id,
    weekStartDate: checkin.weekStartDate,
    percent: checkin.score.percent,
    total: checkin.score.total,
    max: checkin.score.max,
  }));
}

function getTrendLabel(points: SymptomBarChartPoint[]) {
  if (points.length < 2) {
    return 'Now';
  }

  const first = points[0];
  const last = points[points.length - 1];
  const firstPercent = first.percent;
  const lastPercent = last.percent;
  const delta = lastPercent - firstPercent;

  if (delta === 0) {
    return 'Now — steady';
  }

  return `Now ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} pts`;
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  chart: {
    height: 80,
    alignSelf: 'stretch',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  trendLabel: {
    color: colors.flagHigh,
    fontFamily: 'DMSans_500Medium',
  },
  emptyText: {
    lineHeight: 18,
  },
});
