import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
  useCirclePermissionDefinitionsQuery,
  useCancelCircleSupportInvitationMutation,
  useCreateCircleSupportPersonInviteMutation,
  useDemoteCircleSupportPersonMutation,
  useMyCircleQuery,
  usePromoteCircleSupportPersonMutation,
  useRemoveCircleSupportPersonMutation,
  useUpdateCircleSupportPermissionsMutation,
  useUpdateCircleSupportPersonMutation,
  type CreateCircleSupportPersonInviteInput,
  type CirclePermissionDefinition,
  type CircleSupportPerson,
} from '../api/account-queries';

const newSupportPersonId = 'new';

type ConfirmAction = 'cancel-invitation' | 'remove' | null;

type SupportInviteForm = {
  displayName: string;
  relationship: string;
  invitationEmail: string;
  invitationPhone: string;
};

export function ManageCircleMemberScreen() {
  const auth = useMobileAuth();
  const { supportPersonId } = useLocalSearchParams<{ supportPersonId?: string }>();
  const isNew = supportPersonId === newSupportPersonId;
  const circleQuery = useMyCircleQuery(Boolean(auth.data?.session));
  const permissionDefinitionsQuery = useCirclePermissionDefinitionsQuery(
    Boolean(auth.data?.session),
  );
  const createMutation = useCreateCircleSupportPersonInviteMutation();
  const updateMutation = useUpdateCircleSupportPersonMutation();
  const updatePermissionsMutation = useUpdateCircleSupportPermissionsMutation();
  const cancelInvitationMutation = useCancelCircleSupportInvitationMutation();
  const promoteMutation = usePromoteCircleSupportPersonMutation();
  const demoteMutation = useDemoteCircleSupportPersonMutation();
  const removeMutation = useRemoveCircleSupportPersonMutation();
  const [displayName, setDisplayName] = useState('');
  const [inviteForm, setInviteForm] = useState<SupportInviteForm>(emptyInviteForm);
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const supportPeople = circleQuery.data?.supportPeople ?? [];
  const person = isNew ? null : (supportPeople.find((item) => item.id === supportPersonId) ?? null);
  const permissionDefinitions = permissionDefinitionsQuery.data ?? [];
  const normalizedInviteForm = useMemo(() => normalizeInviteForm(inviteForm), [inviteForm]);
  const hasMyNumberOne = supportPeople.some((item) => item.role === 'my_number_one');
  const isMyNumberOne = person?.role === 'my_number_one';
  const canPromote = person ? !isMyNumberOne && !hasMyNumberOne : false;
  const hasPendingInvitation = person?.inviteStatus === 'pending' && !person.linkedUserId;
  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    updatePermissionsMutation.isPending ||
    cancelInvitationMutation.isPending ||
    promoteMutation.isPending ||
    demoteMutation.isPending ||
    removeMutation.isPending;
  const confirmConfig = useMemo(
    () => getConfirmConfig(confirmAction, person),
    [confirmAction, person],
  );

  useEffect(() => {
    if (!auth.isPending && !auth.data?.session) {
      router.replace('/auth/login');
    }
  }, [auth.data?.session, auth.isPending]);

  useEffect(() => {
    if (person) {
      setDisplayName(person.displayName);
    }
  }, [person]);

  useEffect(() => {
    if (person) {
      setSelectedPermissionKeys(person.permissions.map((permission) => permission.key));
    }
  }, [person]);

  if (auth.isPending || circleQuery.isPending) {
    return <LoadingScreen message="Loading circle member" />;
  }

  if (!auth.data?.session) {
    return <LoadingScreen message="Checking your session" />;
  }

  if (isNew) {
    const canCreate = normalizedInviteForm.displayName.length > 0 && !isPending;

    return (
      <CircleMemberShell title="Add support person">
        <SectionCard
          title="Support person"
          description="Add someone who can receive a link to leave encouraging messages before your weekly check-in."
        >
          <Field
            label="Name"
            value={inviteForm.displayName}
            placeholder="Dylan Grudnowski"
            autoCapitalize="words"
            onChangeText={(value) =>
              setInviteForm((current) => ({ ...current, displayName: value }))
            }
          />
          <Field
            label="Relationship"
            value={inviteForm.relationship}
            placeholder="Friend, family, caregiver"
            autoCapitalize="words"
            onChangeText={(value) =>
              setInviteForm((current) => ({ ...current, relationship: value }))
            }
          />
        </SectionCard>

        <SectionCard
          title="Invite"
          description="Email or phone is optional. If both are blank, the app creates a link you can share yourself."
        >
          <Field
            label="Email"
            value={inviteForm.invitationEmail}
            placeholder="dylan@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(value) =>
              setInviteForm((current) => ({ ...current, invitationEmail: value }))
            }
          />
          <Field
            label="Phone"
            value={inviteForm.invitationPhone}
            placeholder="+1 555 555 0123"
            keyboardType="phone-pad"
            onChangeText={(value) =>
              setInviteForm((current) => ({ ...current, invitationPhone: value }))
            }
          />
        </SectionCard>

        <SectionCard
          title="Permissions"
          description={`Choose what ${normalizedInviteForm.displayName || 'this person'} can receive or view when you share updates.`}
        >
          {permissionDefinitionsQuery.isPending ? (
            <LedText variant="bodySmall" color="predawn">
              Loading permissions...
            </LedText>
          ) : permissionDefinitionsQuery.error ? (
            <InlineError message={getErrorMessage(permissionDefinitionsQuery.error)} />
          ) : (
            <View style={styles.permissionList}>
              {permissionDefinitions.map((permission) => (
                <PermissionToggle
                  key={permission.key}
                  permission={permission}
                  selected={selectedPermissionKeys.includes(permission.key)}
                  disabled={isPending}
                  onPress={() =>
                    setSelectedPermissionKeys((current) => toggleKey(current, permission.key))
                  }
                />
              ))}
            </View>
          )}
        </SectionCard>

        <PrimaryButton
          label={createMutation.isPending ? 'Adding...' : 'Add support person'}
          fullWidth
          disabled={!canCreate}
          onPress={() =>
            createMutation.mutate(
              toCreateInviteInput(normalizedInviteForm, selectedPermissionKeys),
              {
                onSuccess: () => router.replace('/circle'),
              },
            )
          }
        />
        <InlineError message={getErrorMessage(createMutation.error)} />
      </CircleMemberShell>
    );
  }

  if (!person) {
    return (
      <CircleMemberShell title="Circle member">
        <View style={styles.card}>
          <LedText variant="subtitle">Member not found</LedText>
          <LedText variant="bodySmall" color="predawn">
            This person may have been removed from your circle.
          </LedText>
          <PrimaryButton
            label="Back to My Circle"
            fullWidth
            onPress={() => router.replace('/circle')}
          />
        </View>
      </CircleMemberShell>
    );
  }

  const trimmedName = displayName.trim();
  const canSaveName = trimmedName.length > 0 && trimmedName !== person.displayName && !isPending;
  const permissionsChanged = !haveSameKeys(
    selectedPermissionKeys,
    person.permissions.map((permission) => permission.key),
  );
  const canSavePermissions = permissionsChanged && !isPending;

  return (
    <CircleMemberShell title={person.displayName}>
      <ProfileCard person={person} />

      <SectionCard
        title="Display name"
        description="This is the name you will see throughout your circle."
      >
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          placeholderTextColor={colors.textLite}
          autoCapitalize="words"
          style={styles.input}
        />
        <PrimaryButton
          label={updateMutation.isPending ? 'Saving...' : 'Save name'}
          fullWidth
          disabled={!canSaveName}
          onPress={() =>
            updateMutation.mutate({
              supportPersonId: person.id,
              displayName: trimmedName,
            })
          }
        />
        <InlineError message={getErrorMessage(updateMutation.error)} />
      </SectionCard>

      <SectionCard title="Invitation status" description={getInvitationDescription(person)}>
        <StatusRow label="Status" value={person.stateLabel} />
        {hasPendingInvitation ? (
          <PrimaryButton
            label={cancelInvitationMutation.isPending ? 'Canceling...' : 'Cancel invitation'}
            variant="secondary"
            fullWidth
            disabled={isPending}
            onPress={() => setConfirmAction('cancel-invitation')}
          />
        ) : null}
      </SectionCard>

      <SectionCard
        title="Permissions"
        description={`Choose what ${person.displayName} can receive or view when you share updates.`}
      >
        {permissionDefinitionsQuery.isPending ? (
          <LedText variant="bodySmall" color="predawn">
            Loading permissions...
          </LedText>
        ) : permissionDefinitionsQuery.error ? (
          <InlineError message={getErrorMessage(permissionDefinitionsQuery.error)} />
        ) : (
          <View style={styles.permissionList}>
            {permissionDefinitions.map((permission) => (
              <PermissionToggle
                key={permission.key}
                permission={permission}
                selected={selectedPermissionKeys.includes(permission.key)}
                disabled={isPending}
                onPress={() =>
                  setSelectedPermissionKeys((current) => toggleKey(current, permission.key))
                }
              />
            ))}
          </View>
        )}
        <PrimaryButton
          label={updatePermissionsMutation.isPending ? 'Saving...' : 'Save permissions'}
          fullWidth
          disabled={!canSavePermissions}
          onPress={() =>
            updatePermissionsMutation.mutate({
              supportPersonId: person.id,
              permissionKeys: selectedPermissionKeys,
            })
          }
        />
        <InlineError message={getErrorMessage(updatePermissionsMutation.error)} />
      </SectionCard>

      <SectionCard
        title="Circle role"
        description="My #1 is your closest day-to-day support person. Only one person can hold that role."
      >
        {isMyNumberOne ? (
          <PrimaryButton
            label={demoteMutation.isPending ? 'Demoting...' : 'Demote from My #1'}
            variant="secondary"
            fullWidth
            disabled={isPending}
            onPress={() => demoteMutation.mutate(person.id)}
          />
        ) : (
          <PrimaryButton
            label="Promote to My #1"
            fullWidth
            disabled={!canPromote || isPending}
            onPress={() => promoteMutation.mutate(person.id)}
          />
        )}
        {!canPromote && !isMyNumberOne ? (
          <LedText variant="bodySmall" color="predawn">
            You already have a My #1. Demote them before promoting someone else.
          </LedText>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Remove from circle"
        description="This removes the member, their invitation, permissions, and connection history from your circle."
        danger
      >
        <PrimaryButton
          label={removeMutation.isPending ? 'Removing...' : 'Remove member'}
          variant="danger"
          fullWidth
          disabled={isPending}
          onPress={() => setConfirmAction('remove')}
        />
      </SectionCard>

      <ConfirmationModal
        visible={confirmConfig !== null}
        title={confirmConfig?.title ?? ''}
        description={confirmConfig?.description ?? ''}
        confirmLabel={confirmConfig?.confirmLabel ?? ''}
        cancelLabel="Keep member"
        confirmVariant={confirmAction === 'remove' ? 'danger' : 'secondary'}
        isPending={isPending}
        error={getErrorMessage(
          cancelInvitationMutation.error ??
            removeMutation.error ??
            updateMutation.error ??
            updatePermissionsMutation.error ??
            null,
        )}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === 'cancel-invitation') {
            cancelInvitationMutation.mutate(person.id, {
              onSuccess: () => setConfirmAction(null),
            });
          }

          if (confirmAction === 'remove') {
            removeMutation.mutate(person.id, {
              onSuccess: () => {
                setConfirmAction(null);
                router.replace('/circle');
              },
            });
          }
        }}
      />
    </CircleMemberShell>
  );
}

