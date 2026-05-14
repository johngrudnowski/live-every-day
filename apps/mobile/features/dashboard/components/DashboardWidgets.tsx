import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';

type IconName = ComponentProps<typeof FontAwesome>['name'];

type DashboardWidget = {
  label: string;
  value: string;
  meta: string;
  status: string;
  statusTone: 'high' | 'ok';
  icon: IconName;
};

const widgets: DashboardWidget[] = [
  {
    label: 'Platelets',
    value: '842',
    meta: 'x10^3/uL - Mar 15',
    status: 'up +10% / 6mo',
    statusTone: 'high',
    icon: 'flask',
  },
  {
    label: 'Next visit',
    value: 'Jun 9',
    meta: 'Dr. Wolanskyj-Spinner',
    status: 'Brief ready',
    statusTone: 'ok',
    icon: 'calendar-o',
  },
];

export function DashboardWidgets() {
  return (
    <View style={styles.grid}>
      {widgets.map((widget) => (
        <DashboardMetricCard key={widget.label} widget={widget} />
      ))}
    </View>
  );
}

function DashboardMetricCard({ widget }: { widget: DashboardWidget }) {
  const statusStyle = widget.statusTone === 'high' ? styles.statusHigh : styles.statusOk;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <LedText variant="label" color="predawn" style={styles.label}>
          {widget.label}
        </LedText>
        <FontAwesome name={widget.icon} size={14} color={colors.predawn} />
      </View>
      <LedText variant="displayLarge" style={styles.value}>
        {widget.value}
      </LedText>
      <LedText variant="bodySmall" color="predawn" style={styles.meta}>
        {widget.meta}
      </LedText>
      <View style={[styles.statusPill, statusStyle]}>
        <LedText variant="bodySmall" style={[styles.statusText, widget.statusTone === 'high' && styles.statusHighText]}>
          {widget.status}
        </LedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    minHeight: 164,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  header: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    flexShrink: 1,
  },
  value: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 30,
    lineHeight: 34,
  },
  meta: {
    minHeight: 36,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusHigh: {
    backgroundColor: colors.flagHighBg,
  },
  statusOk: {
    backgroundColor: colors.flagOkBg,
  },
  statusText: {
    color: colors.flagOk,
    fontFamily: 'DMSans_500Medium',
  },
  statusHighText: {
    color: colors.flagHigh,
  },
});
