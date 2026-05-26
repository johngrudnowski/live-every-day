import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  AppScreen,
  CircleAvatar,
  ConfirmationModal,
  LedText,
  PrimaryButton,
  colors,
  radii,
  spacing,
} from '@led/design-system';

import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { useMobileAuth } from '@/features/auth/hooks/use-mobile-auth';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useCreateCircleCareTeamPersonMutation,
  useMyCircleQuery,
  useRemoveCircleCareTeamPersonMutation,
  useUpdateCircleCareTeamPersonMutation,
  type CircleCareTeamPerson,
  type SaveCircleCareTeamPersonInput,
} from '../api/account-queries';

const newCareTeamPersonId = 'new';

type CareTeamForm = {
  displayName: string;
  specialty: string;
  organization: string;
  address: string;
  phoneNumber: string;
};

export function ManageCareTeamMemberScreen() {
  const auth = useMobileAuth();
  const { careTeamPersonId } = useLocalSearchParams<{ careTeamPersonId?: string }>();
  const isNew = careTeamPersonId === newCareTeamPersonId;
  const circleQuery = useMyCircleQuery(Boolean(auth.data?.session));
  const createMutation = useCreateCircleCareTeamPersonMutation();
  const updateMutation = useUpdateCircleCareTeamPersonMutation();
  const removeMutation = useRemoveCircleCareTeamPersonMutation();
  const [form, setForm] = useState<CareTeamForm>(emptyForm);
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);
  const careTeamPeople = circleQuery.data?.careTeamPeople ?? [];
  const person = isNew
    ? null
    : (careTeamPeople.find((item) => item.id === careTeamPersonId) ?? null);
  const isPending =
    createMutation.isPending || updateMutation.isPending || removeMutation.isPending;
  const normalizedForm = useMemo(() => normalizeForm(form), [form]);
  const initialForm = useMemo(() => (person ? formFromPerson(person) : emptyForm), [person]);
  const hasChanges = isNew || !haveSameForm(normalizedForm, normalizeForm(initialForm));
  const canSave = normalizedForm.displayName.length > 0 && hasChanges && !isPending;

  useEffect(() => {
    if (!auth.isPending && !auth.data?.session) {
      router.replace('/auth/login');
    }
  }, [auth.data?.session, auth.isPending]);

  useEffect(() => {
    if (person) {
      setForm(formFromPerson(person));
    }
  }, [person]);

  if (auth.isPending || circleQuery.isPending) {
    return <LoadingScreen message="Loading care team member" />;
  }

  if (!auth.data?.session) {
    return <LoadingScreen message="Checking your session" />;
  }

  if (!isNew && !person) {
    return (
      <CareTeamShell title="Care team">
        <SectionCard
          title="Care team member not found"
          description="This care team member may have been removed from your circle."
        >
          <PrimaryButton
            label="Back to My Circle"
            fullWidth
            onPress={() => router.replace('/circle')}
          />
        </SectionCard>
      </CareTeamShell>
    );
  }

  const title = isNew ? 'Add care team member' : (person?.displayName ?? 'Care team');

  return (
    <CareTeamShell title={title}>
      {person ? <ProfileCard person={person} /> : null}

      <SectionCard
        title="Care team member"
        description="Add the local details you want to keep for this doctor or clinician."
      >
        <Field
          label="Name"
          value={form.displayName}
          placeholder="Dr. Taylor Morgan"
          autoCapitalize="words"
          onChangeText={(displayName) => setForm((current) => ({ ...current, displayName }))}
        />
        <Field
          label="Specialty"
          value={form.specialty}
          placeholder="Hematology"
          autoCapitalize="words"
          onChangeText={(specialty) => setForm((current) => ({ ...current, specialty }))}
        />
        <Field
          label="Practice or organization"
          value={form.organization}
          placeholder="Mayo Clinic"
          autoCapitalize="words"
          onChangeText={(organization) => setForm((current) => ({ ...current, organization }))}
        />
      </SectionCard>

      <SectionCard
        title="Contact"
        description="These details stay local for now and can support appointment planning later."
      >
        <Field
          label="Address"
          value={form.address}
          placeholder="200 1st St SW, Rochester, MN 55905"
          multiline
          onChangeText={(address) => setForm((current) => ({ ...current, address }))}
        />
        <Field
          label="Phone"
          value={form.phoneNumber}
          placeholder="(507) 284-2511"
          keyboardType="phone-pad"
          onChangeText={(phoneNumber) => setForm((current) => ({ ...current, phoneNumber }))}
        />
      </SectionCard>

      <SectionCard
        title="Connection"
        description="This is a local care team member. Provider account connections can be added later."
      >
        <StatusRow label="Status" value={person?.stateLabel ?? 'Local'} />
      </SectionCard>

      <PrimaryButton
        label={getSaveLabel(isNew, createMutation.isPending || updateMutation.isPending)}
        fullWidth
        disabled={!canSave}
        onPress={() => {
          if (isNew) {
            createMutation.mutate(toSaveInput(normalizedForm), {
              onSuccess: () => router.replace('/circle'),
            });
            return;
          }

          if (person) {
            updateMutation.mutate({
              careTeamPersonId: person.id,
              ...toSaveInput(normalizedForm),
            });
          }
        }}
      />
      <InlineError message={getErrorMessage(createMutation.error ?? updateMutation.error)} />

      {person ? (
        <SectionCard
          title="Remove from care team"
          description="This removes the local care team member from your circle."
          danger
        >
          <PrimaryButton
            label={removeMutation.isPending ? 'Removing...' : 'Remove care team member'}
            variant="danger"
            fullWidth
            disabled={isPending}
            onPress={() => setIsRemoveModalVisible(true)}
          />
        </SectionCard>
      ) : null}

      <ConfirmationModal
        visible={isRemoveModalVisible}
        title="Remove care team member?"
        description={
          person ? `Remove ${person.displayName} from your care team? This cannot be undone.` : ''
        }
        confirmLabel="Remove member"
        cancelLabel="Keep member"
        confirmVariant="danger"
        isPending={removeMutation.isPending}
        error={getErrorMessage(removeMutation.error)}
        onCancel={() => setIsRemoveModalVisible(false)}
        onConfirm={() => {
          if (person) {
            removeMutation.mutate(person.id, {
              onSuccess: () => {
                setIsRemoveModalVisible(false);
                router.replace('/circle');
              },
            });
          }
        }}
      />
    </CareTeamShell>
  );
}

function CareTeamShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={
            <ScreenHeaderChevronLink label="Circle" onPress={() => router.replace('/circle')} />
          }
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

function ProfileCard({ person }: { person: CircleCareTeamPerson }) {
  return (
    <View style={styles.profileCard}>
      <CircleAvatar
        label={person.displayName}
        initials={person.initials}
        size={52}
        tone={person.stateTone === 'muted' ? 'muted' : 'care'}
      />
      <View style={styles.profileCopy}>
        <LedText variant="title" style={styles.profileTitle}>
          {person.displayName}
        </LedText>
        <LedText variant="bodySmall" style={styles.profileDetail}>
          {person.detailLine}
        </LedText>
      </View>
    </View>
  );
}

function SectionCard({
  title,
  description,
  danger = false,
  children,
}: {
  title: string;
  description: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={danger ? styles.dangerCard : styles.card}>
      <View style={styles.cardHeader}>
        <LedText variant="subtitle">{title}</LedText>
        <LedText variant="bodySmall" color="predawn">
          {description}
        </LedText>
      </View>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  placeholder,
  multiline = false,
  keyboardType,
  autoCapitalize = 'sentences',
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
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
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusRow}>
      <LedText variant="bodySmall" color="predawn">
        {label}
      </LedText>
      <LedText variant="subtitle">{value}</LedText>
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

function formFromPerson(person: CircleCareTeamPerson): CareTeamForm {
  return {
    displayName: person.displayName,
    specialty: person.specialty ?? '',
    organization: person.organization ?? '',
    address: person.address ?? '',
    phoneNumber: person.phoneNumber ?? '',
  };
}

function normalizeForm(form: CareTeamForm): CareTeamForm {
  return {
    displayName: form.displayName.trim(),
    specialty: form.specialty.trim(),
    organization: form.organization.trim(),
    address: form.address.trim(),
    phoneNumber: form.phoneNumber.trim(),
  };
}

function toSaveInput(form: CareTeamForm): SaveCircleCareTeamPersonInput {
  return {
    displayName: form.displayName,
    specialty: form.specialty || null,
    organization: form.organization || null,
    address: form.address || null,
    phoneNumber: form.phoneNumber || null,
  };
}

function haveSameForm(left: CareTeamForm, right: CareTeamForm) {
  return (
    left.displayName === right.displayName &&
    left.specialty === right.specialty &&
    left.organization === right.organization &&
    left.address === right.address &&
    left.phoneNumber === right.phoneNumber
  );
}

function getSaveLabel(isNew: boolean, isSaving: boolean) {
  if (isSaving) {
    return isNew ? 'Adding...' : 'Saving...';
  }

  return isNew ? 'Add care team member' : 'Save care team member';
}

function getErrorMessage(error: unknown) {
  if (!error) {
    return null;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to update this care team member. Please try again.';
}

const emptyForm: CareTeamForm = {
  displayName: '',
  specialty: '',
  organization: '',
  address: '',
  phoneNumber: '',
};

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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radii.xxl,
    backgroundColor: colors.midnight,
    padding: spacing.lg,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  profileTitle: {
    color: colors.white,
  },
  profileDetail: {
    color: 'rgba(255,252,245,0.64)',
  },
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  dangerCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.flagHigh,
    borderRadius: radii.xxl,
    backgroundColor: colors.flagHighBg,
    padding: spacing.lg,
  },
  cardHeader: {
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
    minHeight: 82,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  statusRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radii.xl,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inlineError: {
    borderWidth: 1,
    borderColor: colors.flagHigh,
    borderRadius: radii.lg,
    backgroundColor: colors.flagHighBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
