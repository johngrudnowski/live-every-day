import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  BarChart,
  LineChart,
  type barDataItem,
  type lineDataItem,
} from 'react-native-gifted-charts';
import {
  AppScreen,
  LedText,
  PrimaryButton,
  colors,
  radii,
  spacing,
} from '@led/design-system';

import {
  ScreenHeaderChevronLink,
  ScreenHeaderNavRow,
} from '@/components/screen-header';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import { useDailyHealthSummaryQuery } from '../api/health-data-queries';
import {
  defaultMetricKey,
  getDisplayUnit,
  getCanonicalHealthMetricDefinition,
  getCanonicalHealthMetricKey,
  getHealthMetricDefinition,
  getHistoryMetricKeys,
  getMetricsForCategory,
  healthMetricCategories,
  type HealthMetricDefinition,
} from '../lib/healthMetrics';
import {
  enumerateDates,
  formatDateLabel,
  formatRangeLabel,
  getInitialRange,
  getRangeIsoBounds,
  historyPeriods,
  isRangeAtOrAfterToday,
  shiftRange,
  type HistoryDateRange,
  type HistoryPeriod,
} from '../lib/historyRanges';

type DailyMetricPoint = {
  date: string;
  value: number | null;
  sampleCount: number;
};

type MetricStats = {
  average: number | null;
  latest: DailyMetricPoint | null;
  high: DailyMetricPoint | null;
  low: DailyMetricPoint | null;
  total: number | null;
  loggedDays: number;
};

const chartHeight = 188;
const primaryColor = colors.midday;
const companionColor = colors.flagHigh;

