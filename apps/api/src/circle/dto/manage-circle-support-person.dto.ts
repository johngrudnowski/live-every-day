import { ApiProperty } from '@nestjs/swagger';

export class UpdateCircleSupportPersonDto {
  @ApiProperty({ example: 'Dylan Grudnowski' })
  displayName!: string;
}

export class UpdateCircleSupportPermissionsDto {
  @ApiProperty({ type: String, example: ['weekly_score', 'symptom_trends'], isArray: true })
  permissionKeys!: string[];
}
