import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  healthDataSourceCatalog,
  healthMetricCatalog,
  type HealthDataSourceId,
  type HealthMetricKey,
} from 'database';
import type { DbClient } from 'database/client';
import {
  healthDataSources,
  healthMetricTypes,
  healthObservationGroups,
  healthObservations,
  healthSourceConnections,
} from 'database/schema';
import { DB_CLIENT } from '../database/database.constants';
import type {
  SaveHealthObservationItemDto,
  SaveHealthObservationsDto,
  SaveHealthVitalReadingDto,
} from './dto/save-health-observation.dto';

type ObservationRow = typeof healthObservations.$inferSelect;
type SourceConnectionRow = typeof healthSourceConnections.$inferSelect;
type VitalMetricKey = 'blood_pressure' | 'pulse' | 'temperature' | 'oxygen_saturation';
type VitalStatusTone = 'ok' | 'warning' | 'high' | 'empty';
type VitalMetricSummary = {
  key: VitalMetricKey;
  label: string;
  value: string | null;
  unit: string | null;
  status: string;
  statusTone: VitalStatusTone;
  recordedAt: string | null;
  readingCount: number;
};

const vitalsSummaryWindowDays = 30;
const vitalMetricKeys = [
  'blood_pressure_systolic',
  'blood_pressure_diastolic',
  'heart_rate',
  'body_temperature',
  'oxygen_saturation',
] satisfies HealthMetricKey[];

@Injectable()
export class HealthDataService {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async saveObservations(userId: string, dto: SaveHealthObservationsDto) {
    if (!dto || !Array.isArray(dto.observations) || dto.observations.length === 0) {
      throw new BadRequestException('At least one health observation is required.');
    }

    await this.ensureCatalog();
    const now = new Date();
    const observedAt = readOptionalDate(dto.observedAt, 'Observed time') ?? now;
    const sourceConnection = await this.getOrCreateSourceConnection(
      userId,
      readSourceId(dto.source ?? 'manual'),
      now,
    );
    const groupId = dto.group
      ? await this.createObservationGroup({
          userId,
          sourceConnection,
          groupType: dto.group.type?.trim() || 'manual_entry',
          observedAt,
          now,
        })
      : null;

    const rows = dto.observations.map((item) =>
      this.buildObservationInsertRow({
        userId,
        sourceConnection,
        groupId,
        item,
        fallbackObservedAt: observedAt,
        now,
      }),
    );

    const insertedRows = await this.db.insert(healthObservations).values(rows).returning();
    return {
      observations: insertedRows.map((row) => mapObservationRow(row, sourceConnection.sourceId)),
    };
  }

  async saveVitalReading(userId: string, dto: SaveHealthVitalReadingDto) {
    const reading = validateVitalReading(dto);
    const now = new Date();
    await this.ensureCatalog();
    const sourceConnection = await this.getOrCreateSourceConnection(userId, 'manual', now);
    const groupId = await this.createObservationGroup({
      userId,
      sourceConnection,
      groupType: 'manual_vital_reading',
      observedAt: reading.recordedAt,
      now,
    });

    const observations: SaveHealthObservationItemDto[] = [];

    if (reading.systolicMmHg !== null && reading.diastolicMmHg !== null) {
      observations.push(
        {
          metricKey: 'blood_pressure_systolic',
          valueNumeric: reading.systolicMmHg,
          unit: 'mmHg',
        },
        {
          metricKey: 'blood_pressure_diastolic',
          valueNumeric: reading.diastolicMmHg,
          unit: 'mmHg',
        },
      );
    }

    if (reading.pulseBpm !== null) {
      observations.push({ metricKey: 'heart_rate', valueNumeric: reading.pulseBpm, unit: 'bpm' });
    }

    if (reading.temperatureF !== null) {
      observations.push({
        metricKey: 'body_temperature',
        valueNumeric: reading.temperatureF,
        unit: 'degF',
      });
    }

    if (reading.oxygenSaturationPercent !== null) {
      observations.push({
        metricKey: 'oxygen_saturation',
        valueNumeric: reading.oxygenSaturationPercent,
        unit: '%',
      });
    }

    const rows = observations.map((item) =>
      this.buildObservationInsertRow({
        userId,
        sourceConnection,
        groupId,
        item,
        fallbackObservedAt: reading.recordedAt,
        now,
      }),
    );

    await this.db.insert(healthObservations).values(rows);
    return this.getLatestVitalReading(userId);
  }

