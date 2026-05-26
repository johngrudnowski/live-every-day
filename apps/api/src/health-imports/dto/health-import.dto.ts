import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthImportIssueDto {
  @ApiProperty({ example: 'unknown_metric' })
  code!: string;

  @ApiProperty({ enum: ['error', 'warning'], example: 'error' })
  severity!: string;

  @ApiProperty({ example: 'Choose a lab metric before importing this row.' })
  message!: string;
}

export class HealthImportJobDto {
  @ApiProperty({ example: 'health_import_123' })
  id!: string;

  @ApiProperty({ example: 'needs_review' })
  status!: string;

  @ApiProperty({ example: 'manual_lab_entry' })
  sourceId!: string;

  @ApiProperty({ example: 'manual' })
  inputKind!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Manual lab entry',
  })
  sourceLabel!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  observedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class HealthImportCandidateDto {
  @ApiProperty({ example: 'health_candidate_123' })
  id!: string;

  @ApiProperty({ example: 'Platelets' })
  rawLabel!: string;

  @ApiProperty({ example: '842' })
  rawValue!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'x10^3/uL' })
  rawUnit!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '150-450' })
  rawReferenceRange!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  rawObservedAt!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'lab_platelets',
  })
  normalizedMetricKey!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Platelets' })
  normalizedMetricLabel!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 842 })
  normalizedValueNumeric!: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'x10^3/uL' })
  normalizedUnit!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  normalizedObservedAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'CBC' })
  panelLabel!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'high' })
  abnormalFlag!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1 })
  confidence!: number | null;

  @ApiProperty({ type: HealthImportIssueDto, isArray: true })
  issues!: HealthImportIssueDto[];

  @ApiProperty({ example: 'candidate' })
  status!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  committedObservationId!: string | null;
}

export class HealthImportDto {
  @ApiProperty({ type: HealthImportJobDto })
  job!: HealthImportJobDto;

  @ApiProperty({ type: HealthImportCandidateDto, isArray: true })
  candidates!: HealthImportCandidateDto[];
}

export class HealthImportListItemDto extends HealthImportJobDto {
  @ApiProperty({ example: 3 })
  candidateCount!: number;
}

export class HealthImportListDto {
  @ApiProperty({ type: HealthImportListItemDto, isArray: true })
  imports!: HealthImportListItemDto[];
}
