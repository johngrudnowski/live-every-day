import type { ConditionFlowState, ConditionId, SemanticKey, SemanticValue } from '@led/conditions';

type ConditionFlowAction =
  | { type: 'set_step'; stepId: string }
  | { type: 'set_value'; stepId: string; semanticKey: SemanticKey; value: SemanticValue }
  | { type: 'skip_step'; stepId: string };

export function createInitialConditionFlowState(
  conditionId: ConditionId,
  firstStepId: string,
  semanticValues: ConditionFlowState['semanticValues'] = {},
): ConditionFlowState {
  return {
    conditionId,
    currentStepId: firstStepId,
    answers: {},
    semanticValues,
    skippedStepIds: [],
  };
}

export function conditionFlowReducer(
  state: ConditionFlowState,
  action: ConditionFlowAction,
): ConditionFlowState {
  if (action.type === 'set_step') {
    return {
      ...state,
      currentStepId: action.stepId,
    };
  }

  if (action.type === 'skip_step') {
    return {
      ...state,
      skippedStepIds: [...new Set([...state.skippedStepIds, action.stepId])],
    };
  }

  return {
    ...state,
    answers: {
      ...state.answers,
      [action.stepId]: action.value,
    },
    semanticValues: {
      ...state.semanticValues,
      [action.semanticKey]: action.value,
    },
  };
}
