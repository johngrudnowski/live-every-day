import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const userConditionProfiles = pgTable(
  'user_condition_profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    conditionId: text('condition_id').notNull(),
    conditionVersion: integer('condition_version').notNull(),
    profileJson: jsonb('profile_json').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userConditionUnique: uniqueIndex('user_condition_profiles_user_condition_unique').on(
      table.userId,
      table.conditionId,
    ),
    userIdIdx: index('user_condition_profiles_user_id_idx').on(table.userId),
    conditionIdIdx: index('user_condition_profiles_condition_id_idx').on(table.conditionId),
  }),
);

export const userConditionOnboardingState = pgTable('user_condition_onboarding_state', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  skippedAt: timestamp('skipped_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
