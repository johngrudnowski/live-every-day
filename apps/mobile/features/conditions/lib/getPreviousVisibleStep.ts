import type { ConditionDefinition, ConditionFlowStep, SemanticKey, SemanticValue } from '@led/conditions';
import { getVisibleSteps } from './getVisibleSteps';

export function getPreviousVisibleStep(
  conditionDefinition: ConditionDefinition,
  currentStepId: string,
  values: Partial<Record<SemanticKey, SemanticValue>>,
): ConditionFlowStep | null {
  const steps = getVisibleSteps(conditionDefinition, values);
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);
  return currentIndex > 0 ? steps[currentIndex - 1] ?? null : null;
}
