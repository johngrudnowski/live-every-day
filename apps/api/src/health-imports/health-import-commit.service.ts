import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { healthDataSourceCatalog, healthMetricCatalog } from 'database';
import type { DbClient } from 'database/client';
import {
  healthDataSources,
  healthExtractedRecords,
  healthIngestionJobs,
  healthMetricTypes,
  healthObservationGroups,
  healthObservationProvenance,
  healthObservations,
  healthSourceConnections,
} from 'database/schema';
import { DB_CLIENT } from '../database/database.constants';
import type { HealthImportIssue } from './health-import-normalization.service';

type CandidateRow = typeof healthExtractedRecords.$inferSelect;

@Injectable()
export class HealthImportCommitService {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async acceptAndCommit(userId: string, jobId: string, candidateIds: string[]) {
    const ids = readCandidateIds(candidateIds);
    const now = new Date();

    await this.ensureCatalog(now);

    await this.db.transaction(async (tx) => {
      const [job] = await tx
        .select()
        .from(healthIngestionJobs)
        .where(and(eq(healthIngestionJobs.id, jobId), eq(healthIngestionJobs.userId, userId)))
        .limit(1);

      if (!job) {
        throw new NotFoundException('Health import was not found.');
      }

      const candidates = await tx
        .select()
        .from(healthExtractedRecords)
        .where(
          and(
            eq(healthExtractedRecords.userId, userId),
            eq(healthExtractedRecords.ingestionJobId, jobId),
            inArray(healthExtractedRecords.id, ids),
          ),
        );

      if (candidates.length !== ids.length) {
        throw new BadRequestException('One or more candidates were not found for this import.');
      }

      for (const candidate of candidates) {
        validateCommitReady(candidate);
      }

      const sourceConnection = await getOrCreateManualLabSourceConnection(tx, userId, now);
      const newCandidates = candidates.filter((candidate) => candidate.status !== 'committed');
      const groupId =
        newCandidates.length > 0
          ? await getOrCreateObservationGroup({
              tx,
              userId,
              sourceConnectionId: sourceConnection.id,
              sourceRecordId: job.id,
              observedAt: job.observedAt ?? newCandidates[0]?.normalizedObservedAt ?? now,
              now,
            })
          : null;

      for (const candidate of newCandidates) {
        const observationId = randomUUID();

        await tx.insert(healthObservations).values({
          id: observationId,
          userId,
          metricKey: candidate.normalizedMetricKey as string,
          sourceConnectionId: sourceConnection.id,
          observationGroupId: groupId,
          sourceRecordId: candidate.id,
          valueNumeric: candidate.normalizedValueNumeric,
          unit: candidate.normalizedUnit,
          observedAt: candidate.normalizedObservedAt as Date,
          recordedAt: now,
          aggregationKind: 'point',
          sourceMetadataJson: {
            abnormalFlag: candidate.abnormalFlag,
            panelLabel: candidate.panelLabel,
            rawLabel: candidate.rawLabel,
            rawReferenceRange: candidate.rawReferenceRange,
            rawUnit: candidate.rawUnit,
            rawValue: candidate.rawValue,
          },
          updatedAt: now,
        });

        await tx.insert(healthObservationProvenance).values({
          id: randomUUID(),
          observationId,
          ingestionJobId: job.id,
          sourceDocumentId: candidate.sourceDocumentId,
          extractedRecordId: candidate.id,
          confidence: candidate.confidence,
          reviewStatus: 'user_confirmed',
          reviewedByUserId: userId,
          reviewedAt: now,
          updatedAt: now,
        });

        await tx
          .update(healthExtractedRecords)
          .set({
            status: 'committed',
            committedObservationId: observationId,
            updatedAt: now,
          })
          .where(eq(healthExtractedRecords.id, candidate.id));
      }

      await updateJobStatus(tx, userId, jobId, now);
    });
  }

