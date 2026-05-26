import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { healthMetricCatalog } from 'database';
import type { DbClient } from 'database/client';
import { healthExtractedRecords, healthIngestionJobs } from 'database/schema';
import { DB_CLIENT } from '../database/database.constants';
import type {
  CreateManualLabImportDto,
  CreateManualLabImportRowDto,
} from './dto/create-manual-lab-import.dto';
import type { UpdateHealthImportCandidateDto } from './dto/update-health-import-candidate.dto';
import { HealthImportCommitService, updateJobStatus } from './health-import-commit.service';
import {
  HealthImportNormalizationService,
  type HealthImportIssue,
} from './health-import-normalization.service';

type JobRow = typeof healthIngestionJobs.$inferSelect;
type CandidateRow = typeof healthExtractedRecords.$inferSelect;

@Injectable()
export class HealthImportsService {
  constructor(
    @Inject(DB_CLIENT) private readonly db: DbClient,
    private readonly normalizer: HealthImportNormalizationService,
    private readonly commitService: HealthImportCommitService,
  ) {}

  async listImports(userId: string) {
    const jobs = await this.db
      .select()
      .from(healthIngestionJobs)
      .where(eq(healthIngestionJobs.userId, userId))
      .orderBy(desc(healthIngestionJobs.createdAt))
      .limit(50);

    if (jobs.length === 0) {
      return { imports: [] };
    }

    const candidates = await this.db
      .select({
        ingestionJobId: healthExtractedRecords.ingestionJobId,
      })
      .from(healthExtractedRecords)
      .where(
        and(
          eq(healthExtractedRecords.userId, userId),
          inArray(
            healthExtractedRecords.ingestionJobId,
            jobs.map((job) => job.id),
          ),
        ),
      );
    const counts = new Map<string, number>();
    for (const candidate of candidates) {
      counts.set(candidate.ingestionJobId, (counts.get(candidate.ingestionJobId) ?? 0) + 1);
    }

    return {
      imports: jobs.map((job) => ({
        ...mapJob(job),
        candidateCount: counts.get(job.id) ?? 0,
      })),
    };
  }

  async createManualLabImport(userId: string, dto: CreateManualLabImportDto) {
    const rows = readRows(dto.rows);
    const observedAt = readDate(dto.observedAt, 'observedAt');
    const now = new Date();
    const jobId = randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(healthIngestionJobs).values({
        id: jobId,
        userId,
        sourceId: 'manual_lab_entry',
        status: 'needs_review',
        inputKind: 'manual',
        sourceLabel: readOptionalText(dto.sourceLabel),
        observedAt,
        metadataJson: {
          panelLabel: readOptionalText(dto.panelLabel),
        },
        updatedAt: now,
      });

      await tx.insert(healthExtractedRecords).values(
        rows.map((row) => {
          const normalized = this.normalizer.normalizeLabCandidate({
            rawLabel: row.label,
            rawValue: row.value,
            rawUnit: row.unit,
            observedAt,
          });

          return {
            id: randomUUID(),
            userId,
            ingestionJobId: jobId,
            recordKind: 'lab_result',
            rawLabel: row.label.trim(),
            rawValue: row.value.trim(),
            rawUnit: readOptionalText(row.unit),
            rawReferenceRange: readOptionalText(row.referenceRange),
            rawObservedAt: dto.observedAt,
            normalizedMetricKey: normalized.normalizedMetricKey,
            normalizedValueNumeric: normalized.normalizedValueNumeric,
            normalizedUnit: normalized.normalizedUnit,
            normalizedObservedAt: normalized.normalizedObservedAt,
            panelLabel: readOptionalText(dto.panelLabel) ?? 'CBC',
            abnormalFlag: normalizeFlag(row.abnormalFlag),
            confidence: normalized.confidence,
            issuesJson: normalized.issues,
            candidateJson: row,
            status: 'candidate',
            updatedAt: now,
          };
        }),
      );
    });

    return await this.getImport(userId, jobId);
  }

  async getImport(userId: string, jobId: string) {
    const [job] = await this.db
      .select()
      .from(healthIngestionJobs)
      .where(and(eq(healthIngestionJobs.id, jobId), eq(healthIngestionJobs.userId, userId)))
      .limit(1);

    if (!job) {
      throw new NotFoundException('Health import was not found.');
    }

    const candidates = await this.db
      .select()
      .from(healthExtractedRecords)
      .where(
        and(
          eq(healthExtractedRecords.userId, userId),
          eq(healthExtractedRecords.ingestionJobId, jobId),
        ),
      )
      .orderBy(healthExtractedRecords.createdAt);

    return {
      job: mapJob(job),
      candidates: candidates.map(mapCandidate),
    };
  }

  async updateCandidate(
    userId: string,
    jobId: string,
    candidateId: string,
    dto: UpdateHealthImportCandidateDto,
  ) {
    const candidate = await this.getCandidateForUpdate(userId, jobId, candidateId);
    if (candidate.status === 'committed') {
      throw new BadRequestException('Committed candidates cannot be edited.');
    }

    const rawLabel =
      dto.rawLabel !== undefined ? readRequiredText(dto.rawLabel, 'rawLabel') : candidate.rawLabel;
    const rawValue =
      dto.rawValue !== undefined ? readRequiredText(dto.rawValue, 'rawValue') : candidate.rawValue;
    const rawUnit = dto.rawUnit !== undefined ? readNullableText(dto.rawUnit) : candidate.rawUnit;
    const rawReferenceRange =
      dto.rawReferenceRange !== undefined
        ? readNullableText(dto.rawReferenceRange)
        : candidate.rawReferenceRange;
    const normalizedObservedAt =
      dto.normalizedObservedAt !== undefined
        ? readNullableDate(dto.normalizedObservedAt, 'normalizedObservedAt')
        : candidate.normalizedObservedAt;
    const requestedMetricKey =
      dto.normalizedMetricKey !== undefined
        ? validateMetricKey(dto.normalizedMetricKey)
        : candidate.normalizedMetricKey;
    const normalized = this.normalizer.normalizeLabCandidate({
      rawLabel,
      rawValue,
      rawUnit,
      rawObservedAt: candidate.rawObservedAt,
      observedAt: candidate.normalizedObservedAt,
      normalizedMetricKey: requestedMetricKey,
      normalizedObservedAt,
    });
    const status = dto.status ?? 'candidate';

    if (status !== 'candidate' && status !== 'rejected') {
      throw new BadRequestException('Candidate status must be candidate or rejected.');
    }

    await this.db
      .update(healthExtractedRecords)
      .set({
        rawLabel,
        rawValue,
        rawUnit,
        rawReferenceRange,
        normalizedMetricKey: normalized.normalizedMetricKey,
        normalizedValueNumeric: normalized.normalizedValueNumeric,
        normalizedUnit: normalized.normalizedUnit,
        normalizedObservedAt: normalized.normalizedObservedAt,
        abnormalFlag:
          dto.abnormalFlag !== undefined ? normalizeFlag(dto.abnormalFlag) : candidate.abnormalFlag,
        confidence: normalized.confidence,
        issuesJson: normalized.issues,
        status,
        updatedAt: new Date(),
      })
      .where(eq(healthExtractedRecords.id, candidate.id));

    return await this.getImport(userId, jobId);
  }

  async acceptCandidates(userId: string, jobId: string, candidateIds: string[]) {
    await this.commitService.acceptAndCommit(userId, jobId, candidateIds);
    return await this.getImport(userId, jobId);
  }

  async rejectCandidates(userId: string, jobId: string, candidateIds: string[]) {
    const ids = readCandidateIds(candidateIds);
    const now = new Date();

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

      const committed = candidates.find((candidate) => candidate.status === 'committed');
      if (committed) {
        throw new BadRequestException('Committed candidates cannot be rejected.');
      }

      await tx
        .update(healthExtractedRecords)
        .set({ status: 'rejected', updatedAt: now })
        .where(inArray(healthExtractedRecords.id, ids));

      await updateJobStatus(tx, userId, jobId, now);
    });

    return await this.getImport(userId, jobId);
  }

  private async getCandidateForUpdate(userId: string, jobId: string, candidateId: string) {
    const [candidate] = await this.db
      .select()
      .from(healthExtractedRecords)
      .where(
        and(
          eq(healthExtractedRecords.id, candidateId),
          eq(healthExtractedRecords.userId, userId),
          eq(healthExtractedRecords.ingestionJobId, jobId),
        ),
      )
      .limit(1);

    if (!candidate) {
      throw new NotFoundException('Candidate was not found.');
    }

    return candidate;
  }
}

