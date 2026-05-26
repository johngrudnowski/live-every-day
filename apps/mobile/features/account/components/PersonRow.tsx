import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LedText, colors, spacing } from '@led/design-system';

import type { CircleStateTone } from '../api/account-queries';

export function PersonRow({
  avatar,
  name,
  nameAddon,
  detail,
  stateLabel,
  stateTone,
  isLast,
  onPress,
}: {
  avatar: ReactNode;
  name: string;
  nameAddon?: ReactNode;
  detail: string;
  stateLabel: string;
  stateTone: CircleStateTone;
  isLast: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.personIdentity}>
        {avatar}
        <View style={styles.personCopy}>
          <View style={styles.personNameRow}>
            <LedText
              variant="subtitle"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.personName}
            >
              {name}
            </LedText>
            {nameAddon}
          </View>
          <LedText variant="bodySmall" color="predawn" numberOfLines={1} ellipsizeMode="tail">
            {detail}
          </LedText>
        </View>
      </View>
      <View style={styles.personState}>
        <LedText variant="bodySmall" color={getStateToneColor(stateTone)} style={styles.stateLabel}>
          {stateLabel}
        </LedText>
        {onPress ? <FontAwesome name="chevron-right" size={12} color={colors.predawn} /> : null}
      </View>
    </>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.personRow,
        !isLast && styles.rowDivider,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={[styles.personRow, !isLast && styles.rowDivider]}>{content}</View>
  );
}

function getStateToneColor(tone: CircleStateTone) {
  if (tone === 'attention') {
    return 'sunset';
  }

  if (tone === 'muted') {
    return 'afternoon';
  }

  return 'midday';
}

const styles = StyleSheet.create({
  personRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  personIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  personNameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: spacing.xxs,
    minWidth: 0,
  },
  personName: {
    flexShrink: 1,
  },
  personState: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateLabel: {
    flexShrink: 0,
    fontFamily: 'DMSans_600SemiBold',
  },
  pressed: {
    opacity: 0.72,
  },
});
