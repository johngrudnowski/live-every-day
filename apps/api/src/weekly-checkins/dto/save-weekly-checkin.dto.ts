import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveWeeklyCheckinDraftDto {
  @ApiProperty({ example: 'weekly-checkin-core' })
  definitionId!: string;

  @ApiProperty({ example: 1 })
  definitionVersion!: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      energy: 7,
      night_sweats: 'some',
    },
  })
  answers!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'fatigue' })
  currentQuestionId?: string;
}

export class SubmitWeeklyCheckinDto {
  @ApiProperty({ example: 'weekly-checkin-core' })
  definitionId!: string;

  @ApiProperty({ example: 1 })
  definitionVersion!: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      energy: 7,
      night_sweats: 'some',
    },
  })
  answers!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Fatigue was worse after treatment.' })
  customNote?: string;
}
