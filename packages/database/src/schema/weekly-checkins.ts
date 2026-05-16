import {
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const weeklyCheckins = pgTable(
  'weekly_checkins',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    definitionId: text('definition_id').notNull(),
    conditionId: text('condition_id'),
    weekStartDate: date('week_start_date').notNull(),
    status: text('status').notNull(),
    answersJson: jsonb('answers_json').notNull(),
    scoreJson: jsonb('score_json').notNull(),
    customNote: text('custom_note'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userWeekDefinitionUnique: uniqueIndex('weekly_checkins_user_week_definition_unique').on(
      table.userId,
      table.weekStartDate,
      table.definitionId,
    ),
    userStatusWeekIdx: index('weekly_checkins_user_status_week_idx').on(
      table.userId,
      table.status,
      table.weekStartDate,
    ),
    userCompletedAtIdx: index('weekly_checkins_user_completed_at_idx').on(
      table.userId,
      table.completedAt,
    ),
  }),
);