  async listObservations({
    userId,
    metricKey,
    from,
    to,
    limit,
  }: {
    userId: string;
    metricKey?: string;
    from?: string;
    to?: string;
    limit?: string;
  }) {
    const rows = await this.queryObservations({
      userId,
      metricKeys: metricKey ? [metricKey] : undefined,
      from,
      to,
      limit: readLimit(limit),
    });

    return { observations: await this.mapRowsWithSources(rows) };
  }

  async getLatestObservations(userId: string, metricKeysInput?: string) {
    const metricKeys = splitMetricKeys(metricKeysInput);
    const rows = await this.queryObservations({
      userId,
      metricKeys: metricKeys.length > 0 ? metricKeys : undefined,
      limit: 500,
    });
    const latestByMetric = new Map<string, ObservationRow>();

    for (const row of rows) {
      if (!latestByMetric.has(row.metricKey)) {
        latestByMetric.set(row.metricKey, row);
      }
    }

    return { observations: await this.mapRowsWithSources([...latestByMetric.values()]) };
  }

  async getObservationHistory({
    userId,
    metricKey,
    from,
    to,
    limit,
  }: {
    userId: string;
    metricKey: string;
    from?: string;
    to?: string;
    limit?: string;
  }) {
    if (!metricKey) {
      throw new BadRequestException('metricKey is required.');
    }

    const rows = await this.queryObservations({
      userId,
      metricKeys: [metricKey],
      from,
      to,
      limit: readLimit(limit),
    });

    return { observations: await this.mapRowsWithSources(rows) };
  }

  async getDailySummary({
    userId,
    metricKeysInput,
    from,
    to,
  }: {
    userId: string;
    metricKeysInput?: string;
    from?: string;
    to?: string;
  }) {
    const metricKeys = splitMetricKeys(metricKeysInput);
    const rows = await this.queryObservations({
      userId,
      metricKeys: metricKeys.length > 0 ? metricKeys : undefined,
      from,
      to,
      limit: 5000,
      ascending: true,
    });
    const summaries = new Map<string, DailySummaryAccumulator>();

    for (const row of rows) {
      if (row.valueNumeric === null) {
        continue;
      }

      const date = row.observedAt.toISOString().slice(0, 10);
      const key = `${row.metricKey}:${date}`;
      const summary = summaries.get(key) ?? createDailySummaryAccumulator(row.metricKey, date);
      updateDailySummaryAccumulator(summary, row);
      summaries.set(key, summary);
    }

    return {
      summaries: [...summaries.values()].map((summary) => ({
        metricKey: summary.metricKey,
        date: summary.date,
        sampleCount: summary.sampleCount,
        valueSum: summary.valueSum,
        valueAvg: summary.sampleCount > 0 ? summary.valueSum / summary.sampleCount : null,
        valueMin: summary.valueMin,
        valueMax: summary.valueMax,
        valueLatest: summary.valueLatest,
      })),
    };
  }

  async getLatestVitalReading(userId: string) {
    const rows = await this.queryObservations({
      userId,
      metricKeys: [...vitalMetricKeys],
      limit: 100,
    });
    const latestRows = getLatestVitalRows(rows);

    return {
      latestReading: latestRows.length > 0 ? mapVitalRowsToReading(latestRows) : null,
    };
  }

  async getVitalMetricsSummary(userId: string) {
    const windowStart = getWindowStart(vitalsSummaryWindowDays);
    const rows = await this.queryObservations({
      userId,
      metricKeys: [...vitalMetricKeys],
      from: windowStart.toISOString(),
      limit: 1000,
    });

    return {
      windowDays: vitalsSummaryWindowDays,
      windowStart: windowStart.toISOString(),
      metrics: [
        summarizeBloodPressure(rows),
        summarizePulse(rows),
        summarizeTemperature(rows),
        summarizeOxygenSaturation(rows),
      ],
    };
  }

