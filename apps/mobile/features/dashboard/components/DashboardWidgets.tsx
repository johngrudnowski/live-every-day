import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';

import {
  getUpcomingAppointment,
  useAppointmentsQuery,
  type Appointment,
} from '@/features/appointments/api/appointment-queries';

type IconName = ComponentProps<typeof FontAwesome>['name'];
const appointmentsRoute = '/appointments' as Href;

type DashboardWidget = {
  label: string;
  value: string;
  meta: string;
  status: string;
  statusTone: 'high' | 'ok';
  icon: IconName;
  onPress?: () => void;
};

export function DashboardWidgets() {
  const appointmentsQuery = useAppointmentsQuery();
  const nextAppointment = getUpcomingAppointment(appointmentsQuery.data ?? []);
  const widgets: DashboardWidget[] = [
    {
      label: 'Platelets',
      value: '842',
      meta: 'x10^3/uL - Mar 15',
      status: 'up +10% / 6mo',
      statusTone: 'high',
      icon: 'flask',
    },
    getNextVisitWidget(nextAppointment, appointmentsQuery.isPending),
  ];

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
    <Pressable
      accessibilityRole={widget.onPress ? 'button' : undefined}
      disabled={!widget.onPress}
      onPress={widget.onPress}
      style={({ pressed }) => [styles.card, widget.onPress && pressed && styles.pressed]}
    >
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
        <LedText
          variant="bodySmall"
          style={[styles.statusText, widget.statusTone === 'high' && styles.statusHighText]}
        >
          {widget.status}
        </LedText>
      </View>
    </Pressable>
  );
}

function getNextVisitWidget(appointment: Appointment | null, isLoading: boolean): DashboardWidget {
  if (isLoading) {
    return {
      label: 'Next visit',
      value: '--',
      meta: 'Loading appointments',
      status: 'View visits',
      statusTone: 'ok',
      icon: 'calendar-o',
      onPress: () => router.push(appointmentsRoute),
    };
  }

  if (!appointment) {
    return {
      label: 'Next visit',
      value: 'None',
      meta: 'Schedule your next appointment',
      status: 'Add visit',
      statusTone: 'ok',
      icon: 'calendar-o',
      onPress: () => router.push(appointmentsRoute),
    };
  }

  return {
    label: 'Next visit',
    value: formatAppointmentDay(appointment.scheduledAt),
    meta: [appointment.careTeamDisplayName, formatAppointmentTime(appointment.scheduledAt)]
      .filter(Boolean)
      .join(' · '),
    status: 'View visits',
    statusTone: 'ok',
    icon: 'calendar-o',
    onPress: () => router.push(appointmentsRoute),
  };
}

function formatAppointmentDay(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function formatAppointmentTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
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
  pressed: {
    opacity: 0.72,
  },
});
