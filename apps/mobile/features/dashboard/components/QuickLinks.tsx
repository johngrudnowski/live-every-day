import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';
import { useLatestVitalReadingQuery } from '@/features/vitals/api/vitals-queries';
import { formatVitalsSummary } from '@/features/vitals/lib/formatVitalsReading';

type IconName = ComponentProps<typeof FontAwesome>['name'];

type QuickLink = {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress?: () => void;
};

const secondaryLinks: QuickLink[] = [
  {
    title: 'Our health data',
    subtitle: 'Labs - symptoms - wearables - vitals',
    icon: 'line-chart',
  },
  {
    title: 'Appointment prep',
    subtitle: 'Questions, brief, and visit notes',
    icon: 'clipboard',
  },
];

export function QuickLinks() {
  const latestVitalsQuery = useLatestVitalReadingQuery();
  const latestReading = latestVitalsQuery.data?.latestReading;
  const latestVitalsSubtitle = latestReading
    ? formatVitalsSummary(latestReading)
    : latestVitalsQuery.isPending
      ? 'Checking your latest home reading'
      : 'No vitals logged yet - add a home reading';
  const latestVitalsLink: QuickLink = {
    title: 'Latest vitals',
    subtitle: latestVitalsSubtitle,
    icon: 'heartbeat',
    onPress: () => router.push('/vitals/log'),
  };
  const quickLinks = [latestVitalsLink, ...secondaryLinks];

  return (
    <View style={styles.links}>
      {quickLinks.map((link) => (
        <QuickLinkRow key={link.title} link={link} />
      ))}
    </View>
  );
}

function QuickLinkRow({ link }: { link: QuickLink }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={link.onPress}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <FontAwesome name={link.icon} size={18} color={colors.midday} />
      </View>
      <View style={styles.copy}>
        <LedText variant="subtitle">{link.title}</LedText>
        <LedText variant="bodySmall" color="textMid">
          {link.subtitle}
        </LedText>
      </View>
      <FontAwesome name="chevron-right" size={14} color={colors.predawn} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  links: {
    gap: spacing.sm,
  },
  link: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  icon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.selectedBg,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.72,
  },
});
