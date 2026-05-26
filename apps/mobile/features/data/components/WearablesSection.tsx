import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';
import { useLatestObservationsQuery } from '../api/health-data-queries';
import { getHealthMetricDefinition } from '../lib/healthMetrics';
import { DataMetricCard } from './DataMetricCard';
import { SectionHeader } from './SectionHeader';

const wearableWidgetMetricKeys = [
  'resting_heart_rate',
  'sleep_duration',
  'heart_rate_variability_sdnn',
  'steps',
] as const;

export function WearablesSection() {
  const latestQuery = useLatestObservationsQuery({
    metricKeys: wearableWidgetMetricKeys.join(','),
  });
  const observations = latestQuery.data?.observations ?? [];
  const widgets = wearableWidgetMetricKeys.map((metricKey) => {
    const metric = getHealthMetricDefinition(metricKey);
    const observation = observations.find((item) => item.metricKey === metricKey);

    return {
      metricKey,
      label: metric?.shortLabel ?? metric?.label ?? metricKey,
      unit: observation?.unit ?? metric?.unit ?? null,
      value:
        observation?.valueNumeric === null || observation?.valueNumeric === undefined
          ? null
          : formatMetricValue(observation.valueNumeric, metric?.precision ?? 0),
      status: observation ? `Latest ${formatObservationDate(observation.observedAt)}` : 'No data',
      tone: observation ? ('ok' as const) : ('empty' as const),
    };
  });
  const hasAnyData = widgets.some((widget) => widget.value !== null);

  return (
    <View style={styles.section}>
      <SectionHeader title="Wearables" />
      {hasAnyData || latestQuery.isPending ? (
        <View style={styles.grid}>
          {widgets.map((widget) => (
            <DataMetricCard
              key={widget.metricKey}
              label={widget.label}
              status={latestQuery.isPending ? 'Loading' : widget.status}
              tone={latestQuery.isPending ? 'empty' : widget.tone}
              unit={widget.value ? widget.unit : null}
              value={latestQuery.isPending ? '--' : (widget.value ?? '--')}
              onPress={() =>
                router.push({
                  pathname: '/data/history/[metricKey]',
                  params: { metricKey: widget.metricKey },
                })
              }
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <LedText variant="subtitle">No wearable data yet.</LedText>
          <LedText variant="bodySmall" color="predawn" style={styles.emptyCopy}>
            Connect Apple Health, Oura, or another source to track wearable trends here.
          </LedText>
        </View>
      )}
    </View>
  );
}

function formatMetricValue(value: number, precision: number) {
  if (precision === 0) {
    return String(Math.round(value));
  }

  return value.toFixed(precision);
}

function formatObservationDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emptyCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  emptyCopy: {
    lineHeight: 18,
  },
});
