import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import {
  circleCareTeamPeople,
  circlePermissionDefinitions,
  circleSupportInvitations,
  circleSupportMessages,
  circleSupportPeople,
  circleSupportPersonPermissionGrants,
} from '../../schema';
import type { SeedContext, SeedResult, SeedUserTarget } from '../types';

const circlePermissionRows = [
  {
    key: 'weekly_score',
    label: 'Weekly score',
    description: 'Can receive weekly check-in score summaries.',
    category: 'checkins',
    sortOrder: 0,
  },
  {
    key: 'symptom_trends',
    label: 'Symptom trends',
    description: 'Can receive symptom trend context from check-ins.',
    category: 'checkins',
    sortOrder: 1,
  },
  {
    key: 'labs',
    label: 'Labs',
    description: 'Can receive lab-related context when shared.',
    category: 'clinical',
    sortOrder: 2,
  },
  {
    key: 'appointment_brief',
    label: 'Appointment brief',
    description: 'Can receive appointment preparation summaries.',
    category: 'care',
    sortOrder: 3,
  },
] satisfies Array<typeof circlePermissionDefinitions.$inferInsert>;

export async function seedCircle(ctx: SeedContext, target: SeedUserTarget): Promise<SeedResult> {
  const supportRows = [
    {
      id: createCircleId(target.userId, 'support', 'ashton-grudnowski'),
      userId: target.userId,
      displayName: 'Ashton Grudnowski',
      initials: 'AG',
      relationship: 'Spouse',
      role: 'my_number_one',
      inviteStatus: 'active',
      sortOrder: 0,
      acceptedAt: addDays(ctx.now, -120),
      updatedAt: ctx.now,
    },
    {
      id: createCircleId(target.userId, 'support', 'dylan-grudnowski'),
      userId: target.userId,
      displayName: 'Dylan Grudnowski',
      initials: 'DG',
      relationship: 'Family',
      role: 'support',
      inviteStatus: 'active',
      sortOrder: 1,
      acceptedAt: addDays(ctx.now, -90),
      lastMessageAt: addDays(ctx.now, -2),
      updatedAt: ctx.now,
    },
    {
      id: createCircleId(target.userId, 'support', 'mary-grudnowski'),
      userId: target.userId,
      displayName: 'Mary Grudnowski',
      initials: 'MG',
      relationship: 'Family',
      role: 'support',
      inviteStatus: 'pending',
      invitationEmail: 'mary@example.com',
      sortOrder: 2,
      invitedAt: addDays(ctx.now, -7),
      updatedAt: ctx.now,
    },
  ] satisfies Array<typeof circleSupportPeople.$inferInsert>;

  const careTeamRows = [
    {
      id: createCircleId(target.userId, 'care', 'wolanskyj-spinner'),
      userId: target.userId,
      displayName: 'Dr. Wolanskyj-Spinner',
      initials: 'WS',
      role: 'hematologist',
      specialty: 'Hematology',
      organization: 'Mayo Clinic',
      connectionStatus: 'connected',
      metadataJson: {},
      sortOrder: 0,
      connectedAt: addDays(ctx.now, -45),
      nextAppointmentAt: getNextAppointmentDate(ctx.now),
      updatedAt: ctx.now,
    },
  ] satisfies Array<typeof circleCareTeamPeople.$inferInsert>;

  const permissionGrantRows = [
    ...createPermissionGrantRows(ctx, target, supportRows[0].id, [
      'weekly_score',
      'symptom_trends',
      'appointment_brief',
    ]),
    ...createPermissionGrantRows(ctx, target, supportRows[1].id, ['weekly_score']),
  ] satisfies Array<typeof circleSupportPersonPermissionGrants.$inferInsert>;
  const invitationRows = [
    {
      id: createCircleId(target.userId, 'invitation', 'mary-grudnowski'),
      supportPersonId: supportRows[2].id,
      inviterUserId: target.userId,
      tokenHash: hashInviteToken(`seed-circle-invite-${target.userId}-mary-grudnowski`),
      deliveryMethod: 'email',
      recipientEmail: 'mary@example.com',
      expiresAt: addDays(ctx.now, 14),
      lastSentAt: addDays(ctx.now, -7),
      updatedAt: ctx.now,
    },
  ] satisfies Array<typeof circleSupportInvitations.$inferInsert>;
  const messageRows = [
    {
      id: createCircleId(target.userId, 'message', 'dylan-grudnowski-checkin'),
      supportPersonId: supportRows[1].id,
      patientUserId: target.userId,
      authorUserId: null,
      body: 'Thinking of you this week. You have got this.',
      createdAt: addDays(ctx.now, -2),
      updatedAt: ctx.now,
    },
  ] satisfies Array<typeof circleSupportMessages.$inferInsert>;

  await ctx.db
    .insert(circlePermissionDefinitions)
    .values(circlePermissionRows)
    .onConflictDoUpdate({
      target: circlePermissionDefinitions.key,
      set: {
        label: sql`excluded.label`,
        description: sql`excluded.description`,
        category: sql`excluded.category`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: ctx.now,
      },
    });

  await ctx.db
    .insert(circleSupportPeople)
    .values(supportRows)
    .onConflictDoUpdate({
      target: [circleSupportPeople.userId, circleSupportPeople.displayName],
      set: {
        linkedUserId: sql`excluded.linked_user_id`,
        initials: sql`excluded.initials`,
        relationship: sql`excluded.relationship`,
        role: sql`excluded.role`,
        inviteStatus: sql`excluded.invite_status`,
        invitationEmail: sql`excluded.invitation_email`,
        invitationPhone: sql`excluded.invitation_phone`,
        sortOrder: sql`excluded.sort_order`,
        invitedAt: sql`excluded.invited_at`,
        acceptedAt: sql`excluded.accepted_at`,
        lastMessageAt: sql`excluded.last_message_at`,
        updatedAt: ctx.now,
      },
    });

  await ctx.db
    .insert(circleSupportPersonPermissionGrants)
    .values(permissionGrantRows)
    .onConflictDoUpdate({
      target: [
        circleSupportPersonPermissionGrants.supportPersonId,
        circleSupportPersonPermissionGrants.permissionKey,
      ],
      set: {
        userId: sql`excluded.user_id`,
        grantedByUserId: sql`excluded.granted_by_user_id`,
        grantedAt: sql`excluded.granted_at`,
        revokedAt: null,
        updatedAt: ctx.now,
      },
    });

  await ctx.db
    .insert(circleSupportInvitations)
    .values(invitationRows)
    .onConflictDoUpdate({
      target: circleSupportInvitations.tokenHash,
      set: {
        supportPersonId: sql`excluded.support_person_id`,
        inviterUserId: sql`excluded.inviter_user_id`,
        deliveryMethod: sql`excluded.delivery_method`,
        recipientEmail: sql`excluded.recipient_email`,
        recipientPhone: sql`excluded.recipient_phone`,
        expiresAt: sql`excluded.expires_at`,
        acceptedAt: sql`excluded.accepted_at`,
        revokedAt: sql`excluded.revoked_at`,
        lastSentAt: sql`excluded.last_sent_at`,
        updatedAt: ctx.now,
      },
    });

  await ctx.db
    .insert(circleSupportMessages)
    .values(messageRows)
    .onConflictDoUpdate({
      target: circleSupportMessages.id,
      set: {
        supportPersonId: sql`excluded.support_person_id`,
        patientUserId: sql`excluded.patient_user_id`,
        authorUserId: sql`excluded.author_user_id`,
        body: sql`excluded.body`,
        createdAt: sql`excluded.created_at`,
        updatedAt: ctx.now,
      },
    });

  await ctx.db
    .insert(circleCareTeamPeople)
    .values(careTeamRows)
    .onConflictDoUpdate({
      target: [circleCareTeamPeople.userId, circleCareTeamPeople.displayName],
      set: {
        providerUserId: sql`excluded.provider_user_id`,
        initials: sql`excluded.initials`,
        role: sql`excluded.role`,
        specialty: sql`excluded.specialty`,
        organization: sql`excluded.organization`,
        connectionStatus: sql`excluded.connection_status`,
        externalProviderId: sql`excluded.external_provider_id`,
        metadataJson: sql`excluded.metadata_json`,
        sortOrder: sql`excluded.sort_order`,
        connectedAt: sql`excluded.connected_at`,
        nextAppointmentAt: sql`excluded.next_appointment_at`,
        updatedAt: ctx.now,
      },
    });

  return {
    module: 'circle',
    count:
      circlePermissionRows.length +
      permissionGrantRows.length +
      invitationRows.length +
      messageRows.length +
      supportRows.length +
      careTeamRows.length,
    detail: `upserted ${supportRows.length} support people, ${permissionGrantRows.length} permission grants, ${invitationRows.length} invitation, ${messageRows.length} support message, and ${careTeamRows.length} care team member`,
  };
}

function createCircleId(userId: string, type: string, slug: string) {
  return `seed_circle_${type}_${userId}_${slug}`.replace(/[^a-zA-Z0-9_:-]/g, '_');
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getNextAppointmentDate(date: Date) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 30);
  next.setUTCHours(14, 0, 0, 0);
  return next;
}

function createPermissionGrantRows(
  ctx: SeedContext,
  target: SeedUserTarget,
  supportPersonId: string,
  permissionKeys: string[],
) {
  return permissionKeys.map((permissionKey) => ({
    id: createCircleId(target.userId, 'permission', `${supportPersonId}-${permissionKey}`),
    supportPersonId,
    userId: target.userId,
    permissionKey,
    grantedByUserId: target.userId,
    grantedAt: addDays(ctx.now, -30),
    updatedAt: ctx.now,
  }));
}

function hashInviteToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
