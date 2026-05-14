import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors } from '../theme/colors';
import { radii } from '../theme/radii';

type ProgressBarProps = ViewProps & {
  value: number;
  max?: number;
};

function progressRatio(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, value / max));
}

export function ProgressBar({ value, max = 1, style, ...props }: ProgressBarProps) {
  const ratio = progressRatio(value, max);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      {...props}
      style={[styles.track, style]}
    >
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    overflow: 'hidden',
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  fill: {
    height: '100%',
    borderRadius: radii.sm,
    backgroundColor: colors.midday,
  },
});
