import {
  useVitalMetricsSummaryQuery,
  type VitalMetricsSummary,
} from '@/features/vitals/api/vitals-queries';
import { LedText, colors, radii, spacing } from '@led/design-system';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { getCanonicalHealthMetricKey } from '../lib/healthMetrics';
import { DataMetricCard } from './DataMetricCard';
import { SectionHeader } from './SectionHeader';

type MetricTone = 'ok' | 'warning' | 'high' | 'empty';

export function HomeVitalsSection() {
  const summaryQuery = useVitalMetricsSummaryQuery();
  const summary = summaryQuery.data;
  const hasReadings = hasAnyReadings(summary);

  return (
    <View style={styles.section}>
      <SectionHeader title="Home vitals - last 30 days" action={<LogButton />} />
      {hasReadings ? (
        <View style={styles.grid}>
          {summary?.metrics.map((metric) => (
            <DataMetricCard
              key={metric.key}
              label={metric.label}
              status={metric.status}
              tone={coerceTone(metric.statusTone)}
              unit={formatUnit(metric.unit)}
              value={metric.value ?? '--'}
              onPress={() =>
                router.push({
                  pathname: '/data/history/[metricKey]',
                  params: { metricKey: getCanonicalHealthMetricKey(metric.key) ?? metric.key },
                })
              }
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <LedText variant="subtitle">No home vitals in the last 30 days.</LedText>
          <LedText variant="bodySmall" color="predawn" style={styles.emptyCopy}>
            Log blood pressure, pulse, temperature, and oxygen saturation to track them here.
          </LedText>
        </View>
      )}
    </View>
  );
}

function LogButton() {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/vitals/log')}
      style={({ pressed }) => [styles.logButton, pressed && styles.pressed]}
    >
      <LedText variant="bodySmall" style={styles.logButtonText}>
        + Log
      </LedText>
    </Pressable>
  );
}

function hasAnyReadings(summary?: VitalMetricsSummary) {
  return summary?.metrics.some((metric) => metric.readingCount > 0) === true;
}

function coerceTone(value: string): MetricTone {
  if (value === 'ok' || value === 'warning' || value === 'high' || value === 'empty') {
    return value;
  }

  return 'empty';
}

function formatUnit(unit?: string | null) {
  if (unit === 'F') {
    return 'deg F';
  }

  return unit;
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
  logButton: {
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  logButtonText: {
    color: colors.midnight,
    fontFamily: 'DMSans_600SemiBold',
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
  pressed: {
    opacity: 0.72,
  },
});
