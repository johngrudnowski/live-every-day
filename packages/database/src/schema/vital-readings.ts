import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const vitalReadings = pgTable(
  'vital_readings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    source: text('source').notNull().default('manual'),
    systolicMmHg: integer('systolic_mm_hg'),
    diastolicMmHg: integer('diastolic_mm_hg'),
    pulseBpm: integer('pulse_bpm'),
    temperatureFTenths: integer('temperature_f_tenths'),
    oxygenSaturationPercent: integer('oxygen_saturation_percent'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userRecordedAtIdx: index('vital_readings_user_recorded_at_idx').on(
      table.userId,
      table.recordedAt,
    ),
  }),
);
