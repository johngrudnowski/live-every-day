import { StyleSheet, View } from 'react-native';
import { CardOption, LedText, spacing } from '@led/design-system';
import type { ConditionStepProps } from './types';

export function GroupedToggleListStep({ step, value, onChange }: ConditionStepProps) {
  const selectedValues = Array.isArray(value) ? value : [];

  function toggle(nextValue: string) {
    const nextValues = selectedValues.includes(nextValue)
      ? selectedValues.filter((selectedValue) => selectedValue !== nextValue)
      : [...selectedValues, nextValue];

    onChange(nextValues);
  }

  return (
    <View style={styles.wrapper}>
      {(step.optionGroups ?? []).map((group) => (
        <View key={group.id} style={styles.group}>
          <LedText variant="label" color="predawn">
            {group.label}
          </LedText>
          <View style={styles.list}>
            {group.options.map((option) => (
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
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
});
