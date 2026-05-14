import { StyleSheet, View, type ViewStyle } from 'react-native';

import { spacing } from '../theme/spacing';
import { Chip } from './Chip';

export type ChipOption<TValue extends string = string> = {
  label: string;
  value: TValue;
  disabled?: boolean;
};

type ChipGroupProps<TValue extends string = string> = {
  options: ChipOption<TValue>[];
  value?: TValue | TValue[];
  multiple?: boolean;
  onChange: (value: TValue | TValue[]) => void;
  style?: ViewStyle;
};

export function ChipGroup<TValue extends string = string>({
  options,
  value,
  multiple = false,
  onChange,
  style,
}: ChipGroupProps<TValue>) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  function handlePress(nextValue: TValue) {
    if (!multiple) {
      onChange(nextValue);
      return;
    }

    const nextValues = selectedValues.includes(nextValue)
      ? selectedValues.filter((selectedValue) => selectedValue !== nextValue)
      : [...selectedValues, nextValue];

    onChange(nextValues);
  }

  return (
    <View style={[styles.group, style]}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={selectedValues.includes(option.value)}
          disabled={option.disabled}
          onPress={() => handlePress(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