  private async ensureCatalog() {
    const now = new Date();

    await this.db
      .insert(healthDataSources)
      .values(healthDataSourceCatalog.map((source) => ({ ...source, updatedAt: now })))
      .onConflictDoNothing();

    await this.db
      .insert(healthMetricTypes)
      .values(healthMetricCatalog.map((metric) => ({ ...metric, updatedAt: now })))
      .onConflictDoNothing();
  }

  private async getOrCreateSourceConnection(
    userId: string,
    sourceId: HealthDataSourceId,
    now: Date,
  ) {
    const [existing] = await this.db
      .select()
      .from(healthSourceConnections)
      .where(
        and(
          eq(healthSourceConnections.userId, userId),
          eq(healthSourceConnections.sourceId, sourceId),
          eq(healthSourceConnections.status, 'connected'),
        ),
      )
      .limit(1);

    if (existing) {
      return existing;
    }

    const source = healthDataSourceCatalog.find((item) => item.id === sourceId);
    const [created] = await this.db
      .insert(healthSourceConnections)
      .values({
        id: randomUUID(),
        userId,
        sourceId,
        displayName: source?.label ?? sourceId,
        status: 'connected',
        updatedAt: now,
      })
      .returning();

    return created;
  }

  private async createObservationGroup({
    userId,
    sourceConnection,
    groupType,
    observedAt,
    now,
  }: {
    userId: string;
    sourceConnection: SourceConnectionRow;
    groupType: string;
    observedAt: Date;
    now: Date;
  }) {
    const [group] = await this.db
      .insert(healthObservationGroups)
      .values({
        id: randomUUID(),
        userId,
        groupType,
        sourceConnectionId: sourceConnection.id,
        observedAt,
        updatedAt: now,
      })
      .returning({ id: healthObservationGroups.id });

    return group.id;
  }

  private buildObservationInsertRow({
    userId,
    sourceConnection,
    groupId,
    item,
    fallbackObservedAt,
    now,
  }: {
    userId: string;
    sourceConnection: SourceConnectionRow;
    groupId: string | null;
    item: SaveHealthObservationItemDto;
    fallbackObservedAt: Date;
    now: Date;
  }): typeof healthObservations.$inferInsert {
    const metric = healthMetricCatalog.find((catalogItem) => catalogItem.key === item.metricKey);
    if (!metric) {
      throw new BadRequestException(`Unknown health metric: ${item.metricKey}.`);
    }

    assertObservationHasValue(item);

    return {
      id: randomUUID(),
      userId,
      metricKey: metric.key,
      sourceConnectionId: sourceConnection.id,
      observationGroupId: groupId,
      valueNumeric: item.valueNumeric ?? null,
      valueText: item.valueText ?? null,
      valueBoolean: item.valueBoolean ?? null,
      unit: item.unit ?? metric.defaultUnit ?? null,
      observedAt:
        readOptionalDate(item.observedAt, `${item.metricKey} observed time`) ?? fallbackObservedAt,
      startedAt: readOptionalDate(item.startedAt, `${item.metricKey} start time`),
      endedAt: readOptionalDate(item.endedAt, `${item.metricKey} end time`),
      recordedAt: now,
      aggregationKind: item.aggregationKind?.trim() || 'point',
      updatedAt: now,
    };
  }

  private async queryObservations({
    userId,
    metricKeys,
    from,
    to,
    limit,
    ascending = false,
  }: {
    userId: string;
    metricKeys?: string[];
    from?: string;
    to?: string;
    limit: number;
    ascending?: boolean;
  }) {
    const filters = [eq(healthObservations.userId, userId), isNull(healthObservations.deletedAt)];

    if (metricKeys && metricKeys.length > 0) {
      filters.push(inArray(healthObservations.metricKey, metricKeys));
    }

    const fromDate = readOptionalDate(from, 'from');
    if (fromDate) {
      filters.push(gte(healthObservations.observedAt, fromDate));
    }

    const toDate = readOptionalDate(to, 'to');
    if (toDate) {
      filters.push(lte(healthObservations.observedAt, toDate));
    }

    return await this.db
      .select()
      .from(healthObservations)
      .where(and(...filters))
      .orderBy(ascending ? healthObservations.observedAt : desc(healthObservations.observedAt))
      .limit(limit);
  }