export function MetricHistoryScreen() {
  const { metricKey } = useLocalSearchParams<{ metricKey?: string }>();
  const initialMetric =
    getCanonicalHealthMetricDefinition(metricKey) ??
    getHealthMetricDefinition(defaultMetricKey);
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>(
    initialMetric?.key ?? defaultMetricKey,
  );
  const [period, setPeriod] = useState<HistoryPeriod>('7D');
  const [range, setRange] = useState<HistoryDateRange>(() =>
    getInitialRange('7D'),
  );
  const selectedMetric =
    getHealthMetricDefinition(selectedMetricKey) ?? initialMetric;
  const historyMetricKeys = selectedMetric
    ? getHistoryMetricKeys(selectedMetric)
    : [];
  const bounds = useMemo(() => getRangeIsoBounds(range), [range]);
  const summaryQuery = useDailyHealthSummaryQuery(
    {
      metricKeys: historyMetricKeys.join(','),
      from: bounds.from,
      to: bounds.to,
    },
    Boolean(selectedMetric),
  );
  const { width } = useWindowDimensions();

  if (!selectedMetric) {
    return (
      <MetricHistoryShell title="Metric history">
        <View style={styles.emptyCard}>
          <LedText variant="subtitle">Metric not found</LedText>
          <LedText variant="bodySmall" color="predawn">
            This health metric is not available yet.
          </LedText>
        </View>
      </MetricHistoryShell>
    );
  }

  if (summaryQuery.isPending && !summaryQuery.data) {
    return <LoadingScreen message="Loading history" />;
  }

  const dates = enumerateDates(range);
  const primaryPoints = buildDailyPoints(
    selectedMetric,
    dates,
    summaryQuery.data?.summaries ?? [],
  );
  const companionMetric = selectedMetric.companionMetricKey
    ? getHealthMetricDefinition(selectedMetric.companionMetricKey)
    : null;
  const companionPoints = companionMetric
    ? buildDailyPoints(
        companionMetric,
        dates,
        summaryQuery.data?.summaries ?? [],
      )
    : [];
  const primaryStats = getMetricStats(primaryPoints);
  const companionStats = getMetricStats(companionPoints);
  const chartWidth = Math.max(240, width - spacing.xl * 2 - spacing.lg * 2);
  const hasData = primaryStats.loggedDays > 0 || companionStats.loggedDays > 0;

  function updatePeriod(nextPeriod: HistoryPeriod) {
    setPeriod(nextPeriod);
    setRange(getInitialRange(nextPeriod));
  }

  function updateMetric(nextMetricKey: string) {
    setSelectedMetricKey(
      getCanonicalHealthMetricKey(nextMetricKey) ?? nextMetricKey,
    );
  }

  return (
    <MetricHistoryShell title={selectedMetric.shortLabel}>
      <ScrollView
        stickyHeaderIndices={[1]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <LedText variant="displayMedium" style={styles.title}>
            {selectedMetric.label}
          </LedText>
          <LedText variant="body" color="textMid" style={styles.subtitle}>
            Review trends, range summaries, and exact daily values from your
            connected and logged health data.
          </LedText>
          {isHomeVitalMetric(selectedMetric) ? (
            <PrimaryButton
              label="Log vitals"
              variant="secondary"
              fullWidth
              onPress={() => router.push('/vitals/log')}
            />
          ) : null}
        </View>

        <View style={styles.stickyControls}>
          <PeriodControl value={period} onChange={updatePeriod} />
          <DateRangeNavigator
            range={range}
            period={period}
            onPrevious={() =>
              setRange((current) => shiftRange(current, period, -1))
            }
            onNext={() => setRange((current) => shiftRange(current, period, 1))}
          />
          <MetricPicker
            selectedMetric={selectedMetric}
            onSelect={updateMetric}
          />
        </View>

        <View style={styles.card}>
          <ChartHeader
            metric={selectedMetric}
            companionMetric={companionMetric}
            isUpdating={summaryQuery.isFetching && !summaryQuery.isPending}
          />
          {summaryQuery.error ? (
            <InlineMessage message="Unable to load this metric history. Please try again." />
          ) : hasData ? (
            <MetricTrendChart
              metric={selectedMetric}
              points={primaryPoints}
              companionMetric={companionMetric}
              companionPoints={companionPoints}
              chartWidth={chartWidth}
            />
          ) : (
            <EmptyChart metric={selectedMetric} />
          )}
        </View>

        <MetricSummaryStats
          metric={selectedMetric}
          stats={primaryStats}
          companionMetric={companionMetric}
          companionStats={companionStats}
        />

        <DailyRows
          metric={selectedMetric}
          points={primaryPoints}
          companionMetric={companionMetric}
          companionPoints={companionPoints}
        />
      </ScrollView>
    </MetricHistoryShell>
  );
}

function MetricHistoryShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={
            <ScreenHeaderChevronLink
              label="Data"
              onPress={() => router.replace('/data')}
            />
          }
          title={
            <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
              {title}
            </LedText>
          }
        />
      </View>
      {children}
    </AppScreen>
  );
}

function isHomeVitalMetric(metric: HealthMetricDefinition) {
  return (
    metric.key === 'blood_pressure_systolic' ||
    metric.key === 'heart_rate' ||
    metric.key === 'body_temperature' ||
    metric.key === 'oxygen_saturation'
  );
}

function PeriodControl({
  value,
  onChange,
}: {
  value: HistoryPeriod;
  onChange: (period: HistoryPeriod) => void;
}) {
  return (
    <View style={styles.periodControl}>
      {historyPeriods.map((period) => (
        <Pressable
          key={period}
          accessibilityRole="button"
          accessibilityState={{ selected: period === value }}
          onPress={() => onChange(period)}
          style={({ pressed }) => [
            styles.periodOption,
            period === value && styles.periodOptionSelected,
            pressed && styles.pressed,
          ]}
        >
          <LedText
            variant="bodySmall"
            style={[
              styles.periodLabel,
              period === value && styles.periodLabelSelected,
            ]}
          >
            {period}
          </LedText>
        </Pressable>
      ))}
    </View>
  );
}

