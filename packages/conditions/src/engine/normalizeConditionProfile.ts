import type {
  NormalizeConditionProfileInput,
  SemanticKey,
  SemanticValue,
  UserConditionProfile,
} from '../types';

export function normalizeConditionProfile({
  conditionDefinition,
  semanticValues,
  source = 'onboarding',
  capturedAt = new Date(),
}: NormalizeConditionProfileInput): UserConditionProfile {
  const capturedAtIso = capturedAt.toISOString();
  const values = stripUndefinedValues({
    ...semanticValues,
    'diagnosis.condition': conditionDefinition.id,
  });

  return {
    schema: conditionDefinition.profileSchemaId,
    conditionDefinitionId: conditionDefinition.id,
    conditionDefinitionVersion: conditionDefinition.version,
    collectedAt: capturedAtIso,
    updatedAt: capturedAtIso,
    values,
    provenance: Object.fromEntries(
      Object.keys(values).map((semanticKey) => [
        semanticKey,
        {
          source,
          stepId: getStepIdForSemanticKey(conditionDefinition.flow, semanticKey as SemanticKey),
          conditionDefinitionVersion: conditionDefinition.version,
          capturedAt: capturedAtIso,
        },
      ]),
    ),
  };
}

function stripUndefinedValues(
  values: Partial<Record<SemanticKey, SemanticValue>>,
): Record<string, SemanticValue> {
  return Object.fromEntries(
    Object.entries(values).filter(
      (entry): entry is [string, SemanticValue] => entry[1] !== undefined,
    ),
  );
}

function getStepIdForSemanticKey(
  flow: NormalizeConditionProfileInput['conditionDefinition']['flow'],
  semanticKey: SemanticKey,
) {
  for (const step of flow) {
    if (step.semanticKey === semanticKey) {
      return step.id;
    }

    const field = step.fields?.find((stepField) => stepField.semanticKey === semanticKey);
    if (field) {
      return `${step.id}.${field.id}`;
    }
  }

  return undefined;
}
