import { ApiProperty } from '@nestjs/swagger';

export class SaveConditionProfileDto {
  @ApiProperty({ example: 1 })
  conditionDefinitionVersion!: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      'diagnosis.mpn.subtypes': ['essential_thrombocythemia'],
      'diagnosis.mpn.driverMutation': 'jak2_positive',
    },
  })
  values!: Record<string, unknown>;
}
