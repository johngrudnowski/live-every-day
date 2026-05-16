import { StyleSheet, View } from 'react-native';
import { spacing } from '@led/design-system';
import { DataMetricCard } from './DataMetricCard';
import { SectionHeader } from './SectionHeader';

const wearableMetrics = [
  {
    label: 'Resting HR',
    value: '72',
    unit: 'bpm',
    status: '+6 bpm',
    tone: 'high',
  },
  {
    label: 'Deep sleep',
    value: '52',
    unit: 'min',
    status: 'from 78',
    tone: 'high',
  },
  {
    label: 'HRV',
    value: '28',
    unit: 'ms',
    status: 'declining',
    tone: 'high',
  },
  {
    label: 'Steps/day',
    value: '4,820',
    unit: null,
    status: 'from 6,400',
    tone: 'high',
  },
] as const;

export function WearablesSection() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Wearables - Oura / Apple Health" />
      <View style={styles.grid}>
        {wearableMetrics.map((metric) => (
          <DataMetricCard
            key={metric.label}
            label={metric.label}
            status={metric.status}
            tone={metric.tone}
            unit={metric.unit}
            value={metric.value}
          />
        ))}
      </View>
    </View>
  );
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
});
