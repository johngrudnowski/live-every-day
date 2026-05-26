import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { LabImportField } from './LabImportFields';
import { useCreateManualLabImportMutation } from '../api/health-import-queries';
import { cbcLabMetrics } from '../lib/labMetrics';

type LabRowForm = {
  metricKey: string | null;
  value: string;
  unit: string;
  referenceRange: string;
  abnormalFlag: string;
};

const defaultRows: LabRowForm[] = [createEmptyRow()];

export function LabImportManualEntryScreen() {
  const createMutation = useCreateManualLabImportMutation();
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [panelLabel, setPanelLabel] = useState('CBC');
  const [rows, setRows] = useState<LabRowForm[]>(defaultRows);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateRow(index: number, patch: Partial<LabRowForm>) {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function createImport() {
    setSubmitError(null);
    const observedAt = readReportDate(reportDate);
    if (!observedAt) {
      setSubmitError('Use YYYY-MM-DD format for the report date.');
      Alert.alert('Check report date', 'Use YYYY-MM-DD format.');
      return;
    }

    const cleanedRows = rows
      .map((row) => {
        const metric = getMetric(row.metricKey);
        return metric
          ? {
              label: metric.label,
              value: row.value.trim(),
              unit: row.unit.trim() || metric.unit,
              referenceRange: row.referenceRange.trim() || undefined,
              abnormalFlag: row.abnormalFlag.trim() || undefined,
            }
          : null;
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row?.value));

    if (cleanedRows.length === 0) {
      setSubmitError('Choose at least one lab metric and enter its value.');
      Alert.alert('Add a lab row', 'Choose at least one lab metric and enter its value.');
      return;
    }

    createMutation.mutate(
      {
        data: {
          observedAt,
          panelLabel: panelLabel.trim() || 'CBC',
          sourceLabel: 'Manual lab entry',
          rows: cleanedRows,
        },
      },
      {
        onSuccess: (response) => {
          router.replace({
            pathname: '/labs/import/[jobId]',
            params: { jobId: response.data.job.id },
          });
        },
        onError: (error) => {
          const message = getErrorMessage(error);
          setSubmitError(message);
          Alert.alert('Unable to create import', message);
        },
      },
    );
  }

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={<ScreenHeaderChevronLink label="Data" onPress={() => router.replace('/data')} />}
          title={<LedText variant="subtitle">Add labs</LedText>}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <LedText variant="displayMedium" style={styles.title}>
            Enter lab rows.
          </LedText>
          <LedText variant="body" color="textMid" style={styles.subtitle}>
            We&apos;ll stage them for review before saving observations.
          </LedText>
        </View>

        <View style={styles.card}>
          <LabImportField
            label="Report date"
            value={reportDate}
            placeholder="2026-05-19"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            onChangeText={setReportDate}
          />
          <LabImportField
            label="Panel"
            value={panelLabel}
            placeholder="CBC"
            autoCapitalize="characters"
            onChangeText={setPanelLabel}
          />
        </View>

        {rows.map((row, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.rowHeader}>
              <LedText variant="subtitle">Row {index + 1}</LedText>
              {rows.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove row ${index + 1}`}
                  style={styles.iconButton}
                  onPress={() => removeRow(index)}
                >
                  <FontAwesome name="trash" size={14} color={colors.flagHigh} />
                </Pressable>
              ) : null}
            </View>
            <MetricPicker
              selectedMetricKey={row.metricKey}
              onSelect={(metric) =>
                updateRow(index, {
                  metricKey: metric.key,
                  unit: row.unit || metric.unit,
                })
              }
            />
            <View style={styles.twoColumn}>
              <LabImportField
                label="Value"
                value={row.value}
                placeholder="842"
                style={styles.columnField}
                keyboardType="decimal-pad"
                autoCapitalize="none"
                onChangeText={(value) => updateRow(index, { value })}
              />
              <LabImportField
                label="Unit"
                value={row.unit}
                placeholder="x10^3/uL"
                style={styles.columnField}
                autoCapitalize="none"
                onChangeText={(unit) => updateRow(index, { unit })}
              />
            </View>
            <View style={styles.twoColumn}>
              <LabImportField
                label="Range"
                value={row.referenceRange}
                placeholder="150-450"
                style={styles.columnField}
                autoCapitalize="none"
                onChangeText={(referenceRange) => updateRow(index, { referenceRange })}
              />
              <LabImportField
                label="Flag"
                value={row.abnormalFlag}
                placeholder="normal"
                style={styles.columnField}
                autoCapitalize="none"
                onChangeText={(abnormalFlag) => updateRow(index, { abnormalFlag })}
              />
            </View>
          </View>
        ))}

        <PrimaryButton
          label="Add row"
          variant="secondary"
          fullWidth
          onPress={() => setRows((current) => [...current, createEmptyRow()])}
        />

        <PrimaryButton
          label={createMutation.isPending ? 'Creating...' : 'Review lab rows'}
          fullWidth
          disabled={createMutation.isPending}
          onPress={createImport}
        />
        {submitError ? (
          <View style={styles.inlineError}>
            <LedText variant="bodySmall" color="flagHigh">
              {submitError}
            </LedText>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

function MetricPicker({
  selectedMetricKey,
  onSelect,
}: {
  selectedMetricKey: string | null;
  onSelect: (metric: (typeof cbcLabMetrics)[number]) => void;
}) {
  return (
    <View style={styles.metricPicker}>
      <LedText variant="label" color="predawn">
        Lab value
      </LedText>
      <View style={styles.metricChips}>
        {cbcLabMetrics.map((metric) => (
          <Pressable
            key={metric.key}
            accessibilityRole="button"
            accessibilityState={{ selected: metric.key === selectedMetricKey }}
            onPress={() => onSelect(metric)}
            style={({ pressed }) => [
              styles.metricChip,
              metric.key === selectedMetricKey && styles.metricChipSelected,
              pressed && styles.pressed,
            ]}
          >
            <LedText variant="bodySmall" style={styles.metricChipText}>
              {metric.label}
            </LedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createEmptyRow(): LabRowForm {
  return {
    metricKey: null,
    value: '',
    unit: '',
    referenceRange: '',
    abnormalFlag: '',
  };
}

function getMetric(metricKey: string | null) {
  return cbcLabMetrics.find((metric) => metric.key === metricKey) ?? null;
}

function readReportDate(value: string) {
  const date = new Date(`${value.trim()}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  intro: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    lineHeight: 21,
  },
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.flagHighBg,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  columnField: {
    flex: 1,
    minWidth: 0,
  },
  metricPicker: {
    gap: spacing.xs,
  },
  metricChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metricChipSelected: {
    borderColor: colors.midday,
    backgroundColor: colors.selectedBg,
  },
  metricChipText: {
    color: colors.midnight,
    fontFamily: 'DMSans_500Medium',
  },
  inlineError: {
    borderWidth: 1,
    borderColor: colors.flagHigh,
    borderRadius: radii.lg,
    backgroundColor: colors.flagHighBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.72,
  },
});
