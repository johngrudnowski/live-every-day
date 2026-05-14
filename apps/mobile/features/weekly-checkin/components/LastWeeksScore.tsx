import { StyleSheet, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';
import type { WeeklyCheckin } from '../api/weekly-checkin-queries';

export function LastWeeksScore({ checkin }: { checkin: WeeklyCheckin }) {
  const scorePercent = Math.max(0, Math.min(100, Math.round((checkin.score.total / checkin.score.max) * 100)));

  return (
    <View style={styles.card}>
      <LedText variant="label" color="predawn">
        Last week&apos;s score
      </LedText>
      <View style={styles.row}>
        <LedText variant="label" color="predawn">
          {formatScore(checkin.score.total)} out of {checkin.score.max}
        </LedText>
        <View style={styles.sparkline}>
          <View style={[styles.sparkBar, { height: '40%' }]} />
          <View style={[styles.sparkBar, { height: '48%' }]} />
          <View style={[styles.sparkBar, { height: '42%' }]} />
          <View style={[styles.sparkBar, styles.sparkBarMid, { height: '62%' }]} />
          <View style={[styles.sparkBar, styles.sparkBarHigh, { height: `${scorePercent}%` }]} />
        </View>
      </View>
      <LedText variant="bodySmall" color="predawn">
        Submitted {formatDate(checkin.weekStartDate)}
      </LedText>
    </View>
  );
}

function formatScore(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`));
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sparkline: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  sparkBar: {
    width: 7,
    borderRadius: radii.xs,
    backgroundColor: 'rgba(106, 176, 200, 0.35)',
  },
  sparkBarMid: {
    backgroundColor: 'rgba(200, 152, 88, 0.6)',
  },
  sparkBarHigh: {
    backgroundColor: colors.sunset,
  },
});
