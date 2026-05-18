import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveCircleAppointmentDto {
  @ApiProperty({ example: 'care-team-id' })
  careTeamPersonId!: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-06-09T14:00:00.000Z' })
  scheduledAt!: string;

  @ApiPropertyOptional({ type: String, example: 'Mayo Clinic', nullable: true })
  location?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Ask about symptom trends and recent labs.',
    nullable: true,
  })
  notes?: string | null;
}

export class CircleAppointmentDto {
  @ApiProperty({ example: 'appointment-id' })
  id!: string;

  @ApiProperty({ example: 'care-team-id' })
  careTeamPersonId!: string;

  @ApiProperty({ example: 'Dr. Wolanskyj-Spinner' })
  careTeamDisplayName!: string;

  @ApiPropertyOptional({ type: String, example: 'Hematology', nullable: true })
  careTeamSpecialty!: string | null;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-06-09T14:00:00.000Z' })
  scheduledAt!: string;

  @ApiPropertyOptional({ type: String, example: 'Mayo Clinic', nullable: true })
  location!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Ask about symptom trends and recent labs.',
    nullable: true,
  })
  notes!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
