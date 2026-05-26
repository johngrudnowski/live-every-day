import { router } from 'expo-router';
import { LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import { Pressable, StyleSheet, View } from 'react-native';
import { cbcLabMetrics } from '@/features/labs/lib/labMetrics';
import { useLatestObservationsQuery } from '../api/health-data-queries';
import { SectionHeader } from './SectionHeader';

export function LabValuesSection() {
  const labsQuery = useLatestObservationsQuery({
    metricKeys: cbcLabMetrics.map((metric) => metric.key).join(','),
  });
  const observations = labsQuery.data?.observations ?? [];
  const labValues = cbcLabMetrics
    .map((metric) => {
      const observation = observations.find((item) => item.metricKey === metric.key);
      return {
        metricKey: metric.key,
        label: metric.label,
        unit: observation?.unit ?? metric.unit,
        value:
          observation?.valueNumeric === null || observation?.valueNumeric === undefined
            ? null
            : formatLabValue(observation.valueNumeric),
        status: observation ? 'Latest' : 'No value',
        statusTone: observation ? 'ok' : 'neutral',
      };
    })
    .filter((item) => item.value !== null);

  return (
    <View style={styles.section}>
      <SectionHeader title="Lab values - CBC" />
      {labValues.length > 0 ? (
        <View style={styles.card}>
          {labValues.map((item, index) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/data/history/[metricKey]',
                  params: { metricKey: item.metricKey },
                })
              }
              style={({ pressed }) => [
                styles.row,
                index < labValues.length - 1 && styles.rowBorder,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.copy}>
                <LedText variant="subtitle" style={styles.label}>
                  {item.label}
                </LedText>
                <LedText variant="bodySmall" color="predawn">
                  {item.unit}
                </LedText>
              </View>
              <View style={styles.valueWrap}>
                <LedText style={[styles.value, item.statusTone === 'high' && styles.highValue]}>
                  {item.value}
                </LedText>
                <View style={[styles.pill, getPillStyle(item.statusTone)]}>
                  <LedText
                    variant="bodySmall"
                    style={[styles.pillText, getPillTextStyle(item.statusTone)]}
                  >
                    {item.status}
                  </LedText>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <LedText variant="subtitle">No lab values yet.</LedText>
          <LedText variant="bodySmall" color="predawn" style={styles.emptyCopy}>
            Add a CBC panel to start tracking lab history.
          </LedText>
        </View>
      )}
      <PrimaryButton
        label="Add lab panel"
        variant="secondary"
        fullWidth
        onPress={() => router.push('/labs/import')}
      />
    </View>
  );
}

function formatLabValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getPillStyle(tone: string) {
  if (tone === 'high') {
    return styles.highPill;
  }

  if (tone === 'ok') {
    return styles.okPill;
  }

  return styles.neutralPill;
}

function getPillTextStyle(tone: string) {
  if (tone === 'high') {
    return styles.highText;
  }

  if (tone === 'ok') {
    return styles.okText;
  }

  return styles.neutralText;
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  copy: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    lineHeight: 19,
  },
  valueWrap: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  value: {
    color: colors.midnight,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 18,
    lineHeight: 22,
  },
  highValue: {
    color: colors.flagHigh,
  },
  pill: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  highPill: {
    backgroundColor: colors.flagHighBg,
  },
  okPill: {
    backgroundColor: colors.flagOkBg,
  },
  neutralPill: {
    backgroundColor: colors.surface,
  },
  pillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    lineHeight: 13,
  },
  highText: {
    color: colors.flagHigh,
  },
  okText: {
    color: '#1A6040',
  },
  neutralText: {
    color: colors.predawn,
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
