import { ApiPropertyOptional } from '@nestjs/swagger';

export class SaveVitalReadingDto {
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

  @ApiPropertyOptional({ example: '2026-05-14T16:20:00.000Z' })
  recordedAt?: string;
}
