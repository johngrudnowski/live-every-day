import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors } from '../theme/colors';
import { LedText } from '../components/LedText';

type WordmarkProps = ViewProps & {
  size?: 'small' | 'medium' | 'large';
  inverse?: boolean;
};

const sizes = {
  small: 20,
  medium: 28,
  large: 36,
} as const;

export function Wordmark({ size = 'medium', inverse = false, style, ...props }: WordmarkProps) {
  const fontSize = sizes[size];
  const baseColor = inverse ? colors.canvas : colors.midnight;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Live Every Day"
      {...props}
      style={[styles.row, style]}
    >
      <LedText
        variant="displayMedium"
        style={[styles.word, { color: baseColor, fontSize, lineHeight: fontSize + 8 }]}
      >
        Live{' '}
      </LedText>
      <LedText
        variant="displayMedium"
        style={[styles.word, { color: colors.sunrise, fontSize, lineHeight: fontSize + 8 }]}
      >
        Every
      </LedText>
      <LedText
        variant="displayMedium"
        style={[styles.word, { color: baseColor, fontSize, lineHeight: fontSize + 8 }]}
      >
        {' '}
        Day
      </LedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  word: {
    letterSpacing: 0.75,
  },
});
