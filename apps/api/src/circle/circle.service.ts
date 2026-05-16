import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { DbClient } from 'database/client';
import {
  circleCareTeamPeople,
  circlePermissionDefinitions,
  circleSupportInvitations,
  circleSupportMessages,
  circleSupportPeople,
  circleSupportPersonPermissionGrants,
  user as authUsers,
} from 'database/schema';
import type { AuthenticatedUser } from '../auth/auth-session.service';
import { DB_CLIENT } from '../database/database.constants';
import type { CreateSupportPersonInviteDto } from './dto/circle-invite.dto';
import type { SendCircleSupportMessageDto } from './dto/circle-message.dto';

type CircleSupportPersonRow = typeof circleSupportPeople.$inferSelect;
type CircleCareTeamPersonRow = typeof circleCareTeamPeople.$inferSelect;
type CircleInvitationRow = typeof circleSupportInvitations.$inferSelect;
type CircleStateTone = 'active' | 'attention' | 'muted';
type CirclePermission = {
  key: string;
  label: string;
  category: string;
};

const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const monthYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

@Injectable()
export class CircleService {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async getMyCircle(userId: string) {
    const [supportPeople, careTeamPeople, permissionRows] = await Promise.all([
      this.db
        .select()
        .from(circleSupportPeople)
        .where(eq(circleSupportPeople.userId, userId))
        .orderBy(asc(circleSupportPeople.sortOrder), asc(circleSupportPeople.displayName)),
      this.db
        .select()
        .from(circleCareTeamPeople)
        .where(eq(circleCareTeamPeople.userId, userId))
        .orderBy(asc(circleCareTeamPeople.sortOrder), asc(circleCareTeamPeople.displayName)),
      this.db
        .select({
          supportPersonId: circleSupportPersonPermissionGrants.supportPersonId,
          key: circlePermissionDefinitions.key,
          label: circlePermissionDefinitions.label,
          category: circlePermissionDefinitions.category,
        })
        .from(circleSupportPersonPermissionGrants)
        .innerJoin(
          circlePermissionDefinitions,
          eq(circleSupportPersonPermissionGrants.permissionKey, circlePermissionDefinitions.key),
        )
        .where(
          and(
            eq(circleSupportPersonPermissionGrants.userId, userId),
            isNull(circleSupportPersonPermissionGrants.revokedAt),
          ),
        )
        .orderBy(
          asc(circleSupportPersonPermissionGrants.supportPersonId),
          asc(circlePermissionDefinitions.sortOrder),
          asc(circlePermissionDefinitions.label),
        ),
    ]);
    const permissionsBySupportPersonId = groupPermissionsBySupportPersonId(permissionRows);

    return {
      supportPeople: supportPeople.map((person) =>
        mapSupportPerson(person, permissionsBySupportPersonId.get(person.id) ?? []),
      ),
      careTeamPeople: careTeamPeople.map(mapCareTeamPerson),
    };
  }