function CircleMemberShell({ title, children }: { title: string; children: ReactNode }) {
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

function ProfileCard({ person }: { person: CircleSupportPerson }) {
  return (
    <View style={styles.profileCard}>
      <CircleAvatar
        label={person.displayName}
        initials={person.initials}
        size={52}
        tone={person.role === 'my_number_one' ? 'primary' : 'support'}
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
  keyboardType,
  autoCapitalize = 'sentences',
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
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
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
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

function PermissionToggle({
  permission,
  selected,
  disabled,
  onPress,
}: {
  permission: CirclePermissionDefinition;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.permissionToggle,
        selected && styles.permissionToggleSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.permissionCheck, selected && styles.permissionCheckSelected]}>
        {selected ? <FontAwesome name="check" size={12} color={colors.white} /> : null}
      </View>
      <View style={styles.permissionCopy}>
        <LedText variant="subtitle">{permission.label}</LedText>
        {permission.description ? (
          <LedText variant="bodySmall" color="predawn">
            {permission.description}
          </LedText>
        ) : null}
      </View>
    </Pressable>
  );
}

function getInvitationDescription(person: CircleSupportPerson) {
  if (person.linkedUserId) {
    return `${person.displayName} has accepted and is connected to your circle.`;
  }

  if (person.inviteStatus === 'pending') {
    return 'The invite link is active until it is accepted, expires, or you cancel it.';
  }

  if (person.inviteStatus === 'canceled') {
    return 'The invitation has been canceled. They cannot accept the old link.';
  }

  return 'This member is not currently connected to an app account.';
}

function getConfirmConfig(action: ConfirmAction, person: CircleSupportPerson | null) {
  if (!action || !person) {
    return null;
  }

  if (action === 'cancel-invitation') {
    return {
      title: 'Cancel invitation?',
      description: `${person.displayName} will no longer be able to accept the current invite link.`,
      confirmLabel: 'Cancel invitation',
    };
  }

  return {
    title: 'Remove member?',
    description: `Remove ${person.displayName} from your circle? This cannot be undone.`,
    confirmLabel: 'Remove member',
  };
}

function getErrorMessage(error: unknown) {
  if (!error) {
    return null;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to update this circle member. Please try again.';
}

function toggleKey(keys: string[], key: string) {
  if (keys.includes(key)) {
    return keys.filter((item) => item !== key);
  }

  return [...keys, key];
}

function haveSameKeys(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const rightKeys = new Set(right);
  return left.every((key) => rightKeys.has(key));
}

function normalizeInviteForm(form: SupportInviteForm): SupportInviteForm {
  return {
    displayName: form.displayName.trim(),
    relationship: form.relationship.trim(),
    invitationEmail: form.invitationEmail.trim(),
    invitationPhone: form.invitationPhone.trim(),
  };
}

function toCreateInviteInput(
  form: SupportInviteForm,
  permissionKeys: string[],
): CreateCircleSupportPersonInviteInput {
  return {
    displayName: form.displayName,
    relationship: form.relationship || null,
    invitationEmail: form.invitationEmail || null,
    invitationPhone: form.invitationPhone || null,
    permissionKeys,
  };
}

const emptyInviteForm: SupportInviteForm = {
  displayName: '',
  relationship: '',
  invitationEmail: '',
  invitationPhone: '',
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
  permissionList: {
    gap: spacing.sm,
  },
  permissionToggle: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radii.xl,
    backgroundColor: colors.canvas,
    padding: spacing.md,
  },
  permissionToggleSelected: {
    borderColor: colors.flagOk,
    backgroundColor: colors.flagOkBg,
  },
  permissionCheck: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  permissionCheckSelected: {
    borderColor: colors.flagOk,
    backgroundColor: colors.flagOk,
  },
  permissionCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  dangerCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.flagHigh,
    borderRadius: radii.xxl,
    backgroundColor: colors.flagHighBg,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.72,
  },
});