  private async ensureCatalog(now: Date) {
    await this.db
      .insert(healthDataSources)
      .values(
        healthDataSourceCatalog.map((source) => ({
          ...source,
          updatedAt: now,
        })),
      )
      .onConflictDoNothing();

    await this.db
      .insert(healthMetricTypes)
      .values(healthMetricCatalog.map((metric) => ({ ...metric, updatedAt: now })))
      .onConflictDoNothing();
  }
}

function readCandidateIds(candidateIds: string[] | undefined) {
  const ids = [...new Set((candidateIds ?? []).map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    throw new BadRequestException('At least one candidate is required.');
  }
  return ids;
}

function validateCommitReady(candidate: CandidateRow) {
  if (candidate.status === 'rejected') {
    throw new BadRequestException(`${candidate.rawLabel} has been rejected.`);
  }

  if (candidate.status === 'committed') {
    return;
  }

  if (
    !candidate.normalizedMetricKey ||
    candidate.normalizedValueNumeric === null ||
    !candidate.normalizedObservedAt
  ) {
    throw new BadRequestException(`${candidate.rawLabel} needs review before it can be imported.`);
  }

  const issues = readIssues(candidate.issuesJson);
  const errorIssue = issues.find((issue) => issue.severity === 'error');
  if (errorIssue) {
    throw new BadRequestException(`${candidate.rawLabel}: ${errorIssue.message}`);
  }
}

function readIssues(value: unknown): HealthImportIssue[] {
  return Array.isArray(value) ? (value as HealthImportIssue[]) : [];
}

async function getOrCreateManualLabSourceConnection(tx: any, userId: string, now: Date) {
  const [existing] = await tx
    .select()
    .from(healthSourceConnections)
    .where(
      and(
        eq(healthSourceConnections.userId, userId),
        eq(healthSourceConnections.sourceId, 'manual_lab_entry'),
        eq(healthSourceConnections.status, 'connected'),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await tx
    .insert(healthSourceConnections)
    .values({
      id: randomUUID(),
      userId,
      sourceId: 'manual_lab_entry',
      displayName: 'Manual lab entry',
      status: 'connected',
      updatedAt: now,
    })
    .returning();

  return created;
}

async function getOrCreateObservationGroup({
  tx,
  userId,
  sourceConnectionId,
  sourceRecordId,
  observedAt,
  now,
}: {
  tx: any;
  userId: string;
  sourceConnectionId: string;
  sourceRecordId: string;
  observedAt: Date;
  now: Date;
}) {
  const [existing] = await tx
    .select({ id: healthObservationGroups.id })
    .from(healthObservationGroups)
    .where(
      and(
        eq(healthObservationGroups.sourceConnectionId, sourceConnectionId),
        eq(healthObservationGroups.sourceRecordId, sourceRecordId),
      ),
    )
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const [created] = await tx
    .insert(healthObservationGroups)
    .values({
      id: randomUUID(),
      userId,
      groupType: 'lab_panel',
      sourceConnectionId,
      sourceRecordId,
      observedAt,
      updatedAt: now,
    })
    .returning({ id: healthObservationGroups.id });

  return created.id;
}

export async function updateJobStatus(tx: any, userId: string, jobId: string, now: Date) {
  const candidates = await tx
    .select({ status: healthExtractedRecords.status })
    .from(healthExtractedRecords)
    .where(
      and(
        eq(healthExtractedRecords.userId, userId),
        eq(healthExtractedRecords.ingestionJobId, jobId),
      ),
    );

  const importedCount = candidates.filter((candidate) => candidate.status === 'committed').length;
  const unresolvedCount = candidates.filter(
    (candidate) => candidate.status === 'candidate' || candidate.status === 'accepted',
  ).length;
  const nextStatus =
    unresolvedCount === 0 ? 'imported' : importedCount > 0 ? 'partially_imported' : 'needs_review';

  await tx
    .update(healthIngestionJobs)
    .set({ status: nextStatus, updatedAt: now })
    .where(and(eq(healthIngestionJobs.id, jobId), eq(healthIngestionJobs.userId, userId)));
}
