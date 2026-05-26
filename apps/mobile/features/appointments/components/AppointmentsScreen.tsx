import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, type Href } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppScreen,
  CircleAvatar,
  LedText,
  PrimaryButton,
  colors,
  radii,
  spacing,
} from '@led/design-system';

import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { useMobileAuth } from '@/features/auth/hooks/use-mobile-auth';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import { useMyCircleQuery } from '@/features/account/api/account-queries';
import { useAppointmentsQuery, type Appointment } from '../api/appointment-queries';

export function AppointmentsScreen() {
  const auth = useMobileAuth();
  const appointmentsQuery = useAppointmentsQuery(Boolean(auth.data?.session));
  const circleQuery = useMyCircleQuery(Boolean(auth.data?.session));
  const careTeamPeople = circleQuery.data?.careTeamPeople ?? [];
  const appointments = appointmentsQuery.data ?? [];
  const groupedAppointments = groupAppointments(appointments);
  const isLoading = appointmentsQuery.isPending || circleQuery.isPending;

  useEffect(() => {
    if (!auth.isPending && !auth.data?.session) {
      router.replace('/auth/login');
    }
  }, [auth.data?.session, auth.isPending]);

  if (auth.isPending) {
    return <LoadingScreen message="Loading appointments" />;
  }

  if (!auth.data?.session) {
    return <LoadingScreen message="Checking your session" />;
  }

  return (
    <AppointmentShell title="Appointments" backLabel="Home" onBack={() => router.replace('/home')}>
      <View style={styles.banner}>
        <LedText variant="subtitle" style={styles.bannerTitle}>
          Plan the next conversation.
        </LedText>
        <LedText variant="bodySmall" style={styles.bannerBody}>
          Keep future visits, locations, and notes connected to the care team member you're seeing.
        </LedText>
      </View>

      {isLoading ? (
        <SectionCard>
          <LedText variant="bodySmall" color="predawn">
            Loading your appointments...
          </LedText>
        </SectionCard>
      ) : careTeamPeople.length === 0 ? (
        <CareTeamRequiredCard />
      ) : (
        <>
          <PrimaryButton
            label="Add appointment"
            fullWidth
            onPress={() =>
              router.push({
                pathname: '/appointments/[appointmentId]',
                params: { appointmentId: 'new' },
              } as unknown as Href)
            }
          />

          <AppointmentSection title="Upcoming" emptyMessage="No upcoming appointments yet.">
            {groupedAppointments.upcoming.map((appointment, index) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                isLast={index === groupedAppointments.upcoming.length - 1}
              />
            ))}
          </AppointmentSection>

          <AppointmentSection title="Past" emptyMessage="No past appointments yet.">
            {groupedAppointments.past.map((appointment, index) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                isLast={index === groupedAppointments.past.length - 1}
                muted
              />
            ))}
          </AppointmentSection>
        </>
      )}
    </AppointmentShell>
  );
}

export function AppointmentShell({
  title,
  backLabel,
  onBack,
  children,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={<ScreenHeaderChevronLink label={backLabel} onPress={onBack} />}
          title={
            <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
              {title}
            </LedText>
          }
        />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </AppScreen>
  );
}

export function SectionCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function CareTeamRequiredCard() {
  return (
    <SectionCard>
      <View style={styles.emptyIcon}>
        <FontAwesome name="user-md" size={18} color={colors.midday} />
      </View>
      <View style={styles.cardCopy}>
        <LedText variant="subtitle">Add a care team member first</LedText>
        <LedText variant="bodySmall" color="predawn" style={styles.cardBody}>
          Appointments need to be linked to a doctor or clinician in My Circle.
        </LedText>
      </View>
      <PrimaryButton label="Go to My Circle" fullWidth onPress={() => router.push('/circle')} />
    </SectionCard>
  );
}

function AppointmentSection({
  title,
  emptyMessage,
  children,
}: {
  title: string;
  emptyMessage: string;
  children: ReactNode[];
}) {
  return (
    <View style={styles.section}>
      <LedText variant="label" color="predawn" style={styles.sectionTitle}>
        {title}
      </LedText>
      <View style={styles.listCard}>
        {children.length > 0 ? (
          children
        ) : (
          <View style={styles.emptyRow}>
            <LedText variant="bodySmall" color="predawn">
              {emptyMessage}
            </LedText>
          </View>
        )}
      </View>
    </View>
  );
}

function AppointmentRow({
  appointment,
  isLast,
  muted = false,
}: {
  appointment: Appointment;
  isLast: boolean;
  muted?: boolean;
}) {
  const detail = [formatAppointmentDateTime(appointment.scheduledAt), appointment.location].filter(
    Boolean,
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/appointments/[appointmentId]',
          params: { appointmentId: appointment.id },
        } as unknown as Href)
      }
      style={({ pressed }) => [
        styles.appointmentRow,
        !isLast && styles.rowDivider,
        muted && styles.mutedRow,
        pressed && styles.pressed,
      ]}
    >
      <CircleAvatar
        label={appointment.careTeamDisplayName}
        initials={getInitials(appointment.careTeamDisplayName)}
        size={40}
        tone={muted ? 'muted' : 'care'}
      />
      <View style={styles.rowCopy}>
        <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
          {appointment.careTeamDisplayName}
        </LedText>
        <LedText variant="bodySmall" color="predawn" numberOfLines={2}>
          {detail.join(' · ')}
        </LedText>
      </View>
      <FontAwesome name="chevron-right" size={14} color={colors.predawn} />
    </Pressable>
  );
}

function groupAppointments(appointments: Appointment[], now = new Date()) {
  const sorted = [...appointments].sort(
    (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
  );
  const upcoming = sorted.filter(
    (appointment) => new Date(appointment.scheduledAt).getTime() >= now.getTime(),
  );
  const past = sorted
    .filter((appointment) => new Date(appointment.scheduledAt).getTime() < now.getTime())
    .reverse();

  return { upcoming, past };
}

export function formatAppointmentDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  banner: {
    gap: spacing.xs,
    borderRadius: radii.xxl,
    backgroundColor: colors.midnight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  bannerTitle: {
    color: colors.white,
  },
  bannerBody: {
    color: 'rgba(255,252,245,0.64)',
    lineHeight: 20,
  },
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  cardCopy: {
    gap: spacing.xxs,
  },
  cardBody: {
    lineHeight: 20,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  listCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
  },
  appointmentRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  mutedRow: {
    opacity: 0.72,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  emptyRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
