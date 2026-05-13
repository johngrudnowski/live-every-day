import {
  isStepVisible,
  type ConditionDefinition,
  type SemanticKey,
  type SemanticValue,
} from '@led/conditions';

export function getVisibleSteps(
  conditionDefinition: ConditionDefinition,
  values: Partial<Record<SemanticKey, SemanticValue>>,
) {
  return conditionDefinition.flow.filter(
    (step) => step.includeInOnboarding !== false && isStepVisible(step.visibleWhen, values),
  );
}
