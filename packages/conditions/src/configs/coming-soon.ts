import type { ConditionDefinition, ConditionId } from '../types';

export function createComingSoonCondition(
  id: ConditionId,
  label: string,
  subtitle: string,
): ConditionDefinition {
  return {
    id,
    version: 1,
    label,
    subtitle,
    status: 'coming_soon',
    profileSchemaId: 'led.conditionProfile.v1',
    fields: [],
    flow: [
      {
        id: `${id}_coming_soon`,
        kind: 'info_interstitial',
        title: 'Coming soon',
        subtitle:
          "This condition path is in development. We're building each one with specialist input to get it right.",
      },
    ],
    outputs: {
      primaryDiagnosisKey: 'diagnosis.condition',
      summaryFields: [],
      tags: [],
    },
  };
}
