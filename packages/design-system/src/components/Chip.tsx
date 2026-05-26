import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';
import { LedText } from './LedText';

type ChipProps = Omit<PressableProps, 'children'> & {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, selected = false, disabled, style, ...props }: ChipProps) {
  const isDisabled = disabled === true;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: isDisabled }}
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <LedText variant="chip" color={selected ? 'midnight' : 'textMid'}>
        {label}
      </LedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  selected: {
    borderColor: colors.midday,
    backgroundColor: colors.midday,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
