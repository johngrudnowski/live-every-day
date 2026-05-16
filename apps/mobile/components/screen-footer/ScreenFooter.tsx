import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LedText, colors, spacing } from '@led/design-system';
import { useWeeklyCheckinSummaryQuery } from '@/features/weekly-checkin/api/weekly-checkin-queries';
import { routeToWeeklyCheckin } from '@/features/weekly-checkin/lib/weeklyCheckinRoutes';

type IconName = ComponentProps<typeof FontAwesome>['name'];

type FooterNavItem = {
  label: string;
  icon: IconName;
  route?: '/home' | '/data' | '/account';
  kind?: 'check-in';
};

/** Pass to `ScreenFooter` `activeLabel` to avoid typos and keep labels in sync. */
export const screenFooterNavActiveLabel = {
  hope: 'Hope',
  checkIn: 'Check-in',
  data: 'Data',
  prep: 'Prep',
  account: 'Account',
} as const;

export type ScreenFooterNavActiveLabel =
  (typeof screenFooterNavActiveLabel)[keyof typeof screenFooterNavActiveLabel];

const footerNavItems: FooterNavItem[] = [
  { label: screenFooterNavActiveLabel.hope, icon: 'home', route: '/home' },
  { label: screenFooterNavActiveLabel.checkIn, icon: 'check-circle-o', kind: 'check-in' },
  { label: screenFooterNavActiveLabel.data, icon: 'bar-chart', route: '/data' },
  { label: screenFooterNavActiveLabel.prep, icon: 'star-o' },
  { label: screenFooterNavActiveLabel.account, icon: 'user-o', route: '/account' },
];

export function ScreenFooter({
  activeLabel = screenFooterNavActiveLabel.hope,
}: {
  activeLabel?: ScreenFooterNavActiveLabel;
}) {
  return (
    <View style={styles.bar}>
      {footerNavItems.map((item) => (
        <FooterNavButton key={item.label} item={item} active={item.label === activeLabel} />
      ))}
    </View>
  );
}

function FooterNavButton({ item, active }: { item: FooterNavItem; active: boolean }) {
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