  private async mapRowsWithSources(rows: ObservationRow[]) {
    if (rows.length === 0) {
      return [];
    }

    const sourceConnectionIds = [
      ...new Set(
        rows
          .map((row) => row.sourceConnectionId)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const sourceRows =
      sourceConnectionIds.length > 0
        ? await this.db
            .select({
              id: healthSourceConnections.id,
              sourceId: healthSourceConnections.sourceId,
            })
            .from(healthSourceConnections)
            .where(inArray(healthSourceConnections.id, sourceConnectionIds))
        : [];
    const sourceByConnectionId = new Map(sourceRows.map((row) => [row.id, row.sourceId]));

    return rows.map((row) =>
      mapObservationRow(row, sourceByConnectionId.get(row.sourceConnectionId ?? '') ?? null),
    );
  }
}

function readSourceId(value: string): HealthDataSourceId {
  const source = healthDataSourceCatalog.find((item) => item.id === value);
  if (!source) {
    throw new BadRequestException(`Unknown health data source: ${value}.`);
  }
  return source.id;
}

function assertObservationHasValue(item: SaveHealthObservationItemDto) {
  const valueCount = [item.valueNumeric, item.valueText, item.valueBoolean].filter(
    (value) => value !== undefined && value !== null,
  ).length;

  if (valueCount !== 1) {
    throw new BadRequestException(`${item.metricKey} must include exactly one value.`);
  }

  if (item.valueNumeric !== undefined && typeof item.valueNumeric !== 'number') {
    throw new BadRequestException(`${item.metricKey} value must be numeric.`);
  }
}

function readOptionalDate(value: string | undefined, label: string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${label} must be an ISO date string.`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${label} must be a valid ISO date string.`);
  }

  return date;
}

function readLimit(value: string | undefined) {
  if (!value) {
    return 100;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
    throw new BadRequestException('limit must be between 1 and 1000.');
  }

  return parsed;
}

function splitMetricKeys(value: string | undefined) {
  return value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function validateVitalReading(dto: SaveHealthVitalReadingDto) {
  if (!dto || typeof dto !== 'object') {
    throw new BadRequestException('Vital reading payload is invalid.');
  }

  const systolicMmHg = readOptionalInteger(dto.systolicMmHg, 'Systolic blood pressure', 50, 260);
  const diastolicMmHg = readOptionalInteger(dto.diastolicMmHg, 'Diastolic blood pressure', 30, 160);

  if ((systolicMmHg === null) !== (diastolicMmHg === null)) {
    throw new BadRequestException('Blood pressure requires both systolic and diastolic values.');
  }

  const pulseBpm = readOptionalInteger(dto.pulseBpm, 'Pulse', 20, 240);
  const oxygenSaturationPercent = readOptionalInteger(
    dto.oxygenSaturationPercent,
    'Oxygen saturation',
    50,
    100,
  );
  const temperatureF = readOptionalTemperature(dto.temperatureF);

  if (
    systolicMmHg === null &&
    pulseBpm === null &&
    oxygenSaturationPercent === null &&
    temperatureF === null
  ) {
    throw new BadRequestException('At least one vital sign is required.');
  }

  return {
    systolicMmHg,
    diastolicMmHg,
    pulseBpm,
    oxygenSaturationPercent,
    temperatureF,
    recordedAt: readOptionalDate(dto.recordedAt, 'Recorded time') ?? new Date(),
  };
}

function readOptionalInteger(
  value: unknown,
  label: string,
  min: number,
  max: number,
): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new BadRequestException(`${label} must be a whole number from ${min} to ${max}.`);
  }

  return value;
}

function readOptionalTemperature(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 85 || value > 110) {
    throw new BadRequestException('Temperature must be from 85.0 to 110.0 degrees Fahrenheit.');
  }

  return Math.round(value * 10) / 10;
}

function mapObservationRow(row: ObservationRow, sourceId: string | null) {
  return {
    id: row.id,
    metricKey: row.metricKey,
    sourceId,
    observationGroupId: row.observationGroupId,
    valueNumeric: row.valueNumeric,
    valueText: row.valueText,
    valueBoolean: row.valueBoolean,
    unit: row.unit,
    observedAt: row.observedAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
    aggregationKind: row.aggregationKind,
  };
}

