import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, type ColorToken } from '../theme/colors';
import { typography, type TypographyToken } from '../theme/typography';

type LedTextProps = TextProps & {
  variant?: TypographyToken;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
};

export function LedText({
  variant = 'body',
  color = 'text',
  align,
  style,
  ...props
}: LedTextProps) {
  return (
    <Text
      {...props}
      style={[typography[variant], { color: colors[color], textAlign: align }, style]}
    />
  );
}
