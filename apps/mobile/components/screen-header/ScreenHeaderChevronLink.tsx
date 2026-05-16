import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { PressableProps } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { LedText, colors, spacing } from '@led/design-system';

type ScreenHeaderChevronLinkProps = {
  label: string;
  onPress: PressableProps['onPress'];
  accessibilityLabel?: string;
};

export function ScreenHeaderChevronLink({
  label,
  onPress,
  accessibilityLabel,
}: ScreenHeaderChevronLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={spacing.sm}
      onPress={onPress}
      style={styles.pressable}
    >
      <View style={styles.inner}>
        <FontAwesome name="chevron-left" size={14} color={colors.midday} />
        <LedText variant="subtitle" color="midday">
          {label}
        </LedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
  },
  inner: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
