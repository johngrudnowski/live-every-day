import { ApiProperty } from '@nestjs/swagger';

export class ConditionRegistryItemDto {
  @ApiProperty({ example: 'mpn' })
  id!: string;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: 'MPNs' })
  label!: string;

  @ApiProperty({ example: 'ET, PV, or Myelofibrosis' })
  subtitle!: string;

  @ApiProperty({ enum: ['active', 'coming_soon', 'hidden'], example: 'active' })
  status!: string;
}

export class ConditionDefinitionDto {
  @ApiProperty({ example: 'mpn' })
  id!: string;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: 'MPNs' })
  label!: string;

  @ApiProperty({ example: 'ET, PV, or Myelofibrosis' })
  subtitle!: string;

  @ApiProperty({ enum: ['active', 'coming_soon', 'hidden'], example: 'active' })
  status!: string;

  @ApiProperty({ example: 'led.conditionProfile.v1' })
  profileSchemaId!: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  fields!: unknown[];

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  flow!: unknown[];

  @ApiProperty({ type: 'object', additionalProperties: true })
  outputs!: Record<string, unknown>;
}