  async createSupportPersonInvite(user: AuthenticatedUser, dto: CreateSupportPersonInviteDto) {
    const now = new Date();
    const displayName = normalizeRequiredText(dto.displayName, 'Display name');
    const supportPersonId = createId('circle_support');
    const token = generateInviteToken();
    const invitationId = createId('circle_invitation');
    const expiresAt = addDays(now, 14);
    const deliveryMethod = resolveDeliveryMethod(dto);
    const permissionKeys = normalizePermissionKeys(dto.permissionKeys);

    const existing = await this.db
      .select({ id: circleSupportPeople.id })
      .from(circleSupportPeople)
      .where(
        and(
          eq(circleSupportPeople.userId, user.id),
          eq(circleSupportPeople.displayName, displayName),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('This person is already in your support circle.');
    }

    if (permissionKeys.length > 0) {
      await this.assertPermissionKeysExist(permissionKeys);
    }

    await this.db.transaction(async (tx) => {
      await tx.insert(circleSupportPeople).values({
        id: supportPersonId,
        userId: user.id,
        displayName,
        initials: normalizeOptionalText(dto.initials),
        relationship: normalizeOptionalText(dto.relationship),
        role: 'support',
        inviteStatus: 'pending',
        invitationEmail: normalizeOptionalText(dto.invitationEmail),
        invitationPhone: normalizeOptionalText(dto.invitationPhone),
        invitedAt: now,
        updatedAt: now,
      });

      if (permissionKeys.length > 0) {
        await tx.insert(circleSupportPersonPermissionGrants).values(
          permissionKeys.map((permissionKey) => ({
            id: createId('circle_permission_grant'),
            supportPersonId,
            userId: user.id,
            permissionKey,
            grantedByUserId: user.id,
            grantedAt: now,
            updatedAt: now,
          })),
        );
      }

      await tx.insert(circleSupportInvitations).values({
        id: invitationId,
        supportPersonId,
        inviterUserId: user.id,
        tokenHash: hashInviteToken(token),
        deliveryMethod,
        recipientEmail: normalizeOptionalText(dto.invitationEmail),
        recipientPhone: normalizeOptionalText(dto.invitationPhone),
        expiresAt,
        lastSentAt: now,
        updatedAt: now,
      });
    });

    return {
      supportPersonId,
      invitation: mapInvitationLink(invitationId, token, expiresAt),
    };
  }

  async regenerateSupportInvitation(
    user: AuthenticatedUser,
    supportPersonId: string,
    deliveryMethod?: string,
  ) {
    const now = new Date();
    const supportPerson = await this.getOwnedSupportPerson(user.id, supportPersonId);

    if (supportPerson.linkedUserId) {
      throw new ConflictException('This support person has already accepted their invite.');
    }

    const token = generateInviteToken();
    const invitationId = createId('circle_invitation');
    const expiresAt = addDays(now, 14);
    const resolvedDeliveryMethod = normalizeDeliveryMethod(deliveryMethod) ?? 'copied_link';

    await this.db.transaction(async (tx) => {
      await tx
        .update(circleSupportInvitations)
        .set({
          revokedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(circleSupportInvitations.supportPersonId, supportPersonId),
            isNull(circleSupportInvitations.acceptedAt),
            isNull(circleSupportInvitations.revokedAt),
          ),
        );

      await tx.insert(circleSupportInvitations).values({
        id: invitationId,
        supportPersonId,
        inviterUserId: user.id,
        tokenHash: hashInviteToken(token),
        deliveryMethod: resolvedDeliveryMethod,
        recipientEmail: supportPerson.invitationEmail,
        recipientPhone: supportPerson.invitationPhone,
        expiresAt,
        lastSentAt: now,
        updatedAt: now,
      });

      await tx
        .update(circleSupportPeople)
        .set({
          inviteStatus: 'pending',
          invitedAt: now,
          updatedAt: now,
        })
        .where(eq(circleSupportPeople.id, supportPersonId));
    });

    return mapInvitationLink(invitationId, token, expiresAt);
  }

  async previewInvitation(token: string) {
    const { invitation, supportPerson, inviter } = await this.getInvitationContext(token);

    return {
      status: getInvitationStatus(invitation, new Date()),
      inviterDisplayName: inviter.name,
      supportDisplayName: supportPerson.displayName,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async acceptInvitation(token: string, user: AuthenticatedUser) {
    const now = new Date();
    const { invitation, supportPerson, inviter } = await this.getInvitationContext(token);
    const status = getInvitationStatus(invitation, now);

    if (status !== 'pending') {
      throw new ConflictException(`This invitation is ${status}.`);
    }

    if (supportPerson.userId === user.id) {
      throw new BadRequestException('You cannot accept your own support invitation.');
    }

    if (supportPerson.linkedUserId && supportPerson.linkedUserId !== user.id) {
      throw new ConflictException('This support invitation has already been accepted.');
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(circleSupportPeople)
        .set({
          linkedUserId: user.id,
          inviteStatus: 'active',
          acceptedAt: now,
          updatedAt: now,
        })
        .where(eq(circleSupportPeople.id, supportPerson.id));

      await tx
        .update(circleSupportInvitations)
        .set({
          acceptedAt: now,
          updatedAt: now,
        })
        .where(eq(circleSupportInvitations.id, invitation.id));
    });

    return {
      supportPersonId: supportPerson.id,
      inviterDisplayName: inviter.name,
      inviteStatus: 'active',
    };
  }

  async sendSupportMessage(
    user: AuthenticatedUser,
    supportPersonId: string,
    dto: SendCircleSupportMessageDto,
  ) {
    const body = normalizeRequiredText(dto.body, 'Message');

    if (body.length > 500) {
      throw new BadRequestException('Message must be 500 characters or less.');
    }

    const supportPerson = await this.getSupportPerson(supportPersonId);

    if (supportPerson.linkedUserId !== user.id) {
      throw new ForbiddenException(
        'You can only message through your accepted support connection.',
      );
    }

    const now = new Date();
    const messageId = createId('circle_message');

    await this.db.transaction(async (tx) => {
      await tx.insert(circleSupportMessages).values({
        id: messageId,
        supportPersonId,
        patientUserId: supportPerson.userId,
        authorUserId: user.id,
        body,
        createdAt: now,
        updatedAt: now,
      });

      await tx
        .update(circleSupportPeople)
        .set({
          lastMessageAt: now,
          updatedAt: now,
        })
        .where(eq(circleSupportPeople.id, supportPersonId));
    });

    return {
      id: messageId,
      supportPersonId,
      supportDisplayName: supportPerson.displayName,
      body,
      createdAt: now.toISOString(),
    };
  }

  async getSupportMessages(userId: string) {
    const messages = await this.db
      .select({
        id: circleSupportMessages.id,
        supportPersonId: circleSupportMessages.supportPersonId,
        supportDisplayName: circleSupportPeople.displayName,
        body: circleSupportMessages.body,
        createdAt: circleSupportMessages.createdAt,
      })
      .from(circleSupportMessages)
      .innerJoin(
        circleSupportPeople,
        eq(circleSupportMessages.supportPersonId, circleSupportPeople.id),
      )
      .where(eq(circleSupportMessages.patientUserId, userId))
      .orderBy(desc(circleSupportMessages.createdAt));

    return messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    }));
  }

  private async getOwnedSupportPerson(userId: string, supportPersonId: string) {
    const supportPerson = await this.db
      .select()
      .from(circleSupportPeople)
      .where(
        and(eq(circleSupportPeople.id, supportPersonId), eq(circleSupportPeople.userId, userId)),
      )
      .limit(1);

    if (!supportPerson[0]) {
      throw new NotFoundException('Support person not found.');
    }

    return supportPerson[0];
  }

  private async getSupportPerson(supportPersonId: string) {
    const supportPerson = await this.db
      .select()
      .from(circleSupportPeople)
      .where(eq(circleSupportPeople.id, supportPersonId))
      .limit(1);

    if (!supportPerson[0]) {
      throw new NotFoundException('Support person not found.');
    }

    return supportPerson[0];
  }

  private async assertPermissionKeysExist(permissionKeys: string[]) {
    const definitions = await this.db
      .select({ key: circlePermissionDefinitions.key })
      .from(circlePermissionDefinitions)
      .where(inArray(circlePermissionDefinitions.key, permissionKeys));
    const knownKeys = new Set(definitions.map((definition) => definition.key));
    const unknownKeys = permissionKeys.filter((key) => !knownKeys.has(key));

    if (unknownKeys.length > 0) {
      throw new BadRequestException(`Unknown permission keys: ${unknownKeys.join(', ')}`);
    }
  }

  private async getInvitationContext(token: string) {
    const tokenHash = hashInviteToken(normalizeRequiredText(token, 'Invitation token'));
    const invitationRows = await this.db
      .select()
      .from(circleSupportInvitations)
      .where(eq(circleSupportInvitations.tokenHash, tokenHash))
      .limit(1);
    const invitation = invitationRows[0];

    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }

    const [supportPersonRows, inviterRows] = await Promise.all([
      this.db
        .select()
        .from(circleSupportPeople)
        .where(eq(circleSupportPeople.id, invitation.supportPersonId))
        .limit(1),
      this.db
        .select({ id: authUsers.id, name: authUsers.name })
        .from(authUsers)
        .where(eq(authUsers.id, invitation.inviterUserId))
        .limit(1),
    ]);
    const supportPerson = supportPersonRows[0];
    const inviter = inviterRows[0];

    if (!supportPerson || !inviter) {
      throw new NotFoundException('Invitation target not found.');
    }

    return { invitation, supportPerson, inviter };
  }
}

