import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LedText, colors, spacing } from '@led/design-system';

type IconName = ComponentProps<typeof FontAwesome>['name'];

type BottomNavItem = {
  label: string;
  icon: IconName;
  active?: boolean;
};

const bottomNavItems: BottomNavItem[] = [
  { label: 'Hope', icon: 'home', active: true },
  { label: 'Check-in', icon: 'check-circle-o' },
  { label: 'Data', icon: 'bar-chart' },
  { label: 'Prep', icon: 'star-o' },
  { label: 'Account', icon: 'user-o' },
];

export function DashboardBottomBar() {
  return (
    <View style={styles.bar}>
      {bottomNavItems.map((item) => (
        <BottomNavButton key={item.label} item={item} />
      ))}
    </View>
  );
}

function BottomNavButton({ item }: { item: BottomNavItem }) {
  const tint = item.active ? colors.midday : colors.predawn;

  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <FontAwesome name={item.icon} size={18} color={tint} />
      <LedText variant="bodySmall" style={[styles.label, { color: tint }, item.active && styles.labelActive]}>
        {item.label}
      </LedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
  },
  labelActive: {
    fontFamily: 'DMSans_600SemiBold',
  },
  pressed: {
    opacity: 0.72,
  },
});
