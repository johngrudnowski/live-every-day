import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const circleSupportPeople = pgTable(
  'circle_support_people',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    linkedUserId: text('linked_user_id').references(() => user.id, { onDelete: 'set null' }),
    displayName: text('display_name').notNull(),
    initials: text('initials'),
    relationship: text('relationship'),
    role: text('role').notNull(),
    inviteStatus: text('invite_status').notNull(),
    invitationEmail: text('invitation_email'),
    invitationPhone: text('invitation_phone'),
    sortOrder: integer('sort_order').default(0).notNull(),
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userRoleIdx: index('circle_support_people_user_role_idx').on(table.userId, table.role),
    userInviteStatusIdx: index('circle_support_people_user_invite_status_idx').on(
      table.userId,
      table.inviteStatus,
    ),
    linkedUserIdx: index('circle_support_people_linked_user_idx').on(table.linkedUserId),
    userDisplayUnique: uniqueIndex('circle_support_people_user_display_unique').on(
      table.userId,
      table.displayName,
    ),
  }),
);

export const circlePermissionDefinitions = pgTable('circle_permission_definitions', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const circleSupportPersonPermissionGrants = pgTable(
  'circle_support_person_permission_grants',
  {
    id: text('id').primaryKey(),
    supportPersonId: text('support_person_id')
      .notNull()
      .references(() => circleSupportPeople.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    permissionKey: text('permission_key')
      .notNull()
      .references(() => circlePermissionDefinitions.key, { onDelete: 'restrict' }),
    grantedByUserId: text('granted_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    supportPersonIdx: index('circle_support_permission_grants_support_person_idx').on(
      table.supportPersonId,
    ),
    userPermissionIdx: index('circle_support_permission_grants_user_permission_idx').on(
      table.userId,
      table.permissionKey,
    ),
    permissionKeyIdx: index('circle_support_permission_grants_permission_key_idx').on(
      table.permissionKey,
    ),
    supportPermissionUnique: uniqueIndex(
      'circle_support_permission_grants_support_permission_unique',
    ).on(table.supportPersonId, table.permissionKey),
  }),
);

export const circleSupportInvitations = pgTable(
  'circle_support_invitations',
  {
    id: text('id').primaryKey(),
    supportPersonId: text('support_person_id')
      .notNull()
      .references(() => circleSupportPeople.id, { onDelete: 'cascade' }),
    inviterUserId: text('inviter_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    deliveryMethod: text('delivery_method').notNull(),
    recipientEmail: text('recipient_email'),
    recipientPhone: text('recipient_phone'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    supportPersonIdx: index('circle_support_invitations_support_person_idx').on(
      table.supportPersonId,
    ),
    inviterIdx: index('circle_support_invitations_inviter_idx').on(table.inviterUserId),
    tokenHashUnique: uniqueIndex('circle_support_invitations_token_hash_unique').on(
      table.tokenHash,
    ),
  }),
);

export const circleSupportMessages = pgTable(
  'circle_support_messages',
  {
    id: text('id').primaryKey(),
    supportPersonId: text('support_person_id')
      .notNull()
      .references(() => circleSupportPeople.id, { onDelete: 'cascade' }),
    patientUserId: text('patient_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    authorUserId: text('author_user_id').references(() => user.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    supportPersonIdx: index('circle_support_messages_support_person_idx').on(table.supportPersonId),
    patientCreatedAtIdx: index('circle_support_messages_patient_created_at_idx').on(
      table.patientUserId,
      table.createdAt,
    ),
    authorIdx: index('circle_support_messages_author_idx').on(table.authorUserId),
  }),
);

export const circleCareTeamPeople = pgTable(
  'circle_care_team_people',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    providerUserId: text('provider_user_id').references(() => user.id, { onDelete: 'set null' }),
    displayName: text('display_name').notNull(),
    initials: text('initials'),
    role: text('role').notNull(),
    specialty: text('specialty'),
    organization: text('organization'),
    address: text('address'),
    phoneNumber: text('phone_number'),
    connectionStatus: text('connection_status').notNull(),
    externalProviderId: text('external_provider_id'),
    metadataJson: jsonb('metadata_json').default({}).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    connectedAt: timestamp('connected_at', { withTimezone: true }),
    nextAppointmentAt: timestamp('next_appointment_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userRoleIdx: index('circle_care_team_people_user_role_idx').on(table.userId, table.role),
    userConnectionStatusIdx: index('circle_care_team_people_user_connection_status_idx').on(
      table.userId,
      table.connectionStatus,
    ),
    providerUserIdx: index('circle_care_team_people_provider_user_idx').on(table.providerUserId),
    userDisplayUnique: uniqueIndex('circle_care_team_people_user_display_unique').on(
      table.userId,
      table.displayName,
    ),
  }),
);
