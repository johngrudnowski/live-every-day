export const cbcLabMetrics = [
  { key: 'lab_platelets', label: 'Platelets', unit: 'x10^3/uL' },
  { key: 'lab_wbc', label: 'WBC', unit: 'x10^3/uL' },
  { key: 'lab_hemoglobin', label: 'Hemoglobin', unit: 'g/dL' },
  { key: 'lab_hematocrit', label: 'Hematocrit', unit: '%' },
  { key: 'lab_rbc', label: 'RBC', unit: 'x10^6/uL' },
  {
    key: 'lab_neutrophils_absolute',
    label: 'Abs neutrophils',
    unit: 'x10^3/uL',
  },
  {
    key: 'lab_lymphocytes_absolute',
    label: 'Abs lymphocytes',
    unit: 'x10^3/uL',
  },
] as const;

export const cbcLabMetricKeys = cbcLabMetrics.map((metric) => metric.key);

export function getLabMetricLabel(metricKey: string | null | undefined) {
  return (
    cbcLabMetrics.find((metric) => metric.key === metricKey)?.label ??
    metricKey ??
    'Unknown'
  );
}
