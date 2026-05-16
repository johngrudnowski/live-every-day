import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const healthDataSources = pgTable('health_data_sources', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  kind: text('kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const healthSourceConnections = pgTable(
  'health_source_connections',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sourceId: text('source_id')
      .notNull()
      .references(() => healthDataSources.id),
    externalAccountId: text('external_account_id'),
    displayName: text('display_name'),
    status: text('status').notNull(),
    scopesJson: jsonb('scopes_json')
      .notNull()
      .default(sql`'[]'::jsonb`),
    metadataJson: jsonb('metadata_json')
      .notNull()
      .default(sql`'{}'::jsonb`),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userSourceIdx: index('health_source_connections_user_source_idx').on(
      table.userId,
      table.sourceId,
    ),
    userStatusIdx: index('health_source_connections_user_status_idx').on(
      table.userId,
      table.status,
    ),
  }),
);

export const healthSyncRuns = pgTable(
  'health_sync_runs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sourceConnectionId: text('source_connection_id').references(() => healthSourceConnections.id, {
      onDelete: 'set null',
    }),
    status: text('status').notNull(),
    syncKind: text('sync_kind').notNull(),
    windowStartAt: timestamp('window_start_at', { withTimezone: true }),
    windowEndAt: timestamp('window_end_at', { withTimezone: true }),
    cursorBefore: text('cursor_before'),
    cursorAfter: text('cursor_after'),
    recordsRead: integer('records_read').notNull().default(0),
    recordsWritten: integer('records_written').notNull().default(0),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    userStartedIdx: index('health_sync_runs_user_started_idx').on(table.userId, table.startedAt),
    connectionStartedIdx: index('health_sync_runs_connection_started_idx').on(
      table.sourceConnectionId,
      table.startedAt,
    ),
  }),
);

export const healthMetricTypes = pgTable('health_metric_types', {
  key: text('key').primaryKey(),
  category: text('category').notNull(),
  label: text('label').notNull(),
  valueKind: text('value_kind').notNull(),
  defaultUnit: text('default_unit'),
  aggregationDefault: text('aggregation_default').notNull(),
  loincCode: text('loinc_code'),
  appleIdentifier: text('apple_identifier'),
  healthConnectRecordType: text('health_connect_record_type'),
  metadataJson: jsonb('metadata_json')
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const healthObservationGroups = pgTable(
  'health_observation_groups',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    groupType: text('group_type').notNull(),
    sourceConnectionId: text('source_connection_id').references(() => healthSourceConnections.id, {
      onDelete: 'set null',
    }),
    sourceRecordId: text('source_record_id'),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    metadataJson: jsonb('metadata_json')
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userGroupObservedIdx: index('health_observation_groups_user_group_observed_idx').on(
      table.userId,
      table.groupType,
      table.observedAt,
    ),
    sourceRecordUnique: uniqueIndex('health_observation_groups_source_record_unique')
      .on(table.sourceConnectionId, table.sourceRecordId)
      .where(sql`${table.sourceRecordId} is not null`),
  }),
);

export const healthObservations = pgTable(
  'health_observations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    metricKey: text('metric_key')
      .notNull()
      .references(() => healthMetricTypes.key),
    sourceConnectionId: text('source_connection_id').references(() => healthSourceConnections.id, {
      onDelete: 'set null',
    }),
    observationGroupId: text('observation_group_id').references(() => healthObservationGroups.id, {
      onDelete: 'set null',
    }),
    sourceRecordId: text('source_record_id'),
    sourceRecordVersion: text('source_record_version'),
    valueNumeric: doublePrecision('value_numeric'),
    valueText: text('value_text'),
    valueBoolean: boolean('value_boolean'),
    unit: text('unit'),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    recordedAt: timestamp('recorded_at', { withTimezone: true }),
    aggregationKind: text('aggregation_kind').notNull().default('point'),
    bodySite: text('body_site'),
    deviceName: text('device_name'),
    sourceMetadataJson: jsonb('source_metadata_json')
      .notNull()
      .default(sql`'{}'::jsonb`),
    qualityJson: jsonb('quality_json')
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    userMetricObservedIdx: index('health_observations_user_metric_observed_idx').on(
      table.userId,
      table.metricKey,
      table.observedAt,
    ),
    userObservedIdx: index('health_observations_user_observed_idx').on(
      table.userId,
      table.observedAt,
    ),
    groupIdx: index('health_observations_group_idx').on(table.observationGroupId),
    userMetricAggregationObservedIdx: index(
      'health_observations_user_metric_aggregation_observed_idx',
    ).on(table.userId, table.metricKey, table.aggregationKind, table.observedAt),
    sourceRecordUnique: uniqueIndex('health_observations_source_record_unique')
      .on(table.sourceConnectionId, table.sourceRecordId, table.metricKey)
      .where(sql`${table.sourceRecordId} is not null`),
  }),
);

export const healthDailySummaries = pgTable(
  'health_daily_summaries',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    metricKey: text('metric_key')
      .notNull()
      .references(() => healthMetricTypes.key),
    summaryDate: date('summary_date').notNull(),
    timezone: text('timezone').notNull(),
    sourceConnectionId: text('source_connection_id').references(() => healthSourceConnections.id, {
      onDelete: 'set null',
    }),
    sampleCount: integer('sample_count').notNull().default(0),
    valueSum: doublePrecision('value_sum'),
    valueAvg: doublePrecision('value_avg'),
    valueMin: doublePrecision('value_min'),
    valueMax: doublePrecision('value_max'),
    valueLatest: doublePrecision('value_latest'),
    latestObservedAt: timestamp('latest_observed_at', { withTimezone: true }),
    metadataJson: jsonb('metadata_json')
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userDateIdx: index('health_daily_summaries_user_date_idx').on(table.userId, table.summaryDate),
    userMetricDateIdx: index('health_daily_summaries_user_metric_date_idx').on(
      table.userId,
      table.metricKey,
      table.summaryDate,
    ),
    userMetricSourceDateUnique: uniqueIndex('health_daily_summaries_user_metric_source_date_unique')
      .on(table.userId, table.metricKey, table.summaryDate, table.sourceConnectionId)
      .where(sql`${table.sourceConnectionId} is not null`),
    userMetricManualDateUnique: uniqueIndex('health_daily_summaries_user_metric_manual_date_unique')
      .on(table.userId, table.metricKey, table.summaryDate)
      .where(sql`${table.sourceConnectionId} is null`),
  }),
);
