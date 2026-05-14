import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';
import { LedText } from './LedText';

type SelectionVariant = 'radio' | 'checkbox';

type CardOptionProps = Omit<PressableProps, 'children'> & {
  title: string;
  subtitle?: string;
  selected?: boolean;
  selectionVariant?: SelectionVariant;
  style?: StyleProp<ViewStyle>;
};

export function CardOption({
  title,
  subtitle,
  selected = false,
  selectionVariant = 'radio',
  disabled,
  style,
  ...props
}: CardOptionProps) {
  const isDisabled = disabled === true;

  return (
    <Pressable
      accessibilityRole={selectionVariant}
      accessibilityState={{ checked: selected, disabled: isDisabled }}
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.copy}>
        <LedText variant="subtitle" color="text">
          {title}
        </LedText>
        {subtitle ? (
          <LedText variant="bodySmall" color="textMid" style={styles.subtitle}>
            {subtitle}
          </LedText>
        ) : null}
      </View>
      <SelectionIndicator selected={selected} variant={selectionVariant} />
    </Pressable>
  );
}

function SelectionIndicator({ selected, variant }: { selected: boolean; variant: SelectionVariant }) {
  if (variant === 'checkbox') {
    return (
      <View style={[styles.checkbox, selected && styles.indicatorSelected]}>
        {selected ? <View style={styles.checkmark} /> : null}
      </View>
    );
  }

  return <View style={[styles.radio, selected && styles.indicatorSelected]}>{selected ? <View style={styles.dot} /> : null}</View>;
}

const styles = StyleSheet.create({
  card: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  selected: {
    borderColor: colors.midday,
    backgroundColor: colors.selectedBg,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  copy: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.pill,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.sm,
  },
  indicatorSelected: {
    borderColor: colors.midday,
    backgroundColor: colors.midday,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  checkmark: {
    width: 7,
    height: 12,
    marginBottom: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.white,
    transform: [{ rotate: '45deg' }],
  },
});
