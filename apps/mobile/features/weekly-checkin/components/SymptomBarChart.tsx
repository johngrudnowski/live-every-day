import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { LedText, colors, radii, spacing } from '@led/design-system';

export type SymptomBarChartPoint = {
  id: string;
  weekStartDate: string;
  value: number;
  max: number;
};

type ChartPoint = {
  value: number;
  frontColor: string;
  label: string;
  weekLabel: string;
  scoreLabel: string;
  barBorderTopLeftRadius: number;
  barBorderTopRightRadius: number;
};

const maxVisiblePoints = 8;
const chartHeight = 48;
const initialChartWidth = 148;

export function SymptomBarChart({ points }: { points: SymptomBarChartPoint[] }) {
  const [chartWidth, setChartWidth] = useState(initialChartWidth);

  const visiblePoints = useMemo(() => points.slice(-maxVisiblePoints), [points]);
  const chartData = useMemo(
    () =>
      visiblePoints.map((point) => {
        const normalizedValue = normalizeScore(point.value, point.max);

        return {
          value: normalizedValue,
          frontColor: getScoreColor(normalizedValue),
          label: '',
          weekLabel: formatWeekRange(point.weekStartDate),
          scoreLabel: `${formatScore(point.value)} / ${formatScore(point.max)}`,
          barBorderTopLeftRadius: radii.xs,
          barBorderTopRightRadius: radii.xs,
        };
      }),
    [visiblePoints],
  );

  if (chartData.length === 0) {
    return <View style={styles.emptyChart} />;
  }

  const spacingBetweenBars = chartData.length > 1 ? 4 : 0;
  const barWidth = getBarWidth(chartWidth, chartData.length, spacingBetweenBars);

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;

    if (nextWidth > 0) {
      setChartWidth(nextWidth);
    }
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={getAccessibilityLabel(visiblePoints)}
      onLayout={handleLayout}
      style={styles.chartWrap}
    >
      <BarChart
        data={chartData}
        height={chartHeight}
        maxValue={100}
        width={chartWidth}
        parentWidth={chartWidth}
        barWidth={barWidth}
        spacing={spacingBetweenBars}
        initialSpacing={0}
        endSpacing={0}
        noOfSections={1}
        minHeight={2}
        disableScroll
        hideAxesAndRules
        hideYAxisText
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisLabelWidth={0}
        labelsExtraHeight={0}
        showGradient
        gradientColor={colors.card}
        isAnimated
        animationDuration={650}
        activeOpacity={0.72}
        renderTooltip={renderTooltip}
      />
    </View>
  );
}

function renderTooltip(item: ChartPoint) {
  return (
    <View style={styles.tooltip}>
      <LedText variant="label" style={styles.tooltipScore}>
        {item.scoreLabel}
      </LedText>
      <LedText variant="bodySmall" style={styles.tooltipDate}>
        {item.weekLabel}
      </LedText>
    </View>
  );
}

function getBarWidth(chartWidth: number, pointCount: number, spacingBetweenBars: number) {
  const availableWidth = chartWidth - spacingBetweenBars * Math.max(0, pointCount - 1);
  return Math.max(5, Math.min(14, Math.floor(availableWidth / Math.max(1, pointCount))));
}

function normalizeScore(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function getScoreColor(score: number) {
  if (score < 55) {
    return mixHex('#F8F3EA', colors.sunset, score / 55);
  }

  return mixHex(colors.sunset, colors.flagHigh, (score - 55) / 45);
}

function mixHex(from: string, to: string, amount: number) {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);
  const clampedAmount = Math.max(0, Math.min(1, amount));

  return rgbToHex(
    Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * clampedAmount),
    Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * clampedAmount),
    Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * clampedAmount),
  );
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function componentToHex(value: number) {
  return value.toString(16).padStart(2, '0');
}

function getAccessibilityLabel(points: SymptomBarChartPoint[]) {
  const summary = points
    .map(
      (point) =>
        `${formatWeekRange(point.weekStartDate)}: ${formatScore(point.value)} out of ${formatScore(point.max)}`,
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

function formatScore(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

const styles = StyleSheet.create({
  chartWrap: {
    flex: 1,
    minWidth: 104,
    height: chartHeight,
    overflow: 'visible',
  },
  emptyChart: {
    flex: 1,
    minWidth: 104,
    height: chartHeight,
  },
  tooltip: {
    gap: spacing.xxs,
    minWidth: 104,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tooltipScore: {
    color: colors.flagHigh,
  },
  tooltipDate: {
    color: colors.predawn,
    fontSize: 10,
    lineHeight: 13,
  },
});
