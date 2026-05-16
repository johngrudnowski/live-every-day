import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { radii } from '@led/design-system';
import {
  formatWeeklyCheckinBurdenWithRawParen,
  getWeeklyCheckinBarColor,
  getWeeklyCheckinScoreOpacity,
} from '../lib/weeklyCheckinScorePresentation';

export type SymptomBarChartPoint = {
  id: string;
  weekStartDate: string;
  percent: number;
  total: number;
  max: number;
};

const maxVisiblePoints = 8;
const defaultChartHeight = 48;

export function SymptomBarChart({
  height = defaultChartHeight,
  points,
}: {
  height?: number;
  points: SymptomBarChartPoint[];
}) {
  const visiblePoints = useMemo(() => points.slice(-maxVisiblePoints), [points]);
  const chartData = useMemo(
    () =>
      visiblePoints.map((point) => {
        return {
          normalizedValue: point.percent,
          fillColor: getWeeklyCheckinBarColor(point.percent),
          opacity: getWeeklyCheckinScoreOpacity(point.percent),
          weekLabel: formatWeekRange(point.weekStartDate),
          scoreLabel: formatWeeklyCheckinBurdenWithRawParen(point.percent, point.total, point.max),
        };
      }),
    [visiblePoints],
  );

  if (chartData.length === 0) {
    return <View style={[styles.emptyChart, { height }]} />;
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={getAccessibilityLabel(visiblePoints)}
      style={[styles.chartWrap, { height }]}
    >
      {chartData.map((item, index) => (
        <View key={`${visiblePoints[index]?.id ?? index}-${index}`} style={styles.barSlot}>
          <View
            accessibilityLabel={`${item.scoreLabel}, ${item.weekLabel}`}
            style={[
              styles.bar,
              {
                backgroundColor: item.fillColor,
                height: `${item.normalizedValue}%`,
                opacity: item.opacity,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

function getAccessibilityLabel(points: SymptomBarChartPoint[]) {
  const summary = points
    .map(
      (point) =>
        `${formatWeekRange(point.weekStartDate)}: ${formatWeeklyCheckinBurdenWithRawParen(point.percent, point.total, point.max)}`,
    )
    .join(', ');

  return `Symptom score history, ${summary}`;
}

function formatWeekRange(weekStartDate: string) {
  const start = new Date(`${weekStartDate}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

  return `${formatter.format(start)}-${formatter.format(end)}`;
}

const styles = StyleSheet.create({
  chartWrap: {
    flex: 1,
    alignSelf: 'stretch',
    minWidth: 104,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  emptyChart: {
    flex: 1,
    alignSelf: 'stretch',
    minWidth: 104,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: radii.xs,
    borderTopRightRadius: radii.xs,
  },
});
