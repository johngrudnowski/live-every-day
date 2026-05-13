import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConditionOnboardingStateDto {
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  skippedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;
}

export class UserConditionProfileSummaryDto {
  @ApiProperty({ example: 'profile-id' })
  id!: string;

  @ApiProperty({ example: 'mpn' })
  conditionId!: string;

  @ApiProperty({ example: 1 })
  conditionVersion!: number;

  @ApiProperty({ type: 'object', additionalProperties: true })
  profile!: Record<string, unknown>;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class ConditionSummaryDto {
  @ApiProperty({ example: true })
  hasConditionProfile!: boolean;

  @ApiPropertyOptional({ type: UserConditionProfileSummaryDto, nullable: true })
  activeConditionProfile!: UserConditionProfileSummaryDto | null;

  @ApiPropertyOptional({ type: UserConditionProfileSummaryDto, nullable: true })
  draftConditionProfile!: UserConditionProfileSummaryDto | null;

  @ApiProperty({ type: ConditionOnboardingStateDto })
  onboarding!: ConditionOnboardingStateDto;
}
