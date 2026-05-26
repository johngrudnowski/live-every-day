import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHealthImportCandidateDto {
  @ApiPropertyOptional({ example: 'Platelets' })
  rawLabel?: string;

  @ApiPropertyOptional({ example: '842' })
  rawValue?: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'x10^3/uL' })
  rawUnit?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '150-450' })
  rawReferenceRange?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'lab_platelets',
  })
  normalizedMetricKey?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  normalizedObservedAt?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'high' })
  abnormalFlag?: string | null;

  @ApiPropertyOptional({
    enum: ['candidate', 'rejected'],
    example: 'candidate',
  })
  status?: 'candidate' | 'rejected';
}
