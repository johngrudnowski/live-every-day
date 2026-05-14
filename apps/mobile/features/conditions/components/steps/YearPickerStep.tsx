import { YearStepper } from '@led/design-system';
import type { ConditionStepProps } from './types';

export function YearPickerStep({ step, value, onChange }: ConditionStepProps) {
  const fallbackYear =
    typeof step.defaultValue === 'number' ? step.defaultValue : Math.min(new Date().getFullYear(), step.maxYear ?? new Date().getFullYear());
  const year = typeof value === 'number' ? value : fallbackYear;

  return (
    <YearStepper
      value={year}
      min={step.minYear}
      max={step.maxYear}
      onChange={onChange}
      hint={getYearHint(step.id, year)}
    />
  );
}

function getYearHint(stepId: string, year: number) {
  const currentYear = new Date().getFullYear();

  if (stepId === 'birth_year') {
    return `About ${Math.max(0, currentYear - year)} years old`;
  }

  if (stepId === 'diagnosis_year') {
    return `About ${Math.max(0, currentYear - year)} years ago`;
  }

  return undefined;
}