function getWindowStart(windowDays: number) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - windowDays);
  return start;
}

function getLatestVitalRows(rows: ObservationRow[]) {
  const latestByMetric = new Map<string, ObservationRow>();

  for (const row of rows) {
    if (!latestByMetric.has(row.metricKey)) {
      latestByMetric.set(row.metricKey, row);
    }
  }

  return [...latestByMetric.values()];
}

function mapVitalRowsToReading(rows: ObservationRow[]) {
  const latestObservedAt = rows.reduce(
    (latest, row) => (row.observedAt > latest ? row.observedAt : latest),
    rows[0]?.observedAt ?? new Date(),
  );
  const latestUpdatedAt = rows.reduce(
    (latest, row) => (row.updatedAt > latest ? row.updatedAt : latest),
    rows[0]?.updatedAt ?? new Date(),
  );

  return {
    id: rows[0]?.observationGroupId ?? rows[0]?.id ?? 'health-reading',
    source: 'manual',
    systolicMmHg: readLatestMetricValue(rows, 'blood_pressure_systolic'),
    diastolicMmHg: readLatestMetricValue(rows, 'blood_pressure_diastolic'),
    pulseBpm: readLatestMetricValue(rows, 'heart_rate'),
    temperatureF: readLatestMetricValue(rows, 'body_temperature'),
    oxygenSaturationPercent: readLatestMetricValue(rows, 'oxygen_saturation'),
    recordedAt: latestObservedAt.toISOString(),
    createdAt: rows[0]?.createdAt.toISOString() ?? latestObservedAt.toISOString(),
    updatedAt: latestUpdatedAt.toISOString(),
  };
}

function readLatestMetricValue(rows: ObservationRow[], metricKey: HealthMetricKey) {
  return rows.find((row) => row.metricKey === metricKey)?.valueNumeric ?? null;
}

function summarizeBloodPressure(rows: ObservationRow[]): VitalMetricSummary {
  const systolicRows = rows.filter((row) => row.metricKey === 'blood_pressure_systolic');
  const diastolicRows = rows.filter((row) => row.metricKey === 'blood_pressure_diastolic');
  const latestSystolic = systolicRows[0];
  const latestDiastolic = diastolicRows[0];

  if (
    !latestSystolic ||
    !latestDiastolic ||
    latestSystolic.valueNumeric === null ||
    latestDiastolic.valueNumeric === null
  ) {
    return emptyMetric('blood_pressure', 'Blood pressure', 'mmHg');
  }

  const systolic = Math.round(latestSystolic.valueNumeric);
  const diastolic = Math.round(latestDiastolic.valueNumeric);
  const status = getBloodPressureStatus(systolic, diastolic);

  return {
    key: 'blood_pressure',
    label: 'Blood pressure',
    value: `${systolic}/${diastolic}`,
    unit: 'mmHg',
    status: status.label,
    statusTone: status.tone,
    recordedAt: latestSystolic.observedAt.toISOString(),
    readingCount: Math.min(systolicRows.length, diastolicRows.length),
  };
}

function summarizePulse(rows: ObservationRow[]): VitalMetricSummary {
  const matchingRows = rows.filter((row) => row.metricKey === 'heart_rate');
  const latest = matchingRows[0];

  if (!latest || latest.valueNumeric === null) {
    return emptyMetric('pulse', 'Pulse', 'bpm');
  }

  const pulseBpm = Math.round(latest.valueNumeric);
  const status = getPulseStatus(pulseBpm);

  return {
    key: 'pulse',
    label: 'Pulse',
    value: String(pulseBpm),
    unit: 'bpm',
    status: status.label,
    statusTone: status.tone,
    recordedAt: latest.observedAt.toISOString(),
    readingCount: matchingRows.length,
  };
}

