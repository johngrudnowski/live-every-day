import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveHealthObservationItemDto {
  @ApiProperty({ example: 'heart_rate' })
  metricKey!: string;

  @ApiPropertyOptional({ type: Number, example: 72 })
  valueNumeric?: number;

  @ApiPropertyOptional({ type: String, example: 'steady' })
  valueText?: string;

  @ApiPropertyOptional({ type: Boolean, example: true })
  valueBoolean?: boolean;

  @ApiPropertyOptional({ example: 'bpm' })
  unit?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  observedAt?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  startedAt?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endedAt?: string;

  @ApiPropertyOptional({ example: 'point' })
  aggregationKind?: string;
}

export class SaveHealthObservationGroupDto {
  @ApiPropertyOptional({ example: 'manual_entry' })
  type?: string;
}

export class SaveHealthObservationsDto {
  @ApiPropertyOptional({ example: 'manual' })
  source?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  observedAt?: string;

  @ApiPropertyOptional({ type: SaveHealthObservationGroupDto })
  group?: SaveHealthObservationGroupDto;

  @ApiProperty({ type: SaveHealthObservationItemDto, isArray: true })
  observations!: SaveHealthObservationItemDto[];
}

export class SaveHealthVitalReadingDto {
  @ApiPropertyOptional({ example: 132 })
  systolicMmHg?: number;

  @ApiPropertyOptional({ example: 84 })
  diastolicMmHg?: number;

  @ApiPropertyOptional({ example: 72 })
  pulseBpm?: number;

  @ApiPropertyOptional({ example: 98.4 })
  temperatureF?: number;

  @ApiPropertyOptional({ example: 97 })
  oxygenSaturationPercent?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  recordedAt?: string;
}
