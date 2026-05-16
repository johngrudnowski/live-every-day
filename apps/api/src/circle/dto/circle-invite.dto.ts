import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupportPersonInviteDto {
  @ApiProperty({ example: 'Dylan Grudnowski' })
  displayName!: string;

  @ApiPropertyOptional({ example: 'Family' })
  relationship?: string;

  @ApiPropertyOptional({ example: 'DG' })
  initials?: string;

  @ApiPropertyOptional({ example: 'dylan@example.com' })
  invitationEmail?: string;

  @ApiPropertyOptional({ example: '+15555550123' })
  invitationPhone?: string;

  @ApiPropertyOptional({ example: 'email', enum: ['email', 'sms', 'copied_link'] })
  deliveryMethod?: 'email' | 'sms' | 'copied_link';

  @ApiPropertyOptional({ example: ['weekly_score', 'symptom_trends'], isArray: true })
  permissionKeys?: string[];
}

export class RegenerateSupportInvitationDto {
  @ApiPropertyOptional({ example: 'email', enum: ['email', 'sms', 'copied_link'] })
  deliveryMethod?: 'email' | 'sms' | 'copied_link';
}

export class CircleInvitationLinkDto {
  @ApiProperty({ example: 'circle_invitation_abc123' })
  id!: string;

  @ApiProperty({ example: 'https://app.liveeveryday.example/circle/invite/token' })
  inviteUrl!: string;

  @ApiProperty({ example: '2026-05-23T12:00:00.000Z' })
  expiresAt!: string;
}

export class CreateSupportPersonInviteResponseDto {
  @ApiProperty({ example: 'support-id' })
  supportPersonId!: string;

  @ApiProperty({ type: CircleInvitationLinkDto })
  invitation!: CircleInvitationLinkDto;
}

export class CircleInvitationPreviewDto {
  @ApiProperty({ example: 'pending', enum: ['pending', 'accepted', 'expired', 'revoked'] })
  status!: 'pending' | 'accepted' | 'expired' | 'revoked';

  @ApiProperty({ example: 'John Appleseed' })
  inviterDisplayName!: string;

  @ApiProperty({ example: 'Dylan Grudnowski' })
  supportDisplayName!: string;

  @ApiProperty({ example: '2026-05-23T12:00:00.000Z' })
  expiresAt!: string;
}

export class AcceptCircleInvitationResponseDto {
  @ApiProperty({ example: 'support-id' })
  supportPersonId!: string;

  @ApiProperty({ example: 'John Appleseed' })
  inviterDisplayName!: string;

  @ApiProperty({ example: 'active' })
  inviteStatus!: string;
}
