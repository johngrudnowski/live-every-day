import { ChipGroup } from '@led/design-system';
import type { ConditionStepProps } from './types';

export function ChipSelectStep({ step, value, onChange }: ConditionStepProps) {
  return (
    <ChipGroup
      options={(step.options ?? []).map((option) => ({
        label: option.label,
        value: option.value,
      }))}
      value={typeof value === 'string' ? value : undefined}
      onChange={(nextValue) => {
        if (typeof nextValue === 'string') {
          onChange(nextValue);
        }
      }}
    />
  );
}
