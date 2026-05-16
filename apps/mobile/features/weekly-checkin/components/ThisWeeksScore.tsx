import { LedText, colors, radii, spacing } from '@led/design-system';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { WeeklyCheckin } from '../api/weekly-checkin-queries';
import {
  formatWeeklyCheckinBurdenPercent,
  formatWeeklyCheckinRawSumLabel,
  getWeeklyCheckinScoreColor,
} from '../lib/weeklyCheckinScorePresentation';
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
  const scoreDeltaPercentPoints = useMemo(() => {
    if (!previousCheckin) {
      return null;
    }

    const current = checkin.score.percent;
    const previous = previousCheckin.score.percent;
    return current - previous;
  }, [checkin.score.percent, previousCheckin]);
  const chartPoints = useMemo(() => getChartPoints(checkin, history), [checkin, history]);
  const scorePercent = checkin.score.percent;
  const scoreColor = getWeeklyCheckinScoreColor(scorePercent);

  return (
    <View style={styles.card}>
      <LedText variant="label" color="predawn" style={styles.label}>
        This week&apos;s score
      </LedText>
      <View style={styles.scoreRow}>
        <View style={styles.scoreValueWrap}>
          <LedText variant="displayMedium" style={[styles.scoreValue, { color: scoreColor }]}>
            {formatWeeklyCheckinBurdenPercent(checkin.score.percent)}
          </LedText>
          <LedText variant="bodySmall" color="predawn">
            {formatWeeklyCheckinRawSumLabel(checkin.score.total, checkin.score.max)}
          </LedText>
          {scoreDeltaPercentPoints !== null ? (
            <LedText
              variant="bodySmall"
              style={
                scoreDeltaPercentPoints > 0
                  ? styles.scoreDeltaWorse
                  : scoreDeltaPercentPoints < 0
                    ? styles.scoreDeltaBetter
                    : styles.scoreDeltaSame
              }
            >
              {scoreDeltaPercentPoints > 0
                ? `+${scoreDeltaPercentPoints} pts vs last week`
                : scoreDeltaPercentPoints < 0
                  ? `−${Math.abs(scoreDeltaPercentPoints)} pts vs last week`
                  : 'Same vs last week'}
            </LedText>
          ) : null}
        </View>
        <SymptomBarChart points={chartPoints} />
      </View>
    </View>
  );
}

function getChartPoints(
  checkin: WeeklyCheckin,
  history: WeeklyCheckin[],
): SymptomBarChartPoint[] {
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
      percent: item.score.percent,
      total: item.score.total,
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
    minWidth: 120,
    gap: spacing.xxs,
  },
  scoreValue: {
    color: colors.flagHigh,
    fontFamily: 'Raleway_300Light',
    fontSize: 48,
    lineHeight: 52,
  },
  scoreDeltaWorse: {
    color: colors.flagHigh,
  },
  scoreDeltaBetter: {
    color: colors.flagOk,
  },
  scoreDeltaSame: {
    color: colors.predawn,
  },
});
