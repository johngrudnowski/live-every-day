import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';
import type { WeeklyCheckin } from '../api/weekly-checkin-queries';
import { SymptomBarChart, type SymptomBarChartPoint } from './SymptomBarChart';

export function ThisWeeksScore({
  checkin,
  previousCheckin,
  history,
}: {
  checkin: WeeklyCheckin;
  previousCheckin?: WeeklyCheckin | null;
  history: WeeklyCheckin[];
}) {
  const scoreDelta = useMemo(
    () => (previousCheckin ? checkin.score.total - previousCheckin.score.total : null),
    [checkin.score.total, previousCheckin],
  );
  const chartPoints = useMemo(() => getChartPoints(checkin, history), [checkin, history]);

  return (
    <View style={styles.card}>
      <LedText variant="label" color="predawn" style={styles.label}>
        This week&apos;s score
      </LedText>
      <View style={styles.scoreRow}>
        <View style={styles.scoreValueWrap}>
          <LedText variant="displayMedium" style={styles.scoreValue}>
            {checkin.score.total}
          </LedText>
          {scoreDelta !== null ? (
            <LedText
              variant="bodySmall"
              style={scoreDelta >= 0 ? styles.scoreDeltaUp : styles.scoreDeltaDown}
            >
              {scoreDelta >= 0 ? '↑' : '↓'} {Math.abs(scoreDelta)} from last week
            </LedText>
          ) : (
            <LedText variant="bodySmall" color="predawn">
              out of {checkin.score.max}
            </LedText>
          )}
        </View>
        <SymptomBarChart points={chartPoints} />
      </View>
    </View>
  );
}

function getChartPoints(checkin: WeeklyCheckin, history: WeeklyCheckin[]): SymptomBarChartPoint[] {
  const checkinsByWeek = new Map<string, WeeklyCheckin>();

  for (const item of history) {
    checkinsByWeek.set(item.weekStartDate, item);
  }

  checkinsByWeek.set(checkin.weekStartDate, checkin);

  return [...checkinsByWeek.values()]
    .sort((left, right) => left.weekStartDate.localeCompare(right.weekStartDate))
    .slice(-8)
    .map((item) => ({
      id: item.id,
      weekStartDate: item.weekStartDate,
      value: item.score.total,
      max: item.score.max,
    }));
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  label: {
    alignSelf: 'stretch',
  },
  scoreRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  scoreValueWrap: {
    flexShrink: 0,
    minWidth: 104,
  },
  scoreValue: {
    color: colors.flagHigh,
    fontFamily: 'Raleway_300Light',
    fontSize: 48,
    lineHeight: 52,
  },
  scoreDeltaUp: {
    color: colors.flagHigh,
  },
  scoreDeltaDown: {
    color: colors.flagOk,
  },
});
