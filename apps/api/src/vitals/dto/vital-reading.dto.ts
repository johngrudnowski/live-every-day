import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
