import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  CircleAvatar,
  ConfirmationModal,
  LedText,
  PrimaryButton,
  colors,
  radii,
  spacing,
} from '@led/design-system';

import { useMobileAuth } from '@/features/auth/hooks/use-mobile-auth';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useMyCircleQuery,
  type CircleCareTeamPerson,
} from '@/features/account/api/account-queries';
import {
  useAppointmentsQuery,
  useCreateAppointmentMutation,
  useRemoveAppointmentMutation,
  useUpdateAppointmentMutation,
  type Appointment,
  type SaveAppointmentInput,
} from '../api/appointment-queries';

import {
  AppointmentShell,
  CareTeamRequiredCard,
  SectionCard,
  formatAppointmentDateTime,
} from './AppointmentsScreen';

const newAppointmentId = 'new';
const appointmentsRoute = '/appointments' as Href;

type AppointmentForm = {
  careTeamPersonId: string;
  scheduledAt: Date;
  location: string;
  notes: string;
};

type PickerMode = 'date' | 'time';

export function ManageAppointmentScreen() {
  const auth = useMobileAuth();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const isNew = appointmentId === newAppointmentId;
  const appointmentsQuery = useAppointmentsQuery(Boolean(auth.data?.session));
  const circleQuery = useMyCircleQuery(Boolean(auth.data?.session));
  const createMutation = useCreateAppointmentMutation();
  const updateMutation = useUpdateAppointmentMutation();
  const removeMutation = useRemoveAppointmentMutation();
  const [form, setForm] = useState<AppointmentForm>(emptyForm);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const careTeamPeople = circleQuery.data?.careTeamPeople ?? [];
  const firstCareTeamPersonId = careTeamPeople[0]?.id ?? null;
  const appointment = isNew
    ? null
    : (appointmentsQuery.data?.find((item) => item.id === appointmentId) ?? null);
  const initialForm = useMemo(
    () => (appointment ? formFromAppointment(appointment) : emptyForm),
    [appointment],
  );
  const normalizedForm = useMemo(() => normalizeForm(form), [form]);
  const isPending =
    createMutation.isPending || updateMutation.isPending || removeMutation.isPending;
  const hasChanges = isNew || !haveSameForm(normalizedForm, normalizeForm(initialForm));
  const canSave = normalizedForm.careTeamPersonId.length > 0 && hasChanges && !isPending;
  const isLoading = auth.isPending || appointmentsQuery.isPending || circleQuery.isPending;

  useEffect(() => {
    if (!auth.isPending && !auth.data?.session) {
      router.replace('/auth/login');
    }
  }, [auth.data?.session, auth.isPending]);

  useEffect(() => {
    if (appointment) {
      setForm(formFromAppointment(appointment));
      return;
    }

    if (isNew && firstCareTeamPersonId && form.careTeamPersonId.length === 0) {
      setForm((current) => ({ ...current, careTeamPersonId: firstCareTeamPersonId }));
    }
  }, [appointment, firstCareTeamPersonId, form.careTeamPersonId, isNew]);

  if (isLoading) {
    return <LoadingScreen message="Loading appointment" />;
  }

  if (!auth.data?.session) {
    return <LoadingScreen message="Checking your session" />;
  }

  if (careTeamPeople.length === 0) {
    return (
      <AppointmentShell
        title="Appointments"
        backLabel="Appointments"
        onBack={() => router.replace(appointmentsRoute)}
      >
        <CareTeamRequiredCard />
      </AppointmentShell>
    );
  }

  if (!isNew && !appointment) {
    return (
      <AppointmentShell
        title="Appointment"
        backLabel="Appointments"
        onBack={() => router.replace(appointmentsRoute)}
      >
        <SectionCard>
          <LedText variant="subtitle">Appointment not found</LedText>
          <LedText variant="bodySmall" color="predawn">
            This appointment may have been removed.
          </LedText>
          <PrimaryButton
            label="Back to appointments"
            fullWidth
            onPress={() => router.replace(appointmentsRoute)}
          />
        </SectionCard>
      </AppointmentShell>
    );
  }

  const title = isNew ? 'Add appointment' : 'Edit appointment';

  return (
    <AppointmentShell
      title={title}
      backLabel="Appointments"
      onBack={() => router.replace(appointmentsRoute)}
    >
      {appointment ? <SummaryCard appointment={appointment} /> : null}

      <SectionCard>
        <View style={styles.cardHeader}>
          <LedText variant="subtitle">Care team member</LedText>
          <LedText variant="bodySmall" color="predawn">
            Choose the doctor or clinician this visit is with.
          </LedText>
        </View>
        <View style={styles.choiceList}>
          {careTeamPeople.map((person, index) => (
            <CareTeamChoice
              key={person.id}
              person={person}
              selected={form.careTeamPersonId === person.id}
              isLast={index === careTeamPeople.length - 1}
              onPress={() => setForm((current) => ({ ...current, careTeamPersonId: person.id }))}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <View style={styles.cardHeader}>
          <LedText variant="subtitle">When</LedText>
          <LedText variant="bodySmall" color="predawn">
            Set the visit date and time.
          </LedText>
        </View>
        <PickerRow
          label="Date"
          value={formatAppointmentDate(form.scheduledAt)}
          icon="calendar-o"
          onPress={() => setPickerMode('date')}
        />
        <PickerRow
          label="Time"
          value={formatAppointmentTime(form.scheduledAt)}
          icon="clock-o"
          onPress={() => setPickerMode('time')}
        />
        {pickerMode ? (
          <DateTimePicker
            value={form.scheduledAt}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, value) => {
              handlePickerChange(event, value, pickerMode, form.scheduledAt, (scheduledAt) =>
                setForm((current) => ({ ...current, scheduledAt })),
              );
              setPickerMode(null);
            }}
          />
        ) : null}
      </SectionCard>

      <SectionCard>
        <View style={styles.cardHeader}>
          <LedText variant="subtitle">Details</LedText>
          <LedText variant="bodySmall" color="predawn">
            Location and notes are optional.
          </LedText>
        </View>
        <Field
          label="Location"
          value={form.location}
          placeholder="Mayo Clinic"
          onChangeText={(location) => setForm((current) => ({ ...current, location }))}
        />
        <Field
          label="Notes"
          value={form.notes}
          placeholder="Questions, topics, or preparation notes"
          multiline
          onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
        />
      </SectionCard>

      <PrimaryButton
        label={getSaveLabel(isNew, createMutation.isPending || updateMutation.isPending)}
        fullWidth
        disabled={!canSave}
        onPress={() => {
          const input = toSaveInput(normalizedForm);

          if (isNew) {
            createMutation.mutate(input, {
              onSuccess: () => router.replace(appointmentsRoute),
            });
            return;
          }

          if (appointment) {
            updateMutation.mutate(
              {
                appointmentId: appointment.id,
                ...input,
              },
              {
                onSuccess: () => router.replace(appointmentsRoute),
              },
            );
          }
        }}
      />
      <InlineError message={getErrorMessage(createMutation.error ?? updateMutation.error)} />

      {appointment ? (
        <SectionCard>
          <View style={styles.cardHeader}>
            <LedText variant="subtitle">Delete appointment</LedText>
            <LedText variant="bodySmall" color="predawn">
              Remove this appointment from your list.
            </LedText>
          </View>
          <PrimaryButton
            label={removeMutation.isPending ? 'Deleting...' : 'Delete appointment'}
            variant="danger"
            fullWidth
            disabled={isPending}
            onPress={() => setIsDeleteModalVisible(true)}
          />
        </SectionCard>
      ) : null}

      <ConfirmationModal
        visible={isDeleteModalVisible}
        title="Delete appointment?"
        description="This removes the appointment from your list. This cannot be undone."
        confirmLabel="Delete appointment"
        cancelLabel="Keep appointment"
        confirmVariant="danger"
        isPending={removeMutation.isPending}
        error={getErrorMessage(removeMutation.error)}
        onCancel={() => setIsDeleteModalVisible(false)}
        onConfirm={() => {
          if (appointment) {
            removeMutation.mutate(appointment.id, {
              onSuccess: () => {
                setIsDeleteModalVisible(false);
                router.replace(appointmentsRoute);
              },
            });
          }
        }}
      />
    </AppointmentShell>
  );
}

function SummaryCard({ appointment }: { appointment: Appointment }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <FontAwesome name="calendar-check-o" size={18} color={colors.midday} />
      </View>
      <View style={styles.summaryCopy}>
        <LedText variant="title">{formatAppointmentDateTime(appointment.scheduledAt)}</LedText>
        <LedText variant="bodySmall" color="predawn">
          {appointment.careTeamDisplayName}
        </LedText>
      </View>
    </View>
  );
}

