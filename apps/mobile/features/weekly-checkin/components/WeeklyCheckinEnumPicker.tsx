import { Pressable, StyleSheet, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';
import type { WeeklyCheckinQuestion } from '../api/weekly-checkin-queries';

type WeeklyCheckinEnumPickerProps = {
  value?: string;
  options: NonNullable<WeeklyCheckinQuestion['options']>;
  onChange: (value: string) => void;
};

export function WeeklyCheckinEnumPicker({
  value,
  options,
  onChange,
}: WeeklyCheckinEnumPickerProps) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => [
            styles.option,
            value === option.value && styles.optionSelected,
            value === option.value && getOptionTone(option.value) === 'some' && styles.optionSome,
            value === option.value && getOptionTone(option.value) === 'a_lot' && styles.optionALot,
            pressed && value !== option.value && styles.optionPressed,
          ]}
        >
          <LedText
            variant="bodySmall"
            style={[styles.optionLabel, value === option.value && styles.optionLabelSelected]}
          >
            {option.label}
          </LedText>
        </Pressable>
      ))}
    </View>
  );
}

function getOptionTone(optionValue: string) {
  if (optionValue === 'a_lot' || optionValue === 'lot') {
    return 'a_lot';
  }
  if (optionValue === 'some') {
    return 'some';
  }
  return 'none';
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  optionSelected: {
    borderWidth: 0,
    backgroundColor: colors.midday,
  },
  optionSome: {
    backgroundColor: colors.sunset,
  },
  optionALot: {
    backgroundColor: colors.flagHigh,
  },
  optionLabel: {
    color: colors.midnight,
  },
  optionLabelSelected: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
  },
  optionPressed: {
    opacity: 0.7,
  },
});
