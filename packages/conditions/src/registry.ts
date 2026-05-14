import { breastCondition } from './configs/breast.condition';
import { cllCondition } from './configs/cll.condition';
import { mpnCondition } from './configs/mpn.condition';
import { prostateCondition } from './configs/prostate.condition';
import { remissionCondition } from './configs/remission.condition';
import { thyroidCondition } from './configs/thyroid.condition';
import type { ConditionDefinition, ConditionId, ConditionRegistryItem } from './types';

export const conditionDefinitions = [
  mpnCondition,
  cllCondition,
  prostateCondition,
  breastCondition,
  thyroidCondition,
  remissionCondition,
] satisfies ConditionDefinition[];

export function getConditionDefinition(conditionId: string): ConditionDefinition | undefined {
  return conditionDefinitions.find((condition) => condition.id === conditionId);
}

export function getActiveConditionDefinition(conditionId: string): ConditionDefinition | undefined {
  const definition = getConditionDefinition(conditionId);
  return definition?.status === 'active' ? definition : undefined;
}

export function getConditionRegistryItems(): ConditionRegistryItem[] {
  return conditionDefinitions
    .filter((condition) => condition.status !== 'hidden')
    .map(({ id, version, label, subtitle, status }) => ({ id, version, label, subtitle, status }));
}

export function isConditionId(value: string): value is ConditionId {
  return conditionDefinitions.some((condition) => condition.id === value);
}
