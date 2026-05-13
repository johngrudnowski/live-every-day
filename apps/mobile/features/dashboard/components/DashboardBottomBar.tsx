import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LedText, colors, spacing } from '@led/design-system';
import { useWeeklyCheckinSummaryQuery } from '@/features/weekly-checkin/api/weekly-checkin-queries';
import { routeToWeeklyCheckin } from '@/features/weekly-checkin/lib/weeklyCheckinRoutes';

type IconName = ComponentProps<typeof FontAwesome>['name'];

type BottomNavItem = {
  label: string;
  icon: IconName;
  route?: '/home' | '/account';
  kind?: 'check-in';
};

const bottomNavItems: BottomNavItem[] = [
  { label: 'Hope', icon: 'home', route: '/home' },
  { label: 'Check-in', icon: 'check-circle-o', kind: 'check-in' },
  { label: 'Data', icon: 'bar-chart' },
  { label: 'Prep', icon: 'star-o' },
  { label: 'Account', icon: 'user-o', route: '/account' },
];

export function DashboardBottomBar({ activeLabel = 'Hope' }: { activeLabel?: string }) {
  return (
    <View style={styles.bar}>
      {bottomNavItems.map((item) => (
        <BottomNavButton key={item.label} item={item} active={item.label === activeLabel} />
      ))}
    </View>
  );
}

function BottomNavButton({ item, active }: { item: BottomNavItem; active: boolean }) {
  const checkinSummaryQuery = useWeeklyCheckinSummaryQuery(item.kind === 'check-in');
  const tint = active ? colors.midday : colors.predawn;
  const disabled = active || (!item.route && item.kind !== 'check-in');

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        if (item.kind === 'check-in') {
          routeToWeeklyCheckin(checkinSummaryQuery.data);
          return;
        }

        if (item.route) {
          router.replace(item.route);
        }
      }}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <FontAwesome name={item.icon} size={18} color={tint} />
      <LedText
        variant="bodySmall"
        style={[styles.label, { color: tint }, active && styles.labelActive]}
      >
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
