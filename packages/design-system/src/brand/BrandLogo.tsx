import { StyleSheet, View, type ViewProps } from 'react-native';

import { spacing } from '../theme/spacing';
import { LogoMark } from './LogoMark';
import { Wordmark } from './Wordmark';

type BrandLogoProps = ViewProps & {
  markSize?: number;
  wordmarkSize?: 'small' | 'medium' | 'large';
  inverse?: boolean;
  showWordmark?: boolean;
};

export function BrandLogo({
  markSize = 48,
  wordmarkSize = 'medium',
  inverse = false,
  showWordmark = true,
  style,
  ...props
}: BrandLogoProps) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Live Every Day"
      {...props}
      style={[styles.row, style]}
    >
      <LogoMark size={markSize} />
      {showWordmark ? <Wordmark size={wordmarkSize} inverse={inverse} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