function readRows(rows: CreateManualLabImportRowDto[] | undefined) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new BadRequestException('At least one lab row is required.');
  }

  return rows.map((row) => ({
    ...row,
    label: readRequiredText(row.label, 'label'),
    value: readRequiredText(row.value, 'value'),
  }));
}

function readRequiredText(value: string | undefined, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${label} is required.`);
  }

  return value.trim();
}

function readOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readNullableText(value: string | null | undefined) {
  return value === null ? null : readOptionalText(value);
}

function readDate(value: string | undefined, label: string) {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${label} must be an ISO date string.`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${label} must be a valid ISO date string.`);
  }

  return date;
}

function readNullableDate(value: string | null, label: string) {
  if (value === null || value === '') {
    return null;
  }

  return readDate(value, label);
}

function validateMetricKey(value: string | null) {
  const trimmed = readNullableText(value);
  if (!trimmed) {
    return null;
  }

  const metric = healthMetricCatalog.find(
    (item) => item.key === trimmed && item.category === 'lab',
  );
  if (!metric) {
    throw new BadRequestException(`Unknown lab metric: ${trimmed}.`);
  }

  return metric.key;
}

function normalizeFlag(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

function readCandidateIds(candidateIds: string[] | undefined) {
  const ids = [...new Set((candidateIds ?? []).map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    throw new BadRequestException('At least one candidate is required.');
  }
  return ids;
}

function mapJob(job: JobRow) {
  return {
    id: job.id,
    status: job.status,
    sourceId: job.sourceId,
    inputKind: job.inputKind,
    sourceLabel: job.sourceLabel,
    observedAt: job.observedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

function mapCandidate(candidate: CandidateRow) {
  const metric = candidate.normalizedMetricKey
    ? healthMetricCatalog.find((item) => item.key === candidate.normalizedMetricKey)
    : null;

  return {
    id: candidate.id,
    rawLabel: candidate.rawLabel,
    rawValue: candidate.rawValue,
    rawUnit: candidate.rawUnit,
    rawReferenceRange: candidate.rawReferenceRange,
    rawObservedAt: candidate.rawObservedAt,
    normalizedMetricKey: candidate.normalizedMetricKey,
    normalizedMetricLabel: metric?.label ?? null,
    normalizedValueNumeric: candidate.normalizedValueNumeric,
    normalizedUnit: candidate.normalizedUnit,
    normalizedObservedAt: candidate.normalizedObservedAt?.toISOString() ?? null,
    panelLabel: candidate.panelLabel,
    abnormalFlag: candidate.abnormalFlag,
    confidence: candidate.confidence,
    issues: readIssues(candidate.issuesJson),
    status: candidate.status,
    committedObservationId: candidate.committedObservationId,
  };
}

function readIssues(value: unknown): HealthImportIssue[] {
  return Array.isArray(value) ? (value as HealthImportIssue[]) : [];
}