function DateRangeNavigator({
  range,
  period,
  onPrevious,
  onNext,
}: {
  range: HistoryDateRange;
  period: HistoryPeriod;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const nextDisabled = isRangeAtOrAfterToday(range);

  return (
    <View style={styles.rangeRow}>
      <IconButton
        label="Previous range"
        icon="chevron-left"
        onPress={onPrevious}
      />
      <LedText variant="subtitle" numberOfLines={1} style={styles.rangeLabel}>
        {formatRangeLabel(range, period)}
      </LedText>
      <IconButton
        label="Next range"
        icon="chevron-right"
        disabled={nextDisabled}
        onPress={onNext}
      />
    </View>
  );
}

function MetricPicker({
  selectedMetric,
  onSelect,
}: {
  selectedMetric: HealthMetricDefinition;
  onSelect: (metricKey: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.metricGroups}
    >
      {healthMetricCategories.map((category) => {
        const metrics = getMetricsForCategory(category.key);
        return (
          <View key={category.key} style={styles.metricGroup}>
            <LedText
              variant="label"
              color="predawn"
              style={styles.metricGroupLabel}
            >
              {category.label}
            </LedText>
            <View style={styles.metricChips}>
              {metrics.map((metric) => (
                <Pressable
                  key={metric.key}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: metric.key === selectedMetric.key,
                  }}
                  onPress={() => onSelect(metric.key)}
                  style={({ pressed }) => [
                    styles.metricChip,
                    metric.key === selectedMetric.key &&
                      styles.metricChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <LedText
                    variant="bodySmall"
                    style={[
                      styles.metricChipLabel,
                      metric.key === selectedMetric.key &&
                        styles.metricChipLabelSelected,
                    ]}
                  >
                    {metric.shortLabel}
                  </LedText>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function IconButton({
  label,
  icon,
  disabled = false,
  onPress,
}: {
  label: string;
  icon: 'chevron-left' | 'chevron-right';
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <FontAwesome name={icon} size={14} color={colors.midnight} />
    </Pressable>
  );
}

function ChartHeader({
  metric,
  companionMetric,
  isUpdating,
}: {
  metric: HealthMetricDefinition;
  companionMetric: HealthMetricDefinition | null;
  isUpdating: boolean;
}) {
  return (
    <View style={styles.chartHeader}>
      <View>
        <View style={styles.chartTitleRow}>
          <LedText variant="subtitle">{metric.label}</LedText>
          {isUpdating ? (
            <LedText
              variant="bodySmall"
              color="predawn"
              style={styles.updatingLabel}
            >
              Updating...
            </LedText>
          ) : null}
        </View>
        <LedText variant="bodySmall" color="predawn">
          {getChartDescription(metric, companionMetric)}
        </LedText>
      </View>
      <View style={styles.legend}>
        <LegendItem color={primaryColor} label={metric.shortLabel} />
        {companionMetric ? (
          <LegendItem
            color={companionColor}
            label={companionMetric.shortLabel}
          />
        ) : null}
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <LedText variant="bodySmall" color="predawn">
        {label}
      </LedText>
    </View>
  );
}

function MetricTrendChart({
  metric,
  points,
  companionMetric,
  companionPoints,
  chartWidth,
}: {
  metric: HealthMetricDefinition;
  points: DailyMetricPoint[];
  companionMetric: HealthMetricDefinition | null;
  companionPoints: DailyMetricPoint[];
  chartWidth: number;
}) {
  if (metric.chartKind === 'bar' && !companionMetric) {
    const data = points.map<barDataItem>((point, index) => ({
      value: point.value ?? 0,
      label: getSparseLabel(point.date, points.length, index),
      frontColor: point.value === null ? colors.surface : primaryColor,
    }));

    return (
      <BarChart
        data={data}
        width={chartWidth}
        height={chartHeight}
        barWidth={getBarWidth(points.length)}
        spacing={getChartSpacing(points.length)}
        initialSpacing={8}
        endSpacing={8}
        noOfSections={4}
        rulesColor={colors.surface}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        showGradient
        gradientColor={colors.selectedBg}
        roundedTop
        isAnimated
      />
    );
  }

  const data = points.map<lineDataItem>((point, index) => ({
    value: point.value ?? undefined,
    label: getSparseLabel(point.date, points.length, index),
    hideDataPoint: point.value === null,
  }));
  const data2 = companionMetric
    ? companionPoints.map<lineDataItem>((point, index) => ({
        value: point.value ?? undefined,
        label: getSparseLabel(point.date, companionPoints.length, index),
        hideDataPoint: point.value === null,
      }))
    : undefined;

  return (
    <LineChart
      data={data}
      data2={data2}
      maxValue={getChartMaxValue(points, companionPoints)}
      width={chartWidth}
      height={chartHeight}
      spacing={getChartSpacing(points.length)}
      initialSpacing={8}
      endSpacing={8}
      color={primaryColor}
      color2={companionColor}
      thickness={3}
      thickness2={3}
      curved
      hideRules={false}
      rulesColor={colors.surface}
      yAxisColor={colors.border}
      xAxisColor={colors.border}
      yAxisTextStyle={styles.axisText}
      xAxisLabelTextStyle={styles.axisText}
      dataPointsColor={primaryColor}
      dataPointsColor2={companionColor}
      dataPointsRadius={3}
      dataPointsRadius2={3}
      hideDataPoints={Platform.OS === 'web'}
      hideDataPoints1={Platform.OS === 'web'}
      hideDataPoints2={Platform.OS === 'web'}
      noOfSections={4}
      focusEnabled={Platform.OS !== 'web'}
      showTextOnFocus={Platform.OS !== 'web'}
      showDataPointOnFocus={Platform.OS !== 'web'}
      isAnimated
    />
  );
}

function EmptyChart({ metric }: { metric: HealthMetricDefinition }) {
  return (
    <View style={styles.emptyChart}>
      <LedText variant="subtitle">
        No {metric.shortLabel.toLowerCase()} data in this range.
      </LedText>
      <LedText variant="bodySmall" color="predawn" style={styles.emptyCopy}>
        Try another date range or log a new reading.
      </LedText>
    </View>
  );
}

function MetricSummaryStats({
  metric,
  stats,
  companionMetric,
  companionStats,
}: {
  metric: HealthMetricDefinition;
  stats: MetricStats;
  companionMetric: HealthMetricDefinition | null;
  companionStats: MetricStats;
}) {
  const statItems = getStatItems(metric, stats);

  return (
    <View style={styles.statsGrid}>
      {statItems.map((item) => (
        <View key={item.label} style={styles.statCard}>
          <LedText variant="bodySmall" color="predawn">
            {item.label}
          </LedText>
          <LedText style={styles.statValue}>{item.value}</LedText>
        </View>
      ))}
      {companionMetric ? (
        <View style={styles.statCard}>
          <LedText variant="bodySmall" color="predawn">
            {companionMetric.shortLabel} latest
          </LedText>
          <LedText style={styles.statValue}>
            {formatPointValue(
              companionMetric,
              companionStats.latest?.value ?? null,
            )}
          </LedText>
        </View>
      ) : null}
    </View>
  );
}

function DailyRows({
  metric,
  points,
  companionMetric,
  companionPoints,
}: {
  metric: HealthMetricDefinition;
  points: DailyMetricPoint[];
  companionMetric: HealthMetricDefinition | null;
  companionPoints: DailyMetricPoint[];
}) {
  const rows = [...points].reverse();
  const companionByDate = new Map(
    companionPoints.map((point) => [point.date, point]),
  );

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <LedText variant="subtitle">Daily values</LedText>
        <LedText variant="bodySmall" color="predawn">
          {rows.length} days
        </LedText>
      </View>
      <View style={styles.rowList}>
        {rows.map((point, index) => (
          <View
            key={point.date}
            style={[
              styles.valueRow,
              index < rows.length - 1 && styles.rowBorder,
            ]}
          >
            <View style={styles.rowCopy}>
              <LedText variant="subtitle" style={styles.rowDate}>
                {formatDateLabel(point.date)}
              </LedText>
              <LedText variant="bodySmall" color="predawn">
                {point.sampleCount > 0
                  ? `${point.sampleCount} sample${point.sampleCount === 1 ? '' : 's'}`
                  : 'No data'}
              </LedText>
            </View>
            <LedText style={styles.rowValue}>
              {formatDailyRowValue(
                metric,
                point,
                companionMetric,
                companionByDate.get(point.date),
              )}
            </LedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function InlineMessage({ message }: { message: string }) {
  return (
    <View style={styles.emptyChart}>
      <LedText variant="bodySmall" color="predawn">
        {message}
      </LedText>
    </View>
  );
}

function buildDailyPoints(
  metric: HealthMetricDefinition,
  dates: string[],
  summaries: Array<{
    metricKey: string;
    date: string;
    sampleCount: number;
    valueSum?: number | null;
    valueAvg?: number | null;
    valueMin?: number | null;
    valueMax?: number | null;
    valueLatest?: number | null;
  }>,
): DailyMetricPoint[] {
  const summaryByDate = new Map(
    summaries
      .filter((summary) => summary.metricKey === metric.key)
      .map((summary) => [summary.date, summary]),
  );

  return dates.map((date) => {
    const summary = summaryByDate.get(date);
    const value = summary ? getSummaryValue(metric, summary) : null;

    return {
      date,
      value: toDisplayValue(metric, value),
      sampleCount: summary?.sampleCount ?? 0,
    };
  });
}

function getSummaryValue(
  metric: HealthMetricDefinition,
  summary: {
    valueSum?: number | null;
    valueAvg?: number | null;
    valueMin?: number | null;
    valueMax?: number | null;
    valueLatest?: number | null;
  },
) {
  if (metric.summaryValue === 'sum') {
    return summary.valueSum ?? null;
  }

  if (metric.summaryValue === 'avg') {
    return summary.valueAvg ?? null;
  }

  if (metric.summaryValue === 'min') {
    return summary.valueMin ?? null;
  }

  if (metric.summaryValue === 'max') {
    return summary.valueMax ?? null;
  }

  return summary.valueLatest ?? null;
}

function toDisplayValue(metric: HealthMetricDefinition, value: number | null) {
  if (value === null) {
    return null;
  }

  if (metric.key === 'sleep_duration' || metric.key === 'time_in_bed') {
    return value / 60;
  }

  return value;
}

function getMetricStats(points: DailyMetricPoint[]): MetricStats {
  const values = points.filter((point) => point.value !== null) as Array<
    DailyMetricPoint & { value: number }
  >;
  const total = values.reduce((sum, point) => sum + point.value, 0);

  return {
    average: values.length > 0 ? total / values.length : null,
    latest: values.at(-1) ?? null,
    high: values.reduce<DailyMetricPoint | null>(
      (max, point) =>
        !max || point.value > (max.value ?? Number.NEGATIVE_INFINITY)
          ? point
          : max,
      null,
    ),
    low: values.reduce<DailyMetricPoint | null>(
      (min, point) =>
        !min || point.value < (min.value ?? Number.POSITIVE_INFINITY)
          ? point
          : min,
      null,
    ),
    total: values.length > 0 ? total : null,
    loggedDays: values.length,
  };
}

function getChartMaxValue(
  points: DailyMetricPoint[],
  companionPoints: DailyMetricPoint[],
) {
  const max = [...points, ...companionPoints].reduce(
    (currentMax, point) =>
      point.value === null ? currentMax : Math.max(currentMax, point.value),
    0,
  );

  if (max <= 0) {
    return undefined;
  }

  return Math.ceil(max * 1.12);
}

function getStatItems(metric: HealthMetricDefinition, stats: MetricStats) {
  if (metric.chartKind === 'bar') {
    return [
      { label: 'Total', value: formatPointValue(metric, stats.total) },
      { label: 'Daily avg', value: formatPointValue(metric, stats.average) },
      {
        label: 'Best day',
        value: formatPointValue(metric, stats.high?.value ?? null),
      },
      { label: 'Logged days', value: String(stats.loggedDays) },
    ];
  }

  return [
    {
      label: 'Latest',
      value: formatPointValue(metric, stats.latest?.value ?? null),
    },
    { label: 'Average', value: formatPointValue(metric, stats.average) },
    {
      label: 'High',
      value: formatPointValue(metric, stats.high?.value ?? null),
    },
    { label: 'Low', value: formatPointValue(metric, stats.low?.value ?? null) },
  ];
}

function formatDailyRowValue(
  metric: HealthMetricDefinition,
  point: DailyMetricPoint,
  companionMetric: HealthMetricDefinition | null,
  companionPoint: DailyMetricPoint | undefined,
) {
  if (companionMetric) {
    const first = formatNumber(point.value, metric.precision);
    const second = formatNumber(
      companionPoint?.value ?? null,
      companionMetric.precision,
    );
    const unit = getDisplayUnit(metric);
    return `${first} / ${second}${unit ? ` ${unit}` : ''}`;
  }

  return formatPointValue(metric, point.value);
}

function formatPointValue(
  metric: HealthMetricDefinition,
  value: number | null | undefined,
) {
  const formatted = formatNumber(value ?? null, metric.precision);
  const unit = getDisplayUnit(metric);
  return unit && formatted !== '--' ? `${formatted} ${unit}` : formatted;
}

function formatNumber(value: number | null, precision: number) {
  if (value === null || Number.isNaN(value)) {
    return '--';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision > 0 ? precision : 0,
  }).format(value);
}

function getSparseLabel(date: string, pointCount: number, index: number) {
  if (pointCount <= 10) {
    return formatDateLabel(date, true);
  }

  if (pointCount <= 35 && index % 7 === 0) {
    return formatDateLabel(date, true);
  }

  if (pointCount > 35 && date.endsWith('-01')) {
    return formatDateLabel(date, true);
  }

  return '';
}

function getChartSpacing(pointCount: number) {
  if (pointCount > 120) {
    return 8;
  }

  if (pointCount > 35) {
    return 14;
  }

  if (pointCount > 10) {
    return 26;
  }

  return 42;
}

function getBarWidth(pointCount: number) {
  if (pointCount > 120) {
    return 4;
  }

  if (pointCount > 35) {
    return 8;
  }

  return 16;
}

function getChartDescription(
  metric: HealthMetricDefinition,
  companionMetric: HealthMetricDefinition | null,
) {
  if (companionMetric) {
    return `${metric.shortLabel} and ${companionMetric.shortLabel} shown together.`;
  }

  if (metric.chartKind === 'bar') {
    return 'Daily totals across the selected range.';
  }

  return 'Daily trend across the selected range.';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  intro: {
    gap: spacing.xs,
  },
  title: {
    color: colors.midnight,
  },
  subtitle: {
    lineHeight: 20,
  },
  stickyControls: {
    gap: spacing.md,
    marginHorizontal: -spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  periodControl: {
    flexDirection: 'row',
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    padding: spacing.xxs,
  },
  periodOption: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
  },
  periodOptionSelected: {
    backgroundColor: colors.card,
  },
  periodLabel: {
    color: colors.predawn,
    fontFamily: 'DMSans_600SemiBold',
  },
  periodLabelSelected: {
    color: colors.midnight,
  },
  rangeRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rangeLabel: {
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  metricGroups: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  metricGroup: {
    gap: spacing.xs,
  },
  metricGroupLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
  metricChips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metricChip: {
    minHeight: 34,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  metricChipSelected: {
    borderColor: colors.midday,
    backgroundColor: colors.selectedBg,
  },
  metricChipLabel: {
    color: colors.predawn,
    fontFamily: 'DMSans_600SemiBold',
  },
  metricChipLabelSelected: {
    color: colors.midnight,
  },
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  chartHeader: {
    gap: spacing.md,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  updatingLabel: {
    fontFamily: 'DMSans_500Medium',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  axisText: {
    color: colors.predawn,
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
  },
  emptyCard: {
    gap: spacing.xs,
    margin: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  emptyChart: {
    minHeight: chartHeight,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyCopy: {
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  statValue: {
    color: colors.midnight,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 18,
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowList: {
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  valueRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  rowCopy: {
    flex: 1,
  },
  rowDate: {
    fontSize: 14,
    lineHeight: 18,
  },
  rowValue: {
    color: colors.midnight,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'right',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.72,
  },
});
