import { Pressable, StyleSheet, View } from 'react-native';
import { LedText, ProgressBar, colors, spacing } from '@led/design-system';

type ConditionFlowHeaderProps = {
  title: string;
  progressValue?: number;
  progressMax?: number;
  onBack?: () => void;
  onSkip?: () => void;
};

export function ConditionFlowHeader({
  title,
  progressValue = 0,
  progressMax = 1,
  onBack,
  onSkip,
}: ConditionFlowHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <HeaderButton label="‹" accessibilityLabel="Go back" onPress={onBack} />
        <LedText variant="subtitle" align="center" style={styles.title}>
          {title}
        </LedText>
        {onSkip ? (
          <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skipButton}>
            <LedText variant="chip" color="midday">
              Skip
            </LedText>
          </Pressable>
        ) : (
          <View style={styles.sideSpacer} />
        )}
      </View>
      <ProgressBar value={progressValue} max={progressMax} />
    </View>
  );
}

function HeaderButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed, !onPress && styles.disabled]}
    >
      <LedText variant="title" color="midday">
        {label}
      </LedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    color: colors.midnight,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sideSpacer: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0,
  },
});
