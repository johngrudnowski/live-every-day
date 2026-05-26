import { LedText, colors, radii, spacing } from '@led/design-system';
import { Pressable, StyleSheet } from 'react-native';

type MetricTone = 'ok' | 'warning' | 'high' | 'empty';

export function DataMetricCard({
  label,
  status,
  tone = 'ok',
  unit,
  value,
  onPress,
}: {
  label: string;
  status: string;
  tone?: MetricTone;
  unit?: string | null;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <LedText variant="bodySmall" color="predawn">
        {label}
      </LedText>
      <LedText style={styles.value}>
        {value}
        {unit ? <LedText style={styles.unit}> {unit}</LedText> : null}
      </LedText>
      <LedText variant="bodySmall" style={[styles.status, getToneStyle(tone)]}>
        {status}
      </LedText>
    </Pressable>
  );
}

function getToneStyle(tone: MetricTone) {
  if (tone === 'high') {
    return styles.high;
  }

  if (tone === 'warning') {
    return styles.warning;
  }

  if (tone === 'empty') {
    return styles.empty;
  }

  return styles.ok;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  value: {
    color: colors.midnight,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 22,
    lineHeight: 27,
  },
  unit: {
    color: colors.midnight,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  status: {
    fontFamily: 'DMSans_500Medium',
  },
  high: {
    color: colors.flagHigh,
  },
  warning: {
    color: colors.sunset,
  },
  ok: {
    color: '#1A6040',
  },
  empty: {
    color: colors.predawn,
  },
  pressed: {
    opacity: 0.72,
  },
});
