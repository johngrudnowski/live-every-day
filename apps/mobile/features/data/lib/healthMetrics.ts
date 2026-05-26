export type HealthMetricCategory = 'vital' | 'cardio' | 'body' | 'activity' | 'sleep' | 'lab';
export type HealthMetricChartKind = 'line' | 'bar';
export type HealthMetricSummaryValue = 'latest' | 'avg' | 'sum' | 'min' | 'max';

export type HealthMetricDefinition = {
  key: string;
  label: string;
  shortLabel: string;
  category: HealthMetricCategory;
  unit: string | null;
  chartKind: HealthMetricChartKind;
  summaryValue: HealthMetricSummaryValue;
  precision: number;
  familyKey?: string;
  companionMetricKey?: string;
  canonicalMetricKey?: string;
  hideFromPicker?: boolean;
};

export const healthMetricDefinitions: readonly HealthMetricDefinition[] = [
  {
    key: 'blood_pressure_systolic',
    label: 'Blood pressure',
    shortLabel: 'BP',
    category: 'vital',
    unit: 'mmHg',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 0,
    familyKey: 'blood_pressure',
    companionMetricKey: 'blood_pressure_diastolic',
  },
  {
    key: 'blood_pressure_diastolic',
    label: 'Diastolic blood pressure',
    shortLabel: 'Diastolic',
    category: 'vital',
    unit: 'mmHg',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 0,
    familyKey: 'blood_pressure',
    companionMetricKey: 'blood_pressure_systolic',
    canonicalMetricKey: 'blood_pressure_systolic',
    hideFromPicker: true,
  },
  {
    key: 'heart_rate',
    label: 'Pulse',
    shortLabel: 'Pulse',
    category: 'vital',
    unit: 'bpm',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 0,
  },
  {
    key: 'resting_heart_rate',
    label: 'Resting heart rate',
    shortLabel: 'Resting HR',
    category: 'cardio',
    unit: 'bpm',
    chartKind: 'line',
    summaryValue: 'avg',
    precision: 0,
  },
  {
    key: 'body_temperature',
    label: 'Temperature',
    shortLabel: 'Temp',
    category: 'vital',
    unit: 'deg F',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 1,
  },
  {
    key: 'oxygen_saturation',
    label: 'O2 saturation',
    shortLabel: 'O2 sat',
    category: 'vital',
    unit: '%',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 0,
  },
  {
    key: 'respiratory_rate',
    label: 'Respiratory rate',
    shortLabel: 'Resp rate',
    category: 'vital',
    unit: 'breaths/min',
    chartKind: 'line',
    summaryValue: 'avg',
    precision: 0,
  },
  {
    key: 'body_weight',
    label: 'Weight',
    shortLabel: 'Weight',
    category: 'body',
    unit: 'lb',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 1,
  },
  {
    key: 'steps',
    label: 'Steps',
    shortLabel: 'Steps',
    category: 'activity',
    unit: null,
    chartKind: 'bar',
    summaryValue: 'sum',
    precision: 0,
  },
  {
    key: 'active_minutes',
    label: 'Active minutes',
    shortLabel: 'Active min',
    category: 'activity',
    unit: 'min',
    chartKind: 'bar',
    summaryValue: 'sum',
    precision: 0,
  },
  {
    key: 'sleep_duration',
    label: 'Sleep',
    shortLabel: 'Sleep',
    category: 'sleep',
    unit: 'hr',
    chartKind: 'bar',
    summaryValue: 'sum',
    precision: 1,
  },
  {
    key: 'time_in_bed',
    label: 'Time in bed',
    shortLabel: 'In bed',
    category: 'sleep',
    unit: 'hr',
    chartKind: 'bar',
    summaryValue: 'sum',
    precision: 1,
  },
  {
    key: 'heart_rate_variability_sdnn',
    label: 'HRV',
    shortLabel: 'HRV',
    category: 'cardio',
    unit: 'ms',
    chartKind: 'line',
    summaryValue: 'avg',
    precision: 0,
  },
  {
    key: 'lab_platelets',
    label: 'Platelets',
    shortLabel: 'Platelets',
    category: 'lab',
    unit: 'x10^3/uL',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 0,
  },
  {
    key: 'lab_wbc',
    label: 'WBC',
    shortLabel: 'WBC',
    category: 'lab',
    unit: 'x10^3/uL',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 1,
  },
  {
    key: 'lab_hemoglobin',
    label: 'Hemoglobin',
    shortLabel: 'Hgb',
    category: 'lab',
    unit: 'g/dL',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 1,
  },
  {
    key: 'lab_hematocrit',
    label: 'Hematocrit',
    shortLabel: 'Hct',
    category: 'lab',
    unit: '%',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 1,
  },
  {
    key: 'lab_rbc',
    label: 'RBC',
    shortLabel: 'RBC',
    category: 'lab',
    unit: 'x10^6/uL',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 2,
  },
  {
    key: 'lab_neutrophils_absolute',
    label: 'Absolute neutrophils',
    shortLabel: 'ANC',
    category: 'lab',
    unit: 'x10^3/uL',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 1,
  },
  {
    key: 'lab_lymphocytes_absolute',
    label: 'Absolute lymphocytes',
    shortLabel: 'ALC',
    category: 'lab',
    unit: 'x10^3/uL',
    chartKind: 'line',
    summaryValue: 'latest',
    precision: 1,
  },
] as const;

export const healthMetricCategories: Array<{
  key: HealthMetricCategory;
  label: string;
}> = [
  { key: 'vital', label: 'Vitals' },
  { key: 'activity', label: 'Activity' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'body', label: 'Body' },
  { key: 'lab', label: 'Labs' },
];

export const defaultMetricKey = 'blood_pressure_systolic';

export function getHealthMetricDefinition(metricKey: string | undefined) {
  return healthMetricDefinitions.find((metric) => metric.key === metricKey) ?? null;
}

export function getCanonicalHealthMetricKey(metricKey: string | undefined) {
  const metric = getHealthMetricDefinition(metricKey);
  return metric?.canonicalMetricKey ?? metric?.key ?? null;
}

export function getCanonicalHealthMetricDefinition(metricKey: string | undefined) {
  return getHealthMetricDefinition(getCanonicalHealthMetricKey(metricKey) ?? undefined);
}

export function getHistoryMetricKeys(metric: HealthMetricDefinition) {
  return [metric.key, metric.companionMetricKey].filter(Boolean) as string[];
}

export function getMetricsForCategory(category: HealthMetricCategory) {
  return healthMetricDefinitions.filter(
    (metric) => metric.category === category && !metric.hideFromPicker,
  );
}

export function getDisplayUnit(metric: HealthMetricDefinition) {
  return metric.unit;
}
