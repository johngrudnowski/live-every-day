import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveWeeklyCheckinDraftDto {
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

  @ApiPropertyOptional({ example: 'Fatigue was worse after treatment.' })
  customNote?: string;
}

export class SubmitWeeklyCheckinDto {
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
