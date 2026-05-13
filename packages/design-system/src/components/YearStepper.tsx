import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';
import { LedText } from './LedText';

type YearStepperProps = {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  hint?: string;
  min?: number;
  max?: number;
  style?: ViewStyle;
};

function clampYear(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function YearStepper({
  value,
  onChange,
  label,
  hint,
  min = 1900,
  max = new Date().getFullYear(),
  style,
}: YearStepperProps) {
  function adjust(delta: number) {
    onChange(clampYear(value + delta, min, max));
  }

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <LedText variant="label" color="predawn" style={styles.label}>
          {label}
        </LedText>
      ) : null}
      <View style={styles.control}>
        <StepperButton label="-" disabled={value <= min} onPress={() => adjust(-1)} />
        <View style={styles.valueWrap}>
          <LedText variant="displayMedium" align="center">
            {value}
          </LedText>
          {hint ? (
            <LedText variant="bodySmall" color="textMid" align="center">
              {hint}
            </LedText>
          ) : null}
        </View>
        <StepperButton label="+" disabled={value >= max} onPress={() => adjust(1)} />
      </View>
    </View>
  );
}

function StepperButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.stepperButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <LedText variant="title" color="midnight">
        {label}
      </LedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    marginBottom: spacing.xs,
  },
  control: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.canvas,
    padding: spacing.sm,
  },
  valueWrap: {
    flex: 1,
    alignItems: 'center',
  },
  stepperButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    backgroundColor: colors.border,
  },
});
