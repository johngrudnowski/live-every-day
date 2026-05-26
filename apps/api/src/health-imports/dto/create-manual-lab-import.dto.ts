import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManualLabImportRowDto {
  @ApiProperty({ example: 'Platelets' })
  label!: string;

  @ApiProperty({ example: '842' })
  value!: string;

  @ApiPropertyOptional({ example: 'x10^3/uL' })
  unit?: string;

  @ApiPropertyOptional({ example: '150-450' })
  referenceRange?: string;

  @ApiPropertyOptional({ example: 'high' })
  abnormalFlag?: string;
}

export class CreateManualLabImportDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-05-19T12:00:00.000Z',
  })
  observedAt!: string;

  @ApiPropertyOptional({ example: 'CBC' })
  panelLabel?: string;

  @ApiPropertyOptional({ example: 'Manual lab entry' })
  sourceLabel?: string;

  @ApiProperty({ type: CreateManualLabImportRowDto, isArray: true })
  rows!: CreateManualLabImportRowDto[];
}
