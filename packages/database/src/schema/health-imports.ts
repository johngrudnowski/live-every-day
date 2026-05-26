import { sql } from 'drizzle-orm';
import {
  doublePrecision,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { healthObservations } from './health-data';

export const healthIngestionJobs = pgTable(
  'health_ingestion_jobs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    sourceId: text('source_id').notNull(),
    status: text('status').notNull(),
    inputKind: text('input_kind').notNull(),
    sourceLabel: text('source_label'),
    observedAt: timestamp('observed_at', { withTimezone: true }),
    metadataJson: jsonb('metadata_json')
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx: index('health_ingestion_jobs_user_created_idx').on(
      table.userId,
      table.createdAt,
    ),
    userStatusIdx: index('health_ingestion_jobs_user_status_idx').on(table.userId, table.status),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'health_ingestion_jobs_user_fk',
    }).onDelete('cascade'),
  }),
);

export const healthSourceDocuments = pgTable(
  'health_source_documents',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    ingestionJobId: text('ingestion_job_id').notNull(),
    documentKind: text('document_kind').notNull(),
    sourceFilename: text('source_filename'),
    mimeType: text('mime_type'),
    storageKey: text('storage_key'),
    sha256Hash: text('sha256_hash'),
    metadataJson: jsonb('metadata_json')
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userJobIdx: index('health_source_documents_user_job_idx').on(
      table.userId,
      table.ingestionJobId,
    ),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'health_source_documents_user_fk',
    }).onDelete('cascade'),
    ingestionJobFk: foreignKey({
      columns: [table.ingestionJobId],
      foreignColumns: [healthIngestionJobs.id],
      name: 'health_source_documents_job_fk',
    }).onDelete('cascade'),
  }),
);

export const healthExtractedRecords = pgTable(
  'health_extracted_records',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    ingestionJobId: text('ingestion_job_id').notNull(),
    sourceDocumentId: text('source_document_id'),
    recordKind: text('record_kind').notNull(),
    rawLabel: text('raw_label').notNull(),
    rawValue: text('raw_value').notNull(),
    rawUnit: text('raw_unit'),
    rawReferenceRange: text('raw_reference_range'),
    rawObservedAt: text('raw_observed_at'),
    normalizedMetricKey: text('normalized_metric_key'),
    normalizedValueNumeric: doublePrecision('normalized_value_numeric'),
    normalizedUnit: text('normalized_unit'),
    normalizedObservedAt: timestamp('normalized_observed_at', {
      withTimezone: true,
    }),
    panelLabel: text('panel_label'),
    abnormalFlag: text('abnormal_flag'),
    confidence: doublePrecision('confidence'),
    issuesJson: jsonb('issues_json')
      .notNull()
      .default(sql`'[]'::jsonb`),
    candidateJson: jsonb('candidate_json')
      .notNull()
      .default(sql`'{}'::jsonb`),
    status: text('status').notNull(),
    committedObservationId: text('committed_observation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userJobIdx: index('health_extracted_records_user_job_idx').on(
      table.userId,
      table.ingestionJobId,
    ),
    userStatusIdx: index('health_extracted_records_user_status_idx').on(table.userId, table.status),
    metricObservedIdx: index('health_extracted_records_metric_observed_idx').on(
      table.normalizedMetricKey,
      table.normalizedObservedAt,
    ),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'health_extracted_records_user_fk',
    }).onDelete('cascade'),
    ingestionJobFk: foreignKey({
      columns: [table.ingestionJobId],
      foreignColumns: [healthIngestionJobs.id],
      name: 'health_extracted_records_job_fk',
    }).onDelete('cascade'),
    sourceDocumentFk: foreignKey({
      columns: [table.sourceDocumentId],
      foreignColumns: [healthSourceDocuments.id],
      name: 'health_extracted_records_document_fk',
    }).onDelete('set null'),
    committedObservationFk: foreignKey({
      columns: [table.committedObservationId],
      foreignColumns: [healthObservations.id],
      name: 'health_extracted_records_observation_fk',
    }).onDelete('set null'),
  }),
);

export const healthObservationProvenance = pgTable(
  'health_observation_provenance',
  {
    id: text('id').primaryKey(),
    observationId: text('observation_id').notNull(),
    ingestionJobId: text('ingestion_job_id').notNull(),
    sourceDocumentId: text('source_document_id'),
    extractedRecordId: text('extracted_record_id').notNull(),
    confidence: doublePrecision('confidence'),
    reviewStatus: text('review_status').notNull(),
    reviewedByUserId: text('reviewed_by_user_id'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    metadataJson: jsonb('metadata_json')
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    observationIdx: index('health_observation_provenance_observation_idx').on(table.observationId),
    ingestionJobIdx: index('health_observation_provenance_ingestion_job_idx').on(
      table.ingestionJobId,
    ),
    extractedRecordUnique: uniqueIndex('health_observation_provenance_extracted_record_unique').on(
      table.extractedRecordId,
    ),
    observationFk: foreignKey({
      columns: [table.observationId],
      foreignColumns: [healthObservations.id],
      name: 'health_observation_provenance_observation_fk',
    }).onDelete('cascade'),
    ingestionJobFk: foreignKey({
      columns: [table.ingestionJobId],
      foreignColumns: [healthIngestionJobs.id],
      name: 'health_observation_provenance_job_fk',
    }).onDelete('cascade'),
    sourceDocumentFk: foreignKey({
      columns: [table.sourceDocumentId],
      foreignColumns: [healthSourceDocuments.id],
      name: 'health_observation_provenance_document_fk',
    }).onDelete('set null'),
    extractedRecordFk: foreignKey({
      columns: [table.extractedRecordId],
      foreignColumns: [healthExtractedRecords.id],
      name: 'health_observation_provenance_record_fk',
    }).onDelete('cascade'),
    reviewedByUserFk: foreignKey({
      columns: [table.reviewedByUserId],
      foreignColumns: [user.id],
      name: 'health_observation_provenance_reviewer_fk',
    }).onDelete('set null'),
  }),
);
