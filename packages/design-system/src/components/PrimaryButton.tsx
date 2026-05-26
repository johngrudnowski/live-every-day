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

type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'danger';

type PrimaryButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variantStyles = {
  primary: {
    backgroundColor: colors.midday,
    borderColor: colors.midday,
    color: colors.midnight,
  },
  dark: {
    backgroundColor: colors.midnight,
    borderColor: colors.midnight,
    color: colors.canvas,
  },
  secondary: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.text,
  },
  danger: {
    backgroundColor: colors.flagHigh,
    borderColor: colors.flagHigh,
    color: colors.white,
  },
} as const;

export function PrimaryButton({
  label,
  variant = 'primary',
  fullWidth = false,
  disabled,
  style,
  ...props
}: PrimaryButtonProps) {
  const variantStyle = variantStyles[variant];
  const isDisabled = disabled === true;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          opacity: isDisabled ? 0.45 : pressed ? 0.78 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <LedText variant="button" style={{ color: variantStyle.color }}>
        {label}
      </LedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radii.xxl,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
});
