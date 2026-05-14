import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { DbClient } from 'database/client';
import { vitalReadings } from 'database/schema';
import { DB_CLIENT } from '../database/database.constants';
import type { SaveVitalReadingDto } from './dto/save-vital-reading.dto';

type VitalReadingRow = typeof vitalReadings.$inferSelect;

@Injectable()
export class VitalsService {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async getLatestReading(userId: string) {
    const [row] = await this.db
      .select()
      .from(vitalReadings)
      .where(eq(vitalReadings.userId, userId))
      .orderBy(desc(vitalReadings.recordedAt))
      .limit(1);

    return {
      latestReading: row ? mapVitalReadingRow(row) : null,
    };
  }

  async saveReading(userId: string, dto: SaveVitalReadingDto) {
    const reading = validateReading(dto);
    const now = new Date();

    const [row] = await this.db
      .insert(vitalReadings)
      .values({
        id: randomUUID(),
        userId,
        source: 'manual',
        systolicMmHg: reading.systolicMmHg,
        diastolicMmHg: reading.diastolicMmHg,
        pulseBpm: reading.pulseBpm,
        temperatureFTenths: reading.temperatureFTenths,
        oxygenSaturationPercent: reading.oxygenSaturationPercent,
        recordedAt: reading.recordedAt,
        updatedAt: now,
      })
      .returning();

    return mapVitalReadingRow(row);
  }
}

function validateReading(dto: SaveVitalReadingDto) {
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
  const temperatureFTenths = readOptionalTemperature(dto.temperatureF);

  if (
    systolicMmHg === null &&
    pulseBpm === null &&
    oxygenSaturationPercent === null &&
    temperatureFTenths === null
  ) {
    throw new BadRequestException('At least one vital sign is required.');
  }

  return {
    systolicMmHg,
    diastolicMmHg,
    pulseBpm,
    oxygenSaturationPercent,
    temperatureFTenths,
    recordedAt: readRecordedAt(dto.recordedAt),
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

  return Math.round(value * 10);
}

function readRecordedAt(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return new Date();
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('Recorded time must be an ISO date string.');
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Recorded time must be a valid ISO date string.');
  }

  return date;
}

function mapVitalReadingRow(row: VitalReadingRow) {
  return {
    id: row.id,
    source: row.source,
    systolicMmHg: row.systolicMmHg,
    diastolicMmHg: row.diastolicMmHg,
    pulseBpm: row.pulseBpm,
    temperatureF: row.temperatureFTenths === null ? null : Math.round(row.temperatureFTenths) / 10,
    oxygenSaturationPercent: row.oxygenSaturationPercent,
    recordedAt: row.recordedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
