import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WeeklyCheckinOptionDto {
  @ApiProperty({ example: 'some' })
  value!: string;

  @ApiProperty({ example: 'Some' })
  label!: string;

  @ApiPropertyOptional({ example: 'A few days this week' })
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  score?: number;
}

export class WeeklyCheckinQuestionDto {
  @ApiProperty({ example: 'energy' })
  id!: string;

  @ApiProperty({ enum: ['number_scale', 'enum', 'free_text'], example: 'number_scale' })
  kind!: string;

  @ApiProperty({ example: 'How was your energy this week?' })
  title!: string;

  @ApiPropertyOptional({ example: 'Think about your average energy over the past 7 days.' })
  subtitle?: string;

  @ApiPropertyOptional({ example: true })
  required?: boolean;

  @ApiPropertyOptional({ example: 1 })
  min?: number;

  @ApiPropertyOptional({ example: 10 })
  max?: number;

  @ApiPropertyOptional({ example: 'Very low' })
  lowLabel?: string;

  @ApiPropertyOptional({ example: 'Strong' })
  highLabel?: string;

  @ApiPropertyOptional({
    enum: ['higher_is_better', 'lower_is_better'],
    example: 'higher_is_better',
  })
  scoreDirection?: string;

  @ApiPropertyOptional({ type: WeeklyCheckinOptionDto, isArray: true })
  options?: WeeklyCheckinOptionDto[];
}

export class WeeklyCheckinDefinitionDto {
  @ApiProperty({ example: 'weekly-checkin-core' })
  id!: string;

  @ApiPropertyOptional({ example: 'mpn', nullable: true })
  conditionId!: string | null;

  @ApiProperty({ example: 'Weekly Check-in' })
  title!: string;

  @ApiProperty({ type: WeeklyCheckinQuestionDto, isArray: true })
  questions!: WeeklyCheckinQuestionDto[];

  @ApiProperty({ type: WeeklyCheckinQuestionDto, isArray: true })
  deeperPrompts!: WeeklyCheckinQuestionDto[];
}

export class WeeklyCheckinScoreDto {
  @ApiProperty({ example: 48 })
  total!: number;

  @ApiProperty({ example: 100 })
  max!: number;

  @ApiProperty({ example: 44 })
  numericTotal!: number;

  @ApiProperty({ example: 4 })
  enumTotal!: number;

  @ApiProperty({ example: 48 })
  percent!: number;
}

export class WeeklyCheckinDto {
  @ApiProperty({ example: 'checkin-id' })
  id!: string;

  @ApiProperty({ example: 'weekly-checkin-core' })
  definitionId!: string;

  @ApiPropertyOptional({ example: 'mpn', nullable: true })
  conditionId!: string | null;

  @ApiProperty({ example: '2026-05-11' })
  weekStartDate!: string;

  @ApiProperty({ enum: ['draft', 'submitted'], example: 'submitted' })
  status!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  answers!: Record<string, unknown>;

  @ApiProperty({ type: WeeklyCheckinScoreDto })
  score!: WeeklyCheckinScoreDto;

  @ApiPropertyOptional({
    type: String,
    example: 'Fatigue was worse after treatment.',
    nullable: true,
  })
  customNote!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class WeeklyCheckinSummaryDto {
  @ApiProperty({ example: '2026-05-11' })
  weekStartDate!: string;

  @ApiProperty({ type: WeeklyCheckinDefinitionDto })
  activeDefinition!: WeeklyCheckinDefinitionDto;

  @ApiPropertyOptional({ type: WeeklyCheckinDto, nullable: true })
  currentCheckin!: WeeklyCheckinDto | null;

  @ApiPropertyOptional({ type: WeeklyCheckinDto, nullable: true })
  lastSubmittedCheckin!: WeeklyCheckinDto | null;

  @ApiPropertyOptional({ type: WeeklyCheckinDto, nullable: true })
  previousWeekCheckin!: WeeklyCheckinDto | null;

  @ApiProperty({ type: WeeklyCheckinDto, isArray: true })
  recentSubmittedCheckins!: WeeklyCheckinDto[];

  @ApiProperty({ example: false })
  hasCompletedCurrentWeek!: boolean;

  @ApiProperty({ example: true })
  shouldStartCheckin!: boolean;
}