function CareTeamChoice({
  person,
  selected,
  isLast,
  onPress,
}: {
  person: CircleCareTeamPerson;
  selected: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceRow,
        !isLast && styles.choiceDivider,
        pressed && styles.pressed,
      ]}
    >
      <CircleAvatar
        label={person.displayName}
        initials={person.initials}
        size={36}
        tone={selected ? 'care' : 'muted'}
      />
      <View style={styles.choiceCopy}>
        <LedText variant="subtitle">{person.displayName}</LedText>
        <LedText variant="bodySmall" color="predawn" numberOfLines={1}>
          {[person.specialty, person.organization].filter(Boolean).join(' · ') || person.detailLine}
        </LedText>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function PickerRow({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon: ComponentProps<typeof FontAwesome>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pickerRow, pressed && styles.pressed]}
    >
      <View style={styles.pickerIcon}>
        <FontAwesome name={icon} size={15} color={colors.midday} />
      </View>
      <View style={styles.pickerCopy}>
        <LedText variant="bodySmall" color="predawn">
          {label}
        </LedText>
        <LedText variant="subtitle">{value}</LedText>
      </View>
      <FontAwesome name="chevron-right" size={14} color={colors.predawn} />
    </Pressable>
  );
}

function Field({
  label,
  value,
  placeholder,
  multiline = false,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <LedText variant="label" color="predawn">
        {label}
      </LedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLite}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function InlineError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.inlineError}>
      <LedText variant="bodySmall" color="flagHigh">
        {message}
      </LedText>
    </View>
  );
}

