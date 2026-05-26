import { Injectable } from '@nestjs/common';
import { healthMetricCatalog } from 'database';

export type HealthImportIssue = {
  code: string;
  severity: 'error' | 'warning';
  message: string;
};

export type LabCandidateInput = {
  rawLabel: string;
  rawValue: string;
  rawUnit?: string | null;
  rawObservedAt?: string | null;
  observedAt?: Date | null;
  normalizedMetricKey?: string | null;
  normalizedObservedAt?: Date | null;
};

export type NormalizedLabCandidate = {
  normalizedMetricKey: string | null;
  normalizedValueNumeric: number | null;
  normalizedUnit: string | null;
  normalizedObservedAt: Date | null;
  confidence: number;
  issues: HealthImportIssue[];
};

const labMetrics = healthMetricCatalog.filter((metric) => metric.category === 'lab');

@Injectable()
export class HealthImportNormalizationService {
  normalizeLabCandidate(input: LabCandidateInput): NormalizedLabCandidate {
    const issues: HealthImportIssue[] = [];
    const matchedMetric = input.normalizedMetricKey
      ? (labMetrics.find((metric) => metric.key === input.normalizedMetricKey) ?? null)
      : findMetricByLabel(input.rawLabel);

    if (!matchedMetric) {
      issues.push({
        code: 'unknown_metric',
        severity: 'error',
        message: 'Choose a lab metric before importing this row.',
      });
    }

    const valueNumeric = parseNumeric(input.rawValue);
    if (valueNumeric === null) {
      issues.push({
        code: 'invalid_number',
        severity: 'error',
        message: 'Enter a numeric lab result value.',
      });
    }

    const unit = normalizeUnit(input.rawUnit);
    if (!unit && matchedMetric?.defaultUnit) {
      issues.push({
        code: 'missing_unit',
        severity: 'warning',
        message: `Using the default unit ${matchedMetric.defaultUnit}.`,
      });
    }

    const observedAt =
      input.normalizedObservedAt ??
      parseObservedAt(input.rawObservedAt) ??
      input.observedAt ??
      null;
    if (!observedAt) {
      issues.push({
        code: 'missing_observed_date',
        severity: 'error',
        message: 'Choose the report date before importing this row.',
      });
    }

    return {
      normalizedMetricKey: matchedMetric?.key ?? null,
      normalizedValueNumeric: valueNumeric,
      normalizedUnit: unit ?? matchedMetric?.defaultUnit ?? null,
      normalizedObservedAt: observedAt,
      confidence: matchedMetric ? 1 : 0.4,
      issues,
    };
  }
}

function findMetricByLabel(label: string) {
  const normalizedLabel = normalizeLabel(label);
  if (!normalizedLabel) {
    return null;
  }

  return (
    labMetrics.find((metric) => {
      const synonyms = getSynonyms(metric);
      return [metric.label, metric.key, ...synonyms].some(
        (candidate) => normalizeLabel(candidate) === normalizedLabel,
      );
    }) ?? null
  );
}

function getSynonyms(metric: (typeof labMetrics)[number]) {
  const metadata = 'metadataJson' in metric ? metric.metadataJson : null;
  if (!metadata || typeof metadata !== 'object' || !('synonyms' in metadata)) {
    return [];
  }

  const synonyms = (metadata as { synonyms?: unknown }).synonyms;
  return Array.isArray(synonyms)
    ? synonyms.filter((item): item is string => typeof item === 'string')
    : [];
}

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumeric(value: string) {
  const cleaned = value.trim().replace(/,/g, '');
  if (!cleaned) {
    return null;
  }

  const match = cleaned.match(/^[-+]?\d*\.?\d+/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUnit(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseObservedAt(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
