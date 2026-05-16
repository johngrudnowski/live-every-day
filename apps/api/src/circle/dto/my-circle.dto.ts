import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CirclePermissionDto {
  @ApiProperty({ example: 'weekly_score' })
  key!: string;

  @ApiProperty({ example: 'Weekly score' })
  label!: string;

  @ApiProperty({ example: 'checkins' })
  category!: string;
}

export class CircleSupportPersonDto {
  @ApiProperty({ example: 'support-id' })
  id!: string;

  @ApiProperty({ example: 'Ashton Grudnowski' })
  displayName!: string;

  @ApiPropertyOptional({ example: 'AG', nullable: true })
  initials!: string | null;

  @ApiPropertyOptional({ example: 'Spouse', nullable: true })
  relationship!: string | null;

  @ApiProperty({ example: 'my_number_one' })
  role!: string;

  @ApiProperty({ example: 'active' })
  inviteStatus!: string;

  @ApiProperty({ example: 'Active' })
  stateLabel!: string;

  @ApiProperty({ enum: ['active', 'attention', 'muted'], example: 'active' })
  stateTone!: 'active' | 'attention' | 'muted';

  @ApiProperty({ example: 'Weekly summary access · Since Jan 2025' })
  detailLine!: string;

  @ApiProperty({ type: CirclePermissionDto, isArray: true })
  permissions!: CirclePermissionDto[];

  @ApiPropertyOptional({ example: 'linked-user-id', nullable: true })
  linkedUserId!: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class CircleCareTeamPersonDto {
  @ApiProperty({ example: 'care-team-id' })
  id!: string;

  @ApiProperty({ example: 'Dr. Wolanskyj-Spinner' })
  displayName!: string;

  @ApiPropertyOptional({ example: 'WS', nullable: true })
  initials!: string | null;

  @ApiProperty({ example: 'hematologist' })
  role!: string;

  @ApiPropertyOptional({ example: 'Hematology', nullable: true })
  specialty!: string | null;

  @ApiPropertyOptional({ example: 'Mayo Clinic', nullable: true })
  organization!: string | null;

  @ApiProperty({ example: 'connected' })
  connectionStatus!: string;

  @ApiProperty({ example: 'Connected' })
  stateLabel!: string;

  @ApiProperty({ enum: ['active', 'attention', 'muted'], example: 'active' })
  stateTone!: 'active' | 'attention' | 'muted';

  @ApiProperty({ example: 'Hematology · Mayo Clinic · Apr 14' })
  detailLine!: string;

  @ApiPropertyOptional({ example: '2026-06-14T14:00:00.000Z', nullable: true })
  nextAppointmentAt!: string | null;

  @ApiPropertyOptional({ example: 'provider-user-id', nullable: true })
  providerUserId!: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class MyCircleDto {
  @ApiProperty({ type: CircleSupportPersonDto, isArray: true })
  supportPeople!: CircleSupportPersonDto[];

  @ApiProperty({ type: CircleCareTeamPersonDto, isArray: true })
  careTeamPeople!: CircleCareTeamPersonDto[];
}
