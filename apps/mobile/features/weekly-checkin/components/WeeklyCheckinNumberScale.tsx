import { Pressable, StyleSheet, View } from 'react-native';
import { LedText, colors, spacing } from '@led/design-system';

type WeeklyCheckinNumberScaleProps = {
  value?: number;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
  scoreDirection?: string;
  onChange: (value: number) => void;
};

export function WeeklyCheckinNumberScale({
  value,
  min = 0,
  max = 10,
  lowLabel,
  highLabel,
  scoreDirection = 'higher_is_better',
  onChange,
}: WeeklyCheckinNumberScaleProps) {
  const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {values.map((number) => {
          const selected = value === number;
          const tone = getTone(number, min, max, scoreDirection, true);

          return (
            <Pressable
              key={number}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(number)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                selected && tone === 'good' && styles.selectedGood,
                selected && tone === 'bad' && styles.selectedBad,
                pressed && !selected && styles.pressed,
              ]}
            >
              <LedText
                variant="bodySmall"
                style={[styles.optionText, selected && styles.selectedText]}
              >
                {number}
              </LedText>
            </Pressable>
          );
        })}
      </View>
      {value === undefined ? (
        <LedText variant="bodySmall" color="predawn" align="center">
          {`${min} = ${lowLabel ?? 'not at all'} · ${max} = ${highLabel ?? 'as bad as it gets'}`}
        </LedText>
      ) : (
        <LedText
          variant="bodySmall"
          align="center"
          style={[
            styles.selectedDescriptor,
            getTone(value, min, max, scoreDirection) === 'good'
              ? styles.selectedDescriptorGood
              : styles.selectedDescriptorBad,
          ]}
        >
          {getDescriptor(value, min, max)}
        </LedText>
      )}
    </View>
  );
}

function getTone(
  value: number,
  min: number,
  max: number,
  scoreDirection: string,
  strictMidpoint = false,
) {
  const midpoint = min + (max - min) / 2;
  const higherIsGood = scoreDirection !== 'lower_is_better';
  const good = higherIsGood
    ? strictMidpoint
      ? value > midpoint
      : value >= midpoint
    : strictMidpoint
      ? value < midpoint
      : value <= midpoint;
  return good ? 'good' : 'bad';
}

function getDescriptor(value: number, min: number, max: number) {
  const ratio = (value - min) / Math.max(1, max - min);
  if (ratio <= 0.1) {
    return 'Not at all';
  }
  if (ratio <= 0.25) {
    return 'Barely there';
  }
  if (ratio <= 0.4) {
    return 'Mild';
  }
  if (ratio <= 0.55) {
    return 'Moderate';
  }
  if (ratio <= 0.75) {
    return 'Quite significant';
  }
  if (ratio <= 0.9) {
    return 'Really affecting you';
  }
  return 'Hard to manage';
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    gap: 3,
  },
  option: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 7,
    backgroundColor: colors.card,
  },
  selected: {
    borderWidth: 0,
  },
  selectedGood: {
    backgroundColor: colors.midday,
  },
  selectedBad: {
    borderColor: colors.flagHigh,
    backgroundColor: colors.flagHigh,
  },
  optionText: {
    color: colors.predawn,
  },
  selectedText: {
    fontFamily: 'DMSans_700Bold',
    color: colors.white,
  },
  selectedDescriptor: {
    fontFamily: 'DMSans_600SemiBold',
  },
  selectedDescriptorGood: {
    color: colors.midday,
  },
  selectedDescriptorBad: {
    color: colors.flagHigh,
  },
  pressed: {
    opacity: 0.7,
  },
});
