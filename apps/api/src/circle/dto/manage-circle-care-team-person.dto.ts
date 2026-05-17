import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveCircleCareTeamPersonDto {
  @ApiProperty({ example: 'Dr. Wolanskyj-Spinner' })
  displayName!: string;

  @ApiPropertyOptional({ type: String, example: 'Hematology', nullable: true })
  specialty?: string | null;

  @ApiPropertyOptional({ type: String, example: 'Mayo Clinic', nullable: true })
  organization?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '200 1st St SW, Rochester, MN 55905',
    nullable: true,
  })
  address?: string | null;

  @ApiPropertyOptional({ type: String, example: '(507) 284-2511', nullable: true })
  phoneNumber?: string | null;
}