function mapSupportPerson(row: CircleSupportPersonRow, permissions: CirclePermission[]) {
  return {
    id: row.id,
    displayName: row.displayName,
    initials: row.initials,
    relationship: row.relationship,
    role: row.role,
    inviteStatus: row.inviteStatus,
    stateLabel: getInviteStateLabel(row.inviteStatus),
    stateTone: getInviteStateTone(row.inviteStatus),
    detailLine: getSupportDetailLine(row, permissions),
    permissions,
    linkedUserId: row.linkedUserId,
    sortOrder: row.sortOrder,
  };
}

function mapCareTeamPerson(row: CircleCareTeamPersonRow) {
  return {
    id: row.id,
    displayName: row.displayName,
    initials: row.initials,
    role: row.role,
    specialty: row.specialty,
    organization: row.organization,
    connectionStatus: row.connectionStatus,
    stateLabel: getConnectionStateLabel(row.connectionStatus),
    stateTone: getConnectionStateTone(row.connectionStatus),
    detailLine: getCareTeamDetailLine(row),
    nextAppointmentAt: row.nextAppointmentAt?.toISOString() ?? null,
    providerUserId: row.providerUserId,
    sortOrder: row.sortOrder,
  };
}

function getSupportDetailLine(row: CircleSupportPersonRow, permissions: CirclePermission[]) {
  if (row.role === 'my_number_one') {
    const permissionLabels = permissions.map(formatPermissionAccessLabel);
    const since = row.acceptedAt ? `Since ${monthYearFormatter.format(row.acceptedAt)}` : null;

    return [permissionLabels[0] ?? 'Primary support person', since].filter(Boolean).join(' · ');
  }

  if (row.inviteStatus === 'pending') {
    return row.invitedAt
      ? `Invited ${monthDayFormatter.format(row.invitedAt)}`
      : 'Invitation pending';
  }

  if (row.lastMessageAt) {
    return `Left a message · ${monthDayFormatter.format(row.lastMessageAt)}`;
  }

  if (row.acceptedAt) {
    return `Active since ${monthYearFormatter.format(row.acceptedAt)}`;
  }

  return row.relationship ?? 'In your support circle';
}

