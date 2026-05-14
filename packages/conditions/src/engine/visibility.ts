import type { SemanticValue, VisibilityRule } from '../types';

export function isStepVisible(
  visibleWhen: VisibilityRule | undefined,
  values: Record<string, SemanticValue | undefined>,
): boolean {
  if (!visibleWhen) {
    return true;
  }

  if ('field' in visibleWhen && 'equals' in visibleWhen) {
    return values[visibleWhen.field] === visibleWhen.equals;
  }

  if ('field' in visibleWhen && 'includes' in visibleWhen) {
    const value = values[visibleWhen.field];
    return Array.isArray(value) && value.includes(visibleWhen.includes);
  }

  if ('all' in visibleWhen) {
    return visibleWhen.all.every((rule) => isStepVisible(rule, values));
  }

  if ('any' in visibleWhen) {
    return visibleWhen.any.some((rule) => isStepVisible(rule, values));
  }

  return !isStepVisible(visibleWhen.not, values);
}
