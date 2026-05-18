import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, asc, desc, eq, gte, inArray, isNull, notInArray } from 'drizzle-orm';
import type { DbClient } from 'database/client';
import {
  circleCareTeamAppointments,
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
import type { SaveCircleAppointmentDto } from './dto/circle-appointment.dto';
import type { CreateSupportPersonInviteDto } from './dto/circle-invite.dto';
import type { SendCircleSupportMessageDto } from './dto/circle-message.dto';
import type { SaveCircleCareTeamPersonDto } from './dto/manage-circle-care-team-person.dto';
import type {
  UpdateCircleSupportPermissionsDto,
  UpdateCircleSupportPersonDto,
} from './dto/manage-circle-support-person.dto';

type CircleSupportPersonRow = typeof circleSupportPeople.$inferSelect;
type CircleCareTeamPersonRow = typeof circleCareTeamPeople.$inferSelect;
type CircleCareTeamAppointmentRow = typeof circleCareTeamAppointments.$inferSelect;
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

  async getPermissionDefinitions() {
    const definitions = await this.db
      .select()
      .from(circlePermissionDefinitions)
      .orderBy(asc(circlePermissionDefinitions.sortOrder), asc(circlePermissionDefinitions.label));

    return definitions.map((definition) => ({
      key: definition.key,
      label: definition.label,
      description: definition.description,
      category: definition.category,
      sortOrder: definition.sortOrder,
    }));
  }

  async getAppointments(userId: string) {
    const appointments = await this.getAppointmentRows(userId);
    return appointments.map(mapAppointment);
  }

  async createAppointment(userId: string, dto: SaveCircleAppointmentDto) {
    const now = new Date();
    const scheduledAt = parseAppointmentDate(dto.scheduledAt);
    await this.getOwnedCareTeamPerson(userId, dto.careTeamPersonId);

    const appointmentId = createId('circle_appointment');

    await this.db.insert(circleCareTeamAppointments).values({
      id: appointmentId,
      userId,
      careTeamPersonId: dto.careTeamPersonId,
      scheduledAt,
      location: normalizeOptionalText(dto.location),
      notes: normalizeOptionalText(dto.notes),
      updatedAt: now,
    });

    return await this.getAppointment(userId, appointmentId);
  }

  async updateAppointment(userId: string, appointmentId: string, dto: SaveCircleAppointmentDto) {
    const now = new Date();
    const scheduledAt = parseAppointmentDate(dto.scheduledAt);
    await this.getOwnedAppointment(userId, appointmentId);
    await this.getOwnedCareTeamPerson(userId, dto.careTeamPersonId);

    await this.db
      .update(circleCareTeamAppointments)
      .set({
        careTeamPersonId: dto.careTeamPersonId,
        scheduledAt,
        location: normalizeOptionalText(dto.location),
        notes: normalizeOptionalText(dto.notes),
        updatedAt: now,
      })
      .where(eq(circleCareTeamAppointments.id, appointmentId));

    return await this.getAppointment(userId, appointmentId);
  }

  async removeAppointment(userId: string, appointmentId: string) {
    await this.getOwnedAppointment(userId, appointmentId);
    await this.db
      .delete(circleCareTeamAppointments)
      .where(eq(circleCareTeamAppointments.id, appointmentId));
  }

  async createCareTeamPerson(userId: string, dto: SaveCircleCareTeamPersonDto) {
    const now = new Date();
    const displayName = normalizeRequiredText(dto.displayName, 'Display name');

    await this.assertCareTeamDisplayNameAvailable(userId, displayName);

    const careTeamPeople = await this.db
      .select({ sortOrder: circleCareTeamPeople.sortOrder })
      .from(circleCareTeamPeople)
      .where(eq(circleCareTeamPeople.userId, userId))
      .orderBy(desc(circleCareTeamPeople.sortOrder))
      .limit(1);

    await this.db.insert(circleCareTeamPeople).values({
      id: createId('circle_care'),
      userId,
      displayName,
      initials: getInitials(displayName),
      role: getCareTeamRole(dto),
      specialty: normalizeOptionalText(dto.specialty),
      organization: normalizeOptionalText(dto.organization),
      address: normalizeOptionalText(dto.address),
      phoneNumber: normalizeOptionalText(dto.phoneNumber),
      connectionStatus: 'local',
      metadataJson: {},
      sortOrder: (careTeamPeople[0]?.sortOrder ?? -1) + 1,
      updatedAt: now,
    });

    return await this.getMyCircle(userId);
  }

  async updateCareTeamPerson(
    userId: string,
    careTeamPersonId: string,
    dto: SaveCircleCareTeamPersonDto,
  ) {
    const now = new Date();
    const displayName = normalizeRequiredText(dto.displayName, 'Display name');
    const careTeamPerson = await this.getOwnedCareTeamPerson(userId, careTeamPersonId);

    if (careTeamPerson.displayName !== displayName) {
      await this.assertCareTeamDisplayNameAvailable(userId, displayName, careTeamPersonId);
    }

    await this.db
      .update(circleCareTeamPeople)
      .set({
        displayName,
        initials: getInitials(displayName),
        role: getCareTeamRole(dto),
        specialty: normalizeOptionalText(dto.specialty),
        organization: normalizeOptionalText(dto.organization),
        address: normalizeOptionalText(dto.address),
        phoneNumber: normalizeOptionalText(dto.phoneNumber),
        updatedAt: now,
      })
      .where(eq(circleCareTeamPeople.id, careTeamPerson.id));

    return await this.getMyCircle(userId);
  }

  async removeCareTeamPerson(userId: string, careTeamPersonId: string) {
    await this.getOwnedCareTeamPerson(userId, careTeamPersonId);
    await this.db.delete(circleCareTeamPeople).where(eq(circleCareTeamPeople.id, careTeamPersonId));
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

  async updateSupportPerson(
    userId: string,
    supportPersonId: string,
    dto: UpdateCircleSupportPersonDto,
  ) {
    const now = new Date();
    const displayName = normalizeRequiredText(dto.displayName, 'Display name');
    const supportPerson = await this.getOwnedSupportPerson(userId, supportPersonId);

    if (supportPerson.displayName !== displayName) {
      const existing = await this.db
        .select({ id: circleSupportPeople.id })
        .from(circleSupportPeople)
        .where(
          and(
            eq(circleSupportPeople.userId, userId),
            eq(circleSupportPeople.displayName, displayName),
          ),
        )
        .limit(1);

      if (existing[0] && existing[0].id !== supportPersonId) {
        throw new ConflictException('This display name is already used in your circle.');
      }
    }

    await this.db
      .update(circleSupportPeople)
      .set({
        displayName,
        initials: getInitials(displayName),
        updatedAt: now,
      })
      .where(eq(circleSupportPeople.id, supportPerson.id));

    return await this.getMyCircle(userId);
  }

  async updateSupportPermissions(
    userId: string,
    supportPersonId: string,
    dto: UpdateCircleSupportPermissionsDto,
  ) {
    const now = new Date();
    await this.getOwnedSupportPerson(userId, supportPersonId);
    const permissionKeys = normalizePermissionKeys(dto.permissionKeys);

    if (permissionKeys.length > 0) {
      await this.assertPermissionKeysExist(permissionKeys);
    }

    await this.db.transaction(async (tx) => {
      const revokeCondition =
        permissionKeys.length > 0
          ? and(
              eq(circleSupportPersonPermissionGrants.supportPersonId, supportPersonId),
              isNull(circleSupportPersonPermissionGrants.revokedAt),
              notInArray(circleSupportPersonPermissionGrants.permissionKey, permissionKeys),
            )
          : and(
              eq(circleSupportPersonPermissionGrants.supportPersonId, supportPersonId),
              isNull(circleSupportPersonPermissionGrants.revokedAt),
            );

      await tx
        .update(circleSupportPersonPermissionGrants)
        .set({
          revokedAt: now,
          updatedAt: now,
        })
        .where(revokeCondition);

      if (permissionKeys.length > 0) {
        await tx
          .insert(circleSupportPersonPermissionGrants)
          .values(
            permissionKeys.map((permissionKey) => ({
              id: createId('circle_permission_grant'),
              supportPersonId,
              userId,
              permissionKey,
              grantedByUserId: userId,
              grantedAt: now,
              revokedAt: null,
              updatedAt: now,
            })),
          )
          .onConflictDoUpdate({
            target: [
              circleSupportPersonPermissionGrants.supportPersonId,
              circleSupportPersonPermissionGrants.permissionKey,
            ],
            set: {
              userId,
              grantedByUserId: userId,
              grantedAt: now,
              revokedAt: null,
              updatedAt: now,
            },
          });
      }
    });

    return await this.getMyCircle(userId);
  }

  async cancelSupportInvitation(userId: string, supportPersonId: string) {
    const now = new Date();
    const supportPerson = await this.getOwnedSupportPerson(userId, supportPersonId);

    if (supportPerson.linkedUserId) {
      throw new ConflictException('This support person has already accepted their invite.');
    }

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

      await tx
        .update(circleSupportPeople)
        .set({
          inviteStatus: 'canceled',
          updatedAt: now,
        })
        .where(eq(circleSupportPeople.id, supportPersonId));
    });

    return await this.getMyCircle(userId);
  }

  async promoteSupportPerson(userId: string, supportPersonId: string) {
    const now = new Date();
    const supportPerson = await this.getOwnedSupportPerson(userId, supportPersonId);

    if (supportPerson.role === 'my_number_one') {
      return await this.getMyCircle(userId);
    }

    const currentNumberOne = await this.db
      .select({ id: circleSupportPeople.id })
      .from(circleSupportPeople)
      .where(
        and(eq(circleSupportPeople.userId, userId), eq(circleSupportPeople.role, 'my_number_one')),
      )
      .limit(1);

    if (currentNumberOne[0]) {
      throw new ConflictException('You already have a My #1.');
    }

    await this.db
      .update(circleSupportPeople)
      .set({
        role: 'my_number_one',
        sortOrder: 0,
        updatedAt: now,
      })
      .where(eq(circleSupportPeople.id, supportPersonId));

    return await this.getMyCircle(userId);
  }

  async demoteSupportPerson(userId: string, supportPersonId: string) {
    const now = new Date();
    const supportPerson = await this.getOwnedSupportPerson(userId, supportPersonId);

    if (supportPerson.role !== 'my_number_one') {
      return await this.getMyCircle(userId);
    }

    await this.db
      .update(circleSupportPeople)
      .set({
        role: 'support',
        sortOrder: Math.max(supportPerson.sortOrder, 1),
        updatedAt: now,
      })
      .where(eq(circleSupportPeople.id, supportPersonId));

    return await this.getMyCircle(userId);
  }

  async removeSupportPerson(userId: string, supportPersonId: string) {
    await this.getOwnedSupportPerson(userId, supportPersonId);
    await this.db.delete(circleSupportPeople).where(eq(circleSupportPeople.id, supportPersonId));
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

  private async getAppointment(userId: string, appointmentId: string) {
    const appointment = await this.getAppointmentRows(userId, { appointmentId, limit: 1 });

    if (!appointment[0]) {
      throw new NotFoundException('Appointment not found.');
    }

    return mapAppointment(appointment[0]);
  }

  private async getAppointmentRows(
    userId: string,
    options: { appointmentId?: string; upcomingOnly?: boolean; limit?: number } = {},
  ) {
    const conditions = [eq(circleCareTeamAppointments.userId, userId)];

    if (options.appointmentId) {
      conditions.push(eq(circleCareTeamAppointments.id, options.appointmentId));
    }

    if (options.upcomingOnly) {
      conditions.push(gte(circleCareTeamAppointments.scheduledAt, new Date()));
    }

    const query = this.db
      .select({
        id: circleCareTeamAppointments.id,
        userId: circleCareTeamAppointments.userId,
        careTeamPersonId: circleCareTeamAppointments.careTeamPersonId,
        scheduledAt: circleCareTeamAppointments.scheduledAt,
        location: circleCareTeamAppointments.location,
        notes: circleCareTeamAppointments.notes,
        createdAt: circleCareTeamAppointments.createdAt,
        updatedAt: circleCareTeamAppointments.updatedAt,
        careTeamDisplayName: circleCareTeamPeople.displayName,
        careTeamSpecialty: circleCareTeamPeople.specialty,
      })
      .from(circleCareTeamAppointments)
      .innerJoin(
        circleCareTeamPeople,
        eq(circleCareTeamAppointments.careTeamPersonId, circleCareTeamPeople.id),
      )
      .where(and(...conditions))
      .orderBy(asc(circleCareTeamAppointments.scheduledAt));

    if (options.limit) {
      return await query.limit(options.limit);
    }

    return await query;
  }

  private async getOwnedAppointment(userId: string, appointmentId: string) {
    const appointment = await this.db
      .select()
      .from(circleCareTeamAppointments)
      .where(
        and(
          eq(circleCareTeamAppointments.id, appointmentId),
          eq(circleCareTeamAppointments.userId, userId),
        ),
      )
      .limit(1);

    if (!appointment[0]) {
      throw new NotFoundException('Appointment not found.');
    }

    return appointment[0];
  }

  private async getOwnedCareTeamPerson(userId: string, careTeamPersonId: string) {
    const careTeamPerson = await this.db
      .select()
      .from(circleCareTeamPeople)
      .where(
        and(eq(circleCareTeamPeople.id, careTeamPersonId), eq(circleCareTeamPeople.userId, userId)),
      )
      .limit(1);

    if (!careTeamPerson[0]) {
      throw new NotFoundException('Care team member not found.');
    }

    return careTeamPerson[0];
  }

  private async assertCareTeamDisplayNameAvailable(
    userId: string,
    displayName: string,
    ignoreCareTeamPersonId?: string,
  ) {
    const existing = await this.db
      .select({ id: circleCareTeamPeople.id })
      .from(circleCareTeamPeople)
      .where(
        and(
          eq(circleCareTeamPeople.userId, userId),
          eq(circleCareTeamPeople.displayName, displayName),
        ),
      )
      .limit(1);

    if (existing[0] && existing[0].id !== ignoreCareTeamPersonId) {
      throw new ConflictException('This care team member is already in your circle.');
    }
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
    address: row.address,
    phoneNumber: row.phoneNumber,
    connectionStatus: row.connectionStatus,
    stateLabel: getConnectionStateLabel(row.connectionStatus),
    stateTone: getConnectionStateTone(row.connectionStatus),
    detailLine: getCareTeamDetailLine(row),
    nextAppointmentAt: row.nextAppointmentAt?.toISOString() ?? null,
    providerUserId: row.providerUserId,
    sortOrder: row.sortOrder,
  };
}

function mapAppointment(
  row: CircleCareTeamAppointmentRow & {
    careTeamDisplayName: string;
    careTeamSpecialty: string | null;
  },
) {
  return {
    id: row.id,
    careTeamPersonId: row.careTeamPersonId,
    careTeamDisplayName: row.careTeamDisplayName,
    careTeamSpecialty: row.careTeamSpecialty,
    scheduledAt: row.scheduledAt.toISOString(),
    location: row.location,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

function parseAppointmentDate(value: string | undefined) {
  const normalized = normalizeRequiredText(value, 'Appointment date');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Appointment date must be a valid date and time.');
  }

  return date;
}

function getCareTeamRole(dto: SaveCircleCareTeamPersonDto) {
  const specialty = normalizeOptionalText(dto.specialty);

  if (!specialty) {
    return 'clinician';
  }

  return (
    specialty
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'clinician'
  );
}

function getInitials(displayName: string) {
  return (
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || null
  );
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