function getCareTeamDetailLine(row: CircleCareTeamPersonRow) {
  const parts = [
    row.specialty,
    row.organization,
    row.nextAppointmentAt ? `Next visit ${monthDayFormatter.format(row.nextAppointmentAt)}` : null,
  ];

  return parts.filter(Boolean).join(' · ') || 'Care team member';
}

function getInviteStateLabel(inviteStatus: string) {
  if (inviteStatus === 'pending') {
    return 'Pending';
  }

  if (inviteStatus === 'active') {
    return 'Active';
  }

  return formatStateLabel(inviteStatus);
}

function getConnectionStateLabel(connectionStatus: string) {
  if (connectionStatus === 'connected') {
    return 'Connected';
  }

  return formatStateLabel(connectionStatus);
}

function getInviteStateTone(inviteStatus: string): CircleStateTone {
  if (inviteStatus === 'pending') {
    return 'attention';
  }

  if (inviteStatus === 'active') {
    return 'active';
  }

  return 'muted';
}

function getConnectionStateTone(connectionStatus: string): CircleStateTone {
  return connectionStatus === 'connected' ? 'active' : 'muted';
}

function groupPermissionsBySupportPersonId(
  rows: Array<CirclePermission & { supportPersonId: string }>,
) {
  const permissionsBySupportPersonId = new Map<string, CirclePermission[]>();

  for (const row of rows) {
    const permissions = permissionsBySupportPersonId.get(row.supportPersonId) ?? [];
    permissions.push({
      key: row.key,
      label: row.label,
      category: row.category,
    });
    permissionsBySupportPersonId.set(row.supportPersonId, permissions);
  }

  return permissionsBySupportPersonId;
}

function formatPermissionAccessLabel(permission: CirclePermission) {
  return `${permission.label} access`;
}

function formatStateLabel(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

function generateInviteToken() {
  return randomBytes(32).toString('base64url');
}

function hashInviteToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function mapInvitationLink(id: string, token: string, expiresAt: Date) {
  return {
    id,
    inviteUrl: `${getInviteBaseUrl()}/circle/invite/${token}`,
    expiresAt: expiresAt.toISOString(),
  };
}

function getInviteBaseUrl() {
  return (
    process.env.CIRCLE_INVITE_BASE_URL ??
    process.env.APP_PUBLIC_URL ??
    process.env.WEB_URL ??
    'http://localhost:8081'
  ).replace(/\/$/, '');
}

function resolveDeliveryMethod(dto: CreateSupportPersonInviteDto) {
  const deliveryMethod = normalizeDeliveryMethod(dto.deliveryMethod);

  if (deliveryMethod) {
    return deliveryMethod;
  }

  if (dto.invitationEmail) {
    return 'email';
  }

  if (dto.invitationPhone) {
    return 'sms';
  }

  return 'copied_link';
}

function normalizeDeliveryMethod(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (normalized === 'email' || normalized === 'sms' || normalized === 'copied_link') {
    return normalized;
  }

  throw new BadRequestException('Delivery method must be email, sms, or copied_link.');
}

function normalizePermissionKeys(permissionKeys: string[] | undefined) {
  return Array.from(new Set((permissionKeys ?? []).map((key) => key.trim()).filter(Boolean)));
}

function normalizeRequiredText(value: string | undefined, label: string) {
  const normalized = value?.trim();

  if (!normalized) {
    throw new BadRequestException(`${label} is required.`);
  }

  return normalized;
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getInvitationStatus(invitation: CircleInvitationRow, now: Date) {
  if (invitation.revokedAt) {
    return 'revoked';
  }

  if (invitation.acceptedAt) {
    return 'accepted';
  }

  if (invitation.expiresAt.getTime() <= now.getTime()) {
    return 'expired';
  }

  return 'pending';
}
