import {
  getActiveConditionDefinition,
  normalizeConditionProfile,
  validateConditionValues,
  type ConditionDefinition,
  type ConditionId,
  type SemanticKey,
  type SemanticValue,
} from '@led/conditions';
import { createHash } from 'node:crypto';
import { userConditionOnboardingState, userConditionProfiles } from '../../schema';
import type { SeedContext, SeedResult, SeedUserTarget } from '../types';

export type SeedConditionsOptions = {
  conditionIds: string[];
};

export async function seedConditions(
  ctx: SeedContext,
  target: SeedUserTarget,
  options: SeedConditionsOptions,
): Promise<SeedResult> {
  const definitions = options.conditionIds.map(readActiveConditionDefinition);

  for (const definition of definitions) {
    await seedConditionProfile(ctx, target, definition);
  }

  await ctx.db
    .insert(userConditionOnboardingState)
    .values({
      userId: target.userId,
      completedAt: ctx.now,
      updatedAt: ctx.now,
    })
    .onConflictDoUpdate({
      target: userConditionOnboardingState.userId,
      set: {
        completedAt: ctx.now,
        skippedAt: null,
        updatedAt: ctx.now,
      },
    });

  return {
    module: 'conditions',
    count: definitions.length,
    detail: `upserted ${definitions.length} condition profile(s): ${definitions
      .map((definition) => definition.id)
      .join(', ')}`,
  };
}

async function seedConditionProfile(
  ctx: SeedContext,
  target: SeedUserTarget,
  definition: ConditionDefinition,
) {
  const semanticValues = buildConditionValues(definition);
  const validation = validateConditionValues(definition, semanticValues, {
    requireRequiredFields: true,
  });

  if (!validation.valid) {
    const issues = validation.issues.map((issue) => issue.message).join('; ');
    throw new Error(`Generated seed profile for ${definition.id} is invalid: ${issues}`);
  }

  const profile = {
    ...normalizeConditionProfile({
      conditionDefinition: definition,
      semanticValues,
      source: 'onboarding',
      capturedAt: ctx.now,
    }),
    onboarding: {
      currentStepId: definition.flow.at(-1)?.id,
    },
  };

  await ctx.db
    .insert(userConditionProfiles)
    .values({
      id: createSeedConditionProfileId(target.userId, definition.id),
      userId: target.userId,
      conditionId: definition.id,
      conditionVersion: definition.version,
      profileJson: profile,
      completedAt: ctx.now,
      updatedAt: ctx.now,
    })
    .onConflictDoUpdate({
      target: [userConditionProfiles.userId, userConditionProfiles.conditionId],
      set: {
        conditionVersion: definition.version,
        profileJson: profile,
        completedAt: ctx.now,
        updatedAt: ctx.now,
      },
    });
}

function readActiveConditionDefinition(conditionId: string) {
  const definition = getActiveConditionDefinition(conditionId);
  if (!definition) {
    throw new Error(`Condition "${conditionId}" is not active or does not exist.`);
  }
  return definition;
}

function buildConditionValues(
  definition: ConditionDefinition,
): Partial<Record<SemanticKey, SemanticValue>> {
  if (definition.id === 'mpn') {
    return {
      'diagnosis.condition': 'mpn',
      'diagnosis.mpn.subtypes': ['essential_thrombocythemia'],
      'diagnosis.mpn.driverMutation': 'jak2_positive',
      'diagnosis.mpn.progressions': ['no_progression'],
      'demographics.birthYear': 1965,
      'demographics.gender': 'prefer_not_to_say',
      'diagnosis.year': 2018,
      'history.events': ['hypertension'],
      'history.events.expanded': ['hypertension', 'anxiety'],
    };
  }

  return Object.fromEntries(
    definition.fields.map((field) => [field.key, buildDefaultSemanticValue(definition, field.key)]),
  );
}

function buildDefaultSemanticValue(
  definition: ConditionDefinition,
  semanticKey: SemanticKey,
): SemanticValue {
  const flowItem = definition.flow.find((step) => step.semanticKey === semanticKey);
  const fieldItem = definition.flow
    .flatMap((step) => step.fields ?? [])
    .find((field) => field.semanticKey === semanticKey);
  const fieldDefinition = definition.fields.find((field) => field.key === semanticKey);

  if (!fieldDefinition) {
    return null;
  }

  if (fieldDefinition.valueType === 'string[]') {
    const option = flowItem?.options?.[0] ?? flowItem?.optionGroups?.[0]?.options[0];
    return option ? [option.value] : [];
  }

  if (fieldDefinition.valueType === 'year' || fieldDefinition.valueType === 'number') {
    return typeof fieldItem?.defaultValue === 'number' ? fieldItem.defaultValue : 2020;
  }

  if (fieldDefinition.valueType === 'boolean') {
    return false;
  }

  const option = flowItem?.options?.[0] ?? fieldItem?.options?.[0];
  return option?.value ?? String(definition.id);
}

function createSeedConditionProfileId(userId: string, conditionId: ConditionId) {
  const digest = createHash('sha256')
    .update(`${userId}:${conditionId}:condition-profile`)
    .digest('hex')
    .slice(0, 24);
  return `seed_condition_${digest}`;
}
