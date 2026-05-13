import { StyleSheet, View } from 'react-native';
import { ChipGroup, LedText, YearStepper, spacing } from '@led/design-system';
import type { ConditionStepField, SemanticKey, SemanticValue } from '@led/conditions';

type FieldGroupStepProps = {
  fields: ConditionStepField[];
  values: Partial<Record<SemanticKey, SemanticValue>>;
  onFieldChange: (field: ConditionStepField, value: SemanticValue) => void;
};

export function FieldGroupStep({ fields, values, onFieldChange }: FieldGroupStepProps) {
  return (
    <View style={styles.wrapper}>
      {fields.map((field) => (
        <View key={field.id} style={styles.field}>
          <LedText variant="label" color="predawn">
            {field.title}
          </LedText>
          {renderField(field, values[field.semanticKey], (value) => onFieldChange(field, value))}
        </View>
      ))}
    </View>
  );
}

function renderField(
  field: ConditionStepField,
  value: SemanticValue | undefined,
  onChange: (value: SemanticValue) => void,
) {
  if (field.kind === 'year_picker') {
    const fallbackYear =
      typeof field.defaultValue === 'number'
        ? field.defaultValue
        : Math.min(new Date().getFullYear(), field.maxYear ?? new Date().getFullYear());

    return (
      <YearStepper
        value={typeof value === 'number' ? value : fallbackYear}
        min={field.minYear}
        max={field.maxYear}
        onChange={onChange}
        hint={getYearHint(field.id, typeof value === 'number' ? value : fallbackYear)}
      />
    );
  }

  if (field.kind === 'chip_select') {
    return (
      <ChipGroup
        options={(field.options ?? []).map((option) => ({
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

  return null;
}

function getYearHint(fieldId: string, year: number) {
  const currentYear = new Date().getFullYear();

  if (fieldId === 'birth_year') {
    return `About ${Math.max(0, currentYear - year)} years old`;
  }

  if (fieldId === 'diagnosis_year') {
    return `About ${Math.max(0, currentYear - year)} years ago`;
  }

  return undefined;
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
});
