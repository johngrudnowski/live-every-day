import type { ConditionFlowStep, SemanticValue } from '@led/conditions';

export type ConditionStepProps = {
  step: ConditionFlowStep;
  value: SemanticValue | undefined;
  onChange: (value: SemanticValue) => void;
};
