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
import {
  useLatestObservationsQuery,
  type HealthObservationList,
} from '@/features/data/api/health-data-queries';
import { cbcLabMetrics } from '@/features/labs/lib/labMetrics';

type IconName = ComponentProps<typeof FontAwesome>['name'];
type HealthObservation = HealthObservationList['observations'][number];
const appointmentsRoute = '/appointments' as Href;
const plateletMetric = cbcLabMetrics.find(
  (metric) => metric.key === 'lab_platelets',
)!;

type DashboardWidget = {
  label: string;
  value: string;
  meta: string;
  status: string;
  statusTone: 'high' | 'ok' | 'empty';
  icon: IconName;
  onPress?: () => void;
};

export function DashboardWidgets() {
  const appointmentsQuery = useAppointmentsQuery();
  const plateletsQuery = useLatestObservationsQuery({
    metricKeys: plateletMetric.key,
  });
  const nextAppointment = getUpcomingAppointment(appointmentsQuery.data ?? []);
  const plateletObservation = plateletsQuery.data?.observations.find(
    (observation) => observation.metricKey === plateletMetric.key,
  );
  const widgets: DashboardWidget[] = [
    getLabWidget(plateletObservation, plateletsQuery.isPending),
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
  const statusStyle = getStatusStyle(widget.statusTone);
  const statusTextStyle = getStatusTextStyle(widget.statusTone);

  return (
    <Pressable
      accessibilityRole={widget.onPress ? 'button' : undefined}
      disabled={!widget.onPress}
      onPress={widget.onPress}
      style={({ pressed }) => [
        styles.card,
        widget.onPress && pressed && styles.pressed,
      ]}
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
          style={[styles.statusText, statusTextStyle]}
        >
          {widget.status}
        </LedText>
      </View>
    </Pressable>
  );
}

function getLabWidget(
  observation: HealthObservation | undefined,
  isLoading: boolean,
): DashboardWidget {
  if (isLoading) {
    return {
      label: 'Labs',
      value: '--',
      meta: 'Checking latest platelet value',
      status: 'Loading',
      statusTone: 'empty',
      icon: 'flask',
    };
  }

  if (
    !observation ||
    observation.valueNumeric === null ||
    observation.valueNumeric === undefined
  ) {
    return {
      label: 'Labs',
      value: 'None',
      meta: 'No platelet data yet',
      status: 'Add labs',
      statusTone: 'empty',
      icon: 'flask',
      onPress: () => router.push('/labs/import'),
    };
  }

  return {
    label: 'Platelets',
    value: formatLabValue(observation.valueNumeric),
    meta: `${observation.unit ?? plateletMetric.unit} - ${formatObservationDate(observation.observedAt)}`,
    status: 'View trend',
    statusTone: 'ok',
    icon: 'flask',
    onPress: () =>
      router.push({
        pathname: '/data/history/[metricKey]',
        params: { metricKey: plateletMetric.key },
      }),
  };
}

function getStatusStyle(tone: DashboardWidget['statusTone']) {
  if (tone === 'high') {
    return styles.statusHigh;
  }

  if (tone === 'empty') {
    return styles.statusEmpty;
  }

  return styles.statusOk;
}

function getStatusTextStyle(tone: DashboardWidget['statusTone']) {
  if (tone === 'high') {
    return styles.statusHighText;
  }

  if (tone === 'empty') {
    return styles.statusEmptyText;
  }

  return undefined;
}

function getNextVisitWidget(
  appointment: Appointment | null,
  isLoading: boolean,
): DashboardWidget {
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
    meta: [
      appointment.careTeamDisplayName,
      formatAppointmentTime(appointment.scheduledAt),
    ]
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

function formatLabValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatObservationDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
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
  statusEmpty: {
    backgroundColor: colors.surface,
  },
  statusText: {
    color: colors.flagOk,
    fontFamily: 'DMSans_500Medium',
  },
  statusHighText: {
    color: colors.flagHigh,
  },
  statusEmptyText: {
    color: colors.predawn,
  },
  pressed: {
    opacity: 0.72,
  },
});
