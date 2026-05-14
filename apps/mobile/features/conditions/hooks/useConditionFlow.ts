import { useMemo, useReducer } from 'react';
import type {
  ConditionDefinition,
  ConditionFlowStep,
  ConditionStepField,
  SemanticValue,
} from '@led/conditions';

import { conditionFlowReducer, createInitialConditionFlowState } from '../lib/conditionFlowReducer';
import { getVisibleSteps } from '../lib/getVisibleSteps';

type UseConditionFlowOptions = {
  initialStepId?: string;
  initialValues?: Partial<Record<string, SemanticValue>>;
  includeLinkedSteps?: boolean;
};

export function useConditionFlow(
  conditionDefinition: ConditionDefinition,
  options: UseConditionFlowOptions = {},
) {
  const firstStepId = options.initialStepId ?? conditionDefinition.flow[0]?.id ?? 'done';
  const [state, dispatch] = useReducer(
    conditionFlowReducer,
    createInitialConditionFlowState(
      conditionDefinition.id,
      firstStepId,
      options.initialValues as ReturnType<typeof createInitialConditionFlowState>['semanticValues'],
    ),
  );
  const visibleSteps = useMemo(() => {
    if (options.includeLinkedSteps) {
      return conditionDefinition.flow;
    }

    return getVisibleSteps(conditionDefinition, state.semanticValues);
  }, [conditionDefinition, options.includeLinkedSteps, state.semanticValues]);
  const currentStep =
    visibleSteps.find((step) => step.id === state.currentStepId) ??
    conditionDefinition.flow.find((step) => step.id === state.currentStepId) ??
    visibleSteps[0] ??
    null;
  const currentIndex = currentStep
    ? visibleSteps.findIndex((step) => step.id === currentStep.id)
    : -1;

  function setValue(step: ConditionFlowStep | ConditionStepField, value: SemanticValue) {
    if (!step.semanticKey) {
      return;
    }

    dispatch({
      type: 'set_value',
      stepId: step.id,
      semanticKey: step.semanticKey,
      value,
    });
  }

  function goNext() {
    if (!currentStep) {
      return null;
    }

    const nextStep = visibleSteps[currentIndex + 1] ?? null;
    if (nextStep) {
      dispatch({ type: 'set_step', stepId: nextStep.id });
    }

    return nextStep;
  }

  function goBack() {
    if (!currentStep) {
      return null;
    }

    const previousStep = visibleSteps[currentIndex - 1] ?? null;
    if (previousStep) {
      dispatch({ type: 'set_step', stepId: previousStep.id });
    }

    return previousStep;
  }

  function goToStep(stepId: string) {
    const step = conditionDefinition.flow.find((flowStep) => flowStep.id === stepId) ?? null;

    if (step) {
      dispatch({ type: 'set_step', stepId: step.id });
    }

    return step;
  }

  function seedDefaultValue(step: ConditionFlowStep) {
    if (step.fields) {
      for (const field of step.fields) {
        if (
          state.semanticValues[field.semanticKey] === undefined &&
          field.defaultValue !== undefined
        ) {
          setValue(field, field.defaultValue);
        }
      }

      return;
    }

    if (
      !step.semanticKey ||
      state.semanticValues[step.semanticKey] !== undefined ||
      step.defaultValue === undefined
    ) {
      return;
    }

    setValue(step, step.defaultValue);
  }

  return {
    state,
    visibleSteps,
    currentStep,
    currentIndex,
    isFirstStep: currentIndex <= 0,
    isLastStep: currentIndex === visibleSteps.length - 1,
    setValue,
    goNext,
    goBack,
    goToStep,
    seedDefaultValue,
  };
}
