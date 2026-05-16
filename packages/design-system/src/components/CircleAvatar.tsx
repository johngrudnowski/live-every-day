import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { LedText } from './LedText';

type CircleAvatarTone = 'default' | 'primary' | 'support' | 'care' | 'muted';

type CircleAvatarProps = ViewProps & {
  label: string;
  initials?: string | null;
  size?: number;
  tone?: CircleAvatarTone;
};

const toneStyles = {
  default: {
    backgroundColor: colors.midday,
    color: colors.midnight,
  },
  primary: {
    backgroundColor: colors.flagHighBg,
    color: colors.flagHigh,
  },
  support: {
    backgroundColor: colors.flagOkBg,
    color: '#1A6040',
  },
  care: {
    backgroundColor: colors.selectedBg,
    color: colors.midday,
  },
  muted: {
    backgroundColor: colors.surface,
    color: colors.predawn,
  },
} as const;

export function CircleAvatar({
  label,
  initials,
  size = 40,
  tone = 'default',
  style,
  ...props
}: CircleAvatarProps) {
  const resolvedInitials = initials?.trim() || getInitials(label);
  const toneStyle = toneStyles[tone];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      {...props}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2 || radii.pill,
          backgroundColor: toneStyle.backgroundColor,
        },
        style,
      ]}
    >
      <LedText
        variant="label"
        style={[
          styles.initials,
          {
            color: toneStyle.color,
            fontSize: Math.max(10, Math.round(size * 0.32)),
            lineHeight: Math.max(12, Math.round(size * 0.38)),
          },
        ]}
      >
        {resolvedInitials}
      </LedText>
    </View>
  );
}

function getInitials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const styles = StyleSheet.create({
  avatar: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0,
  },
});
