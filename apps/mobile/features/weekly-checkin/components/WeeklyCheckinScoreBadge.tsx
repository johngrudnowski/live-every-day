import { StyleSheet, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';
import {
  formatWeeklyCheckinBurdenPercent,
  formatWeeklyCheckinRawSumLabel,
  getWeeklyCheckinScoreColor,
} from '../lib/weeklyCheckinScorePresentation';

type WeeklyCheckinScoreBadgeProps = {
  percent: number;
  max: number;
  total: number;
  compact?: boolean;
};

export function WeeklyCheckinScoreBadge({
  percent,
  max,
  total,
  compact = false,
}: WeeklyCheckinScoreBadgeProps) {
  const scoreColor = getWeeklyCheckinScoreColor(percent);
  const burdenPercentLabel = formatWeeklyCheckinBurdenPercent(percent);

  return (
    <View
      style={[
        styles.badge,
        compact ? styles.badgeCompact : styles.badgeExpanded,
        {
          borderColor: scoreColor,
          backgroundColor: getBadgeBackground(percent),
        },
      ]}
    >
      {compact ? (
        <LedText variant="subtitle" style={[styles.score, { color: scoreColor }]}>
          {burdenPercentLabel}
        </LedText>
      ) : (
        <View style={styles.badgeStack}>
          <LedText variant="title" style={[styles.score, { color: scoreColor }]}>
            {burdenPercentLabel}
          </LedText>
          <LedText variant="bodySmall" color="predawn" align="center">
            {formatWeeklyCheckinRawSumLabel(total, max)}
          </LedText>
        </View>
      )}
    </View>
  );
}

function getBadgeBackground(scorePercent: number) {
  if (scorePercent >= 80) {
    return colors.flagHighBg;
  }

  if (scorePercent >= 60) {
    return '#FFF3DD';
  }

  return colors.selectedBg;
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeExpanded: {
    minWidth: 88,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeStack: {
    alignItems: 'center',
    gap: 2,
  },
  badgeCompact: {
    minWidth: 56,
    minHeight: 40,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    lineHeight: 28,
  },
});
