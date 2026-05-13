import { StyleSheet, View } from 'react-native';
import { CardOption, spacing } from '@led/design-system';
import type { ConditionStepProps } from './types';

export function SingleSelectCardsStep({ step, value, onChange }: ConditionStepProps) {
  return (
    <View style={styles.list}>
      {(step.options ?? []).map((option) => (
        <CardOption
          key={option.value}
          title={option.label}
          subtitle={option.description}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
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
