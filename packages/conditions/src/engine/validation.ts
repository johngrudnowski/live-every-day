import type {
  ConditionDefinition,
  ConditionFlowStep,
  ConditionOption,
  ConditionOptionGroup,
  ConditionStepField,
  ConditionValidationIssue,
  ConditionValidationResult,
  SemanticKey,
  SemanticValue,
} from '../types';
import { isStepVisible } from './visibility';

export function validateConditionValues(
  conditionDefinition: ConditionDefinition,
  values: Partial<Record<SemanticKey, SemanticValue>>,
  options: { requireRequiredFields?: boolean } = {},
): ConditionValidationResult {
  const issues: ConditionValidationIssue[] = [];
  const requireRequiredFields = options.requireRequiredFields ?? true;

  for (const step of conditionDefinition.flow) {
    if (!isStepVisible(step.visibleWhen, values)) {
      continue;
    }

    if (step.fields) {
      issues.push(...validateStepFields(step.id, step.fields, values, requireRequiredFields));
      continue;
    }

    if (!step.semanticKey) {
      continue;
    }

    const value = values[step.semanticKey];

    if (requireRequiredFields && step.required && isEmptyValue(value)) {
      issues.push({
        stepId: step.id,
        field: step.semanticKey,
        message: `${step.title} is required.`,
      });
      continue;
    }

    if (isEmptyValue(value)) {
      continue;
    }

    issues.push(...validateStepValue(step, value as SemanticValue));
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

type ValidatableStep = ConditionFlowStep | ConditionStepField;

export function getAllowedOptionValues(step: ValidatableStep): Set<string> {
  const optionGroups = 'optionGroups' in step ? step.optionGroups : undefined;
  return new Set(
    [...flattenOptions(step.options), ...flattenOptionGroups(optionGroups)].map(
      (option) => option.value,
    ),
  );
}

function validateStepFields(
  parentStepId: string,
  fields: ConditionStepField[],
  values: Partial<Record<SemanticKey, SemanticValue>>,
  requireRequiredFields: boolean,
) {
  return fields.flatMap((field) => {
    const value = values[field.semanticKey];

    if (requireRequiredFields && field.required && isEmptyValue(value)) {
      return [
        {
          stepId: `${parentStepId}.${field.id}`,
          field: field.semanticKey,
          message: `${field.title} is required.`,
        },
      ];
    }

    if (isEmptyValue(value)) {
      return [];
    }

    return validateStepValue(field, value as SemanticValue, parentStepId);
  });
}

function validateStepValue(
  step: ValidatableStep,
  value: SemanticValue,
  parentStepId?: string,
): ConditionValidationIssue[] {
  if (!step.semanticKey) {
    return [];
  }

  if (step.kind === 'year_picker') {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return [buildIssue(step, 'Expected a year value.', parentStepId)];
    }

    if (step.minYear !== undefined && value < step.minYear) {
      return [buildIssue(step, `Year must be ${step.minYear} or later.`, parentStepId)];
    }

    if (step.maxYear !== undefined && value > step.maxYear) {
      return [buildIssue(step, `Year must be ${step.maxYear} or earlier.`, parentStepId)];
    }

    return [];
  }

  const allowedValues = getAllowedOptionValues(step);
  if (allowedValues.size === 0) {
    return [];
  }

  if (step.kind === 'multi_select_cards' || step.kind === 'grouped_toggle_list') {
    if (!Array.isArray(value)) {
      return [buildIssue(step, 'Expected a list of selected values.', parentStepId)];
    }

    const invalidValue = value.find((item) => !allowedValues.has(item));
    return invalidValue ? [buildIssue(step, `Unknown option: ${invalidValue}.`, parentStepId)] : [];
  }

  if (typeof value !== 'string') {
    return [buildIssue(step, 'Expected a selected value.', parentStepId)];
  }

  return allowedValues.has(value)
    ? []
    : [buildIssue(step, `Unknown option: ${value}.`, parentStepId)];
}

function buildIssue(
  step: ValidatableStep,
  message: string,
  parentStepId?: string,
): ConditionValidationIssue {
  return {
    stepId: parentStepId ? `${parentStepId}.${step.id}` : step.id,
    field: step.semanticKey,
    message,
  };
}

function isEmptyValue(value: SemanticValue | undefined) {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function flattenOptions(options: ConditionOption[] | undefined) {
  return options ?? [];
}

function flattenOptionGroups(groups: ConditionOptionGroup[] | undefined) {
  return groups?.flatMap((group) => group.options) ?? [];
}