function handlePickerChange(
  event: DateTimePickerEvent,
  selectedValue: Date | undefined,
  mode: PickerMode,
  currentValue: Date,
  onChange: (value: Date) => void,
) {
  if (event.type === 'dismissed') {
    return;
  }

  if (!selectedValue) {
    return;
  }

  if (mode === 'date') {
    const next = new Date(currentValue);
    next.setFullYear(
      selectedValue.getFullYear(),
      selectedValue.getMonth(),
      selectedValue.getDate(),
    );
    onChange(next);
    return;
  }

  const next = new Date(currentValue);
  next.setHours(selectedValue.getHours(), selectedValue.getMinutes(), 0, 0);
  onChange(next);
}

function formFromAppointment(appointment: Appointment): AppointmentForm {
  return {
    careTeamPersonId: appointment.careTeamPersonId,
    scheduledAt: new Date(appointment.scheduledAt),
    location: appointment.location ?? '',
    notes: appointment.notes ?? '',
  };
}

function normalizeForm(form: AppointmentForm): AppointmentForm {
  return {
    careTeamPersonId: form.careTeamPersonId,
    scheduledAt: form.scheduledAt,
    location: form.location.trim(),
    notes: form.notes.trim(),
  };
}

function toSaveInput(form: AppointmentForm): SaveAppointmentInput {
  return {
    careTeamPersonId: form.careTeamPersonId,
    scheduledAt: form.scheduledAt.toISOString(),
    location: form.location || null,
    notes: form.notes || null,
  };
}

function haveSameForm(left: AppointmentForm, right: AppointmentForm) {
  return (
    left.careTeamPersonId === right.careTeamPersonId &&
    left.scheduledAt.getTime() === right.scheduledAt.getTime() &&
    left.location === right.location &&
    left.notes === right.notes
  );
}

function formatAppointmentDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function formatAppointmentTime(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

function getSaveLabel(isNew: boolean, isSaving: boolean) {
  if (isSaving) {
    return isNew ? 'Adding...' : 'Saving...';
  }

  return isNew ? 'Add appointment' : 'Save appointment';
}

function getErrorMessage(error: unknown) {
  if (!error) {
    return null;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to update this appointment. Please try again.';
}

function getDefaultAppointmentDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(9, 0, 0, 0);
  return date;
}

const emptyForm: AppointmentForm = {
  careTeamPersonId: '',
  scheduledAt: getDefaultAppointmentDate(),
  location: '',
  notes: '',
};

const styles = StyleSheet.create({
  cardHeader: {
    gap: spacing.xxs,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.surface,
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  choiceList: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radii.xl,
    backgroundColor: colors.canvas,
  },
  choiceRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  choiceCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.card,
  },
  radioSelected: {
    borderColor: colors.midday,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.midday,
  },
  pickerRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radii.xl,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  pickerCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 92,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  inlineError: {
    borderWidth: 1,
    borderColor: colors.flagHigh,
    borderRadius: radii.lg,
    backgroundColor: colors.flagHighBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.72,
  },
});
