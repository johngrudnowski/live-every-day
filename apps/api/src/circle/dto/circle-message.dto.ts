import { ApiProperty } from '@nestjs/swagger';

export class SendCircleSupportMessageDto {
  @ApiProperty({ example: 'Thinking of you this week. You have got this.' })
  body!: string;
}

export class CircleSupportMessageDto {
  @ApiProperty({ example: 'message-id' })
  id!: string;

  @ApiProperty({ example: 'support-id' })
  supportPersonId!: string;

  @ApiProperty({ example: 'Dylan Grudnowski' })
  supportDisplayName!: string;

  @ApiProperty({ example: 'Thinking of you this week. You have got this.' })
  body!: string;

  @ApiProperty({ example: '2026-05-16T12:00:00.000Z' })
  createdAt!: string;
}
