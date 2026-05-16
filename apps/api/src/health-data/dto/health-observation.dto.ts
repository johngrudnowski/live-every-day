import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthObservationDto {
  @ApiProperty({ example: 'observation-id' })
  id!: string;

  @ApiProperty({ example: 'heart_rate' })
  metricKey!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'manual' })
  sourceId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'group-id' })
  observationGroupId!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 72 })
  valueNumeric!: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  valueText!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  valueBoolean!: boolean | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'bpm' })
  unit!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  observedAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endedAt!: string | null;

  @ApiProperty({ example: 'point' })
  aggregationKind!: string;
}

export class HealthObservationListDto {
  @ApiProperty({ type: HealthObservationDto, isArray: true })
  observations!: HealthObservationDto[];
}

export class LatestHealthObservationsDto {
  @ApiProperty({ type: HealthObservationDto, isArray: true })
  observations!: HealthObservationDto[];
}

export class DailyHealthMetricSummaryDto {
  @ApiProperty({ example: 'steps' })
  metricKey!: string;

  @ApiProperty({ example: '2026-05-15' })
  date!: string;

  @ApiProperty({ example: 12 })
  sampleCount!: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  valueSum!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  valueAvg!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  valueMin!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  valueMax!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  valueLatest!: number | null;
}

export class DailyHealthSummaryDto {
  @ApiProperty({ type: DailyHealthMetricSummaryDto, isArray: true })
  summaries!: DailyHealthMetricSummaryDto[];
}

export class VitalReadingDto {
  @ApiProperty({ example: 'reading-id' })
  id!: string;

  @ApiProperty({ example: 'manual' })
  source!: string;

  @ApiPropertyOptional({ type: Number, example: 132, nullable: true })
  systolicMmHg!: number | null;

  @ApiPropertyOptional({ type: Number, example: 84, nullable: true })
  diastolicMmHg!: number | null;

  @ApiPropertyOptional({ type: Number, example: 72, nullable: true })
  pulseBpm!: number | null;

  @ApiPropertyOptional({ type: Number, example: 98.4, nullable: true })
  temperatureF!: number | null;

  @ApiPropertyOptional({ type: Number, example: 97, nullable: true })
  oxygenSaturationPercent!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class LatestVitalReadingDto {
  @ApiPropertyOptional({ type: VitalReadingDto, nullable: true })
  latestReading!: VitalReadingDto | null;
}

export class VitalMetricSummaryDto {
  @ApiProperty({
    enum: ['blood_pressure', 'pulse', 'temperature', 'oxygen_saturation'],
    example: 'blood_pressure',
  })
  key!: string;

  @ApiProperty({ example: 'Blood pressure' })
  label!: string;

  @ApiPropertyOptional({ type: String, example: '132/84', nullable: true })
  value!: string | null;

  @ApiPropertyOptional({ type: String, example: 'mmHg', nullable: true })
  unit!: string | null;

  @ApiProperty({ example: 'Slightly elevated' })
  status!: string;

  @ApiProperty({ enum: ['ok', 'warning', 'high', 'empty'], example: 'warning' })
  statusTone!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  recordedAt!: string | null;

  @ApiProperty({ example: 4 })
  readingCount!: number;
}

export class VitalMetricsSummaryDto {
  @ApiProperty({ example: 30 })
  windowDays!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  windowStart!: string;

  @ApiProperty({ type: VitalMetricSummaryDto, isArray: true })
  metrics!: VitalMetricSummaryDto[];
}
