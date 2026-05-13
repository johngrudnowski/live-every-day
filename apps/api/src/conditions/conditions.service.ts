import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  getConditionDefinition,
  getConditionRegistryItems,
  normalizeConditionProfile,
  validateConditionValues,
  type ConditionDefinition,
  type SemanticKey,
  type SemanticValue,
  type UserConditionProfile,
} from '@led/conditions';
import { desc, eq } from 'drizzle-orm';
import type { DbClient } from 'database/client';
import { userConditionOnboardingState, userConditionProfiles } from 'database/schema';
import { randomUUID } from 'node:crypto';
import { DB_CLIENT } from '../database/database.constants';
import type { SaveConditionProfileDto } from './dto/save-condition-profile.dto';

type ConditionProfileRow = typeof userConditionProfiles.$inferSelect;
type OnboardingStateRow = typeof userConditionOnboardingState.$inferSelect;

@Injectable()
export class ConditionsService {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  listConditions() {
    return getConditionRegistryItems();
  }

  getCondition(conditionId: string) {
    const definition = getConditionDefinition(conditionId);

    if (!definition || definition.status === 'hidden') {
      throw new NotFoundException('Condition not found.');
    }

    return definition;
  }

  async getSummary(userId: string) {
    const [profiles, onboarding] = await Promise.all([
      this.listProfiles(userId),
      this.getOnboardingState(userId),
    ]);
    const activeConditionProfile = profiles.find((profile) => profile.completedAt !== null) ?? null;

    return {
      hasConditionProfile: activeConditionProfile !== null,
      activeConditionProfile: activeConditionProfile ? mapProfileRow(activeConditionProfile) : null,
      onboarding: mapOnboardingState(onboarding),
    };
  }

  async listProfileSummaries(userId: string) {
    const profiles = await this.listProfiles(userId);
    return profiles.map(mapProfileRow);
  }

  async skipOnboarding(userId: string) {
    const summary = await this.getSummary(userId);
    if (summary.hasConditionProfile) {
      return summary;
    }

    const now = new Date();
    await this.db
      .insert(userConditionOnboardingState)
      .values({
        userId,
        skippedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userConditionOnboardingState.userId,
        set: {
          skippedAt: now,
          updatedAt: now,
        },
      });

    return await this.getSummary(userId);
  }

  async saveProfile(userId: string, conditionId: string, dto: SaveConditionProfileDto) {
    const definition = this.getCondition(conditionId);

    if (definition.status !== 'active') {
      throw new BadRequestException('This condition path is not active yet.');
    }

    if (!dto || typeof dto.conditionDefinitionVersion !== 'number' || !isRecord(dto.values)) {
      throw new BadRequestException('Condition profile payload is invalid.');
    }

    if (dto.conditionDefinitionVersion !== definition.version) {
      throw new BadRequestException('Condition definition version is out of date.');
    }

    const semanticValues = coerceSemanticValues(definition, dto.values);
    const validation = validateConditionValues(definition, semanticValues);

    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Condition profile is invalid.',
        issues: validation.issues,
      });
    }

    const now = new Date();
    const profile = normalizeConditionProfile({
      conditionDefinition: definition,
      semanticValues,
      capturedAt: now,
    });

    await this.db
      .insert(userConditionProfiles)
      .values({
        id: randomUUID(),
        userId,
        conditionId: definition.id,
        conditionVersion: definition.version,
        profileJson: profile,
        completedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [userConditionProfiles.userId, userConditionProfiles.conditionId],
        set: {
          conditionVersion: definition.version,
          profileJson: profile,
          completedAt: now,
          updatedAt: now,
        },
      });

    await this.db
      .insert(userConditionOnboardingState)
      .values({
        userId,
        completedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userConditionOnboardingState.userId,
        set: {
          completedAt: now,
          updatedAt: now,
        },
      });

    return await this.getSummary(userId);
  }

  private async listProfiles(userId: string) {
    return await this.db
      .select()
      .from(userConditionProfiles)
      .where(eq(userConditionProfiles.userId, userId))
      .orderBy(desc(userConditionProfiles.updatedAt));
  }

  private async getOnboardingState(userId: string) {
    const [state] = await this.db
      .select()
      .from(userConditionOnboardingState)
      .where(eq(userConditionOnboardingState.userId, userId))
      .limit(1);

    return state ?? null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function coerceSemanticValues(
  definition: ConditionDefinition,
  values: Record<string, unknown>,
): Partial<Record<SemanticKey, SemanticValue>> {
  const allowedFields = new Map(definition.fields.map((field) => [field.key, field]));
  const semanticValues: Partial<Record<SemanticKey, SemanticValue>> = {};

  for (const [key, value] of Object.entries(values)) {
    const field = allowedFields.get(key as SemanticKey);
    if (!field) {
      continue;
    }

    if (value === null) {
      semanticValues[field.key] = null;
      continue;
    }

    if (field.valueType === 'string[]') {
      if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
        throw new BadRequestException(`${field.key} must be a list of strings.`);
      }

      semanticValues[field.key] = value;
      continue;
    }

    if (field.valueType === 'year' || field.valueType === 'number') {
      if (typeof value !== 'number') {
        throw new BadRequestException(`${field.key} must be a number.`);
      }

      semanticValues[field.key] = value;
      continue;
    }

    if (field.valueType === 'boolean') {
      if (typeof value !== 'boolean') {
        throw new BadRequestException(`${field.key} must be a boolean.`);
      }

      semanticValues[field.key] = value;
      continue;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field.key} must be a string.`);
    }

    semanticValues[field.key] = value;
  }

  return semanticValues;
}

function mapProfileRow(row: ConditionProfileRow) {
  return {
    id: row.id,
    conditionId: row.conditionId,
    conditionVersion: row.conditionVersion,
    profile: row.profileJson as UserConditionProfile,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapOnboardingState(row: OnboardingStateRow | null) {
  return {
    skippedAt: row?.skippedAt?.toISOString() ?? null,
    completedAt: row?.completedAt?.toISOString() ?? null,
  };
}