function summarizeTemperature(rows: ObservationRow[]): VitalMetricSummary {
  const matchingRows = rows.filter((row) => row.metricKey === 'body_temperature');
  const latest = matchingRows[0];

  if (!latest || latest.valueNumeric === null) {
    return emptyMetric('temperature', 'Temperature', 'F');
  }

  const temperatureF = latest.valueNumeric;
  const status = getTemperatureStatus(temperatureF);

  return {
    key: 'temperature',
    label: 'Temperature',
    value: temperatureF.toFixed(1),
    unit: 'F',
    status: status.label,
    statusTone: status.tone,
    recordedAt: latest.observedAt.toISOString(),
    readingCount: matchingRows.length,
  };
}

function summarizeOxygenSaturation(rows: ObservationRow[]): VitalMetricSummary {
  const matchingRows = rows.filter((row) => row.metricKey === 'oxygen_saturation');
  const latest = matchingRows[0];

  if (!latest || latest.valueNumeric === null) {
    return emptyMetric('oxygen_saturation', 'O2 saturation', '%');
  }

  const oxygenSaturationPercent = Math.round(latest.valueNumeric);
  const status = getOxygenSaturationStatus(oxygenSaturationPercent);

  return {
    key: 'oxygen_saturation',
    label: 'O2 saturation',
    value: String(oxygenSaturationPercent),
    unit: '%',
    status: status.label,
    statusTone: status.tone,
    recordedAt: latest.observedAt.toISOString(),
    readingCount: matchingRows.length,
  };
}

function emptyMetric(key: VitalMetricKey, label: string, unit: string): VitalMetricSummary {
  return {
    key,
    label,
    value: null,
    unit,
    status: 'No readings',
    statusTone: 'empty',
    recordedAt: null,
    readingCount: 0,
  };
}

function getBloodPressureStatus(systolic: number, diastolic: number) {
  if (systolic >= 140 || diastolic >= 90) {
    return { label: 'High', tone: 'high' as const };
  }

  if (systolic >= 130 || diastolic >= 80) {
    return { label: 'Slightly elevated', tone: 'warning' as const };
  }

  if (systolic < 90 || diastolic < 60) {
    return { label: 'Low', tone: 'warning' as const };
  }

  return { label: 'Normal', tone: 'ok' as const };
}

function getPulseStatus(pulseBpm: number) {
  if (pulseBpm > 120 || pulseBpm < 45) {
    return { label: 'Out of range', tone: 'high' as const };
  }

  if (pulseBpm > 100 || pulseBpm < 60) {
    return { label: 'Watch', tone: 'warning' as const };
  }

  return { label: 'Steady', tone: 'ok' as const };
}

function getTemperatureStatus(temperatureF: number) {
  if (temperatureF >= 100.4) {
    return { label: 'Fever range', tone: 'high' as const };
  }

  if (temperatureF < 96) {
    return { label: 'Low', tone: 'warning' as const };
  }

  return { label: 'Normal', tone: 'ok' as const };
}

function getOxygenSaturationStatus(oxygenSaturationPercent: number) {
  if (oxygenSaturationPercent < 90) {
    return { label: 'Low', tone: 'high' as const };
  }

  if (oxygenSaturationPercent < 95) {
    return { label: 'Watch', tone: 'warning' as const };
  }

  return { label: 'Normal', tone: 'ok' as const };
}

type DailySummaryAccumulator = {
  metricKey: string;
  date: string;
  sampleCount: number;
  valueSum: number;
  valueMin: number | null;
  valueMax: number | null;
  valueLatest: number | null;
  latestObservedAt: Date | null;
};

function createDailySummaryAccumulator(metricKey: string, date: string): DailySummaryAccumulator {
  return {
    metricKey,
    date,
    sampleCount: 0,
    valueSum: 0,
    valueMin: null,
    valueMax: null,
    valueLatest: null,
    latestObservedAt: null,
  };
}

function updateDailySummaryAccumulator(summary: DailySummaryAccumulator, row: ObservationRow) {
  const value = row.valueNumeric;
  if (value === null) {
    return;
  }

  summary.sampleCount += 1;
  summary.valueSum += value;
  summary.valueMin = summary.valueMin === null ? value : Math.min(summary.valueMin, value);
  summary.valueMax = summary.valueMax === null ? value : Math.max(summary.valueMax, value);

  if (!summary.latestObservedAt || row.observedAt >= summary.latestObservedAt) {
    summary.latestObservedAt = row.observedAt;
    summary.valueLatest = value;
  }
}
