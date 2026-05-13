import { StyleSheet, View } from 'react-native';
import { CardOption, spacing } from '@led/design-system';
import type { ConditionStepProps } from './types';

export function MultiSelectCardsStep({ step, value, onChange }: ConditionStepProps) {
  const selectedValues = Array.isArray(value) ? value : [];

  function toggle(nextValue: string) {
    const nextValues = selectedValues.includes(nextValue)
      ? selectedValues.filter((selectedValue) => selectedValue !== nextValue)
      : [...selectedValues, nextValue];

    onChange(nextValues);
  }

  return (
    <View style={styles.list}>
      {(step.options ?? []).map((option) => (
        <CardOption
          key={option.value}
          title={option.label}
          subtitle={option.description}
          selected={selectedValues.includes(option.value)}
          selectionVariant="checkbox"
          onPress={() => toggle(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
