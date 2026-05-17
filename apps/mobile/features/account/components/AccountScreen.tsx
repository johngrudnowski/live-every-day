import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import {
  getConditionDefinition,
  type ConditionDefinition,
  type SemanticValue,
} from '@led/conditions';

import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { useConditionSummaryQuery } from '@/features/conditions/api/condition-queries';
import { ScreenFooter, screenFooterNavActiveLabel } from '@/components/screen-footer';
import { useMobileAuth } from '@/features/auth/hooks/use-mobile-auth';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useDeleteAccountMutation,
  useMyCircleQuery,
  type CircleCareTeamPerson,
  type CircleSupportPerson,
} from '../api/account-queries';

import { CareTeamPersonRow } from './CareTeamPersonRow';
import { SupportPersonRow } from './SupportPersonRow';

type IconName = ComponentProps<typeof FontAwesome>['name'];

export function AccountScreen() {
  const auth = useMobileAuth();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const summaryQuery = useConditionSummaryQuery(Boolean(auth.data?.session));
  const circleQuery = useMyCircleQuery(Boolean(auth.data?.session));
  const deleteAccountMutation = useDeleteAccountMutation();
  const activeProfile = summaryQuery.data?.activeConditionProfile ?? null;
  const draftProfile = summaryQuery.data?.draftConditionProfile ?? null;
  const profile = activeProfile ?? draftProfile;
  const profileValues = parseProfileValues(profile?.profile);
  const conditionId = profile?.conditionId ?? 'mpn';
  const conditionDefinition = getConditionDefinition(conditionId) ?? null;

  useEffect(() => {
    if (!auth.isPending && !auth.data?.session) {
      router.replace('/auth/login');
    }
  }, [auth.data?.session, auth.isPending]);

  if (auth.isPending || summaryQuery.isPending) {
    return <LoadingScreen message="Loading account" />;
  }

  if (!auth.data?.session) {
    return <LoadingScreen message="Checking your session" />;
  }

  const displayName = getDisplayName(auth.data.user?.name, auth.data.user?.email);

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={<ScreenHeaderChevronLink label="Home" onPress={() => router.replace('/home')} />}
          title={
            <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
              Account
            </LedText>
          }
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          name={displayName}
          summary={buildProfileSummary(conditionDefinition ?? undefined, profileValues)}
        />

        <MyCircleSection
          supportPeople={circleQuery.data?.supportPeople ?? []}
          careTeamPeople={circleQuery.data?.careTeamPeople ?? []}
          isLoading={circleQuery.isPending}
        />

        {conditionDefinition ? (
          <HealthProfileSection
            conditionDefinition={conditionDefinition}
            profileValues={profileValues}
            conditionId={conditionId}
          />
        ) : (
          <EmptyHealthProfile />
        )}

        <DangerZone onDeletePress={() => setIsDeleteModalVisible(true)} />
      </ScrollView>

      <ScreenFooter activeLabel={screenFooterNavActiveLabel.account} />

      <ConfirmationModal
        visible={isDeleteModalVisible}
        title="Delete account and data?"
        description="This permanently deletes your account, health profile, weekly check-ins, and saved app data. This cannot be undone."
        confirmLabel="Delete account"
        cancelLabel="Keep account"
        confirmVariant="danger"
        isPending={deleteAccountMutation.isPending}
        error={getErrorMessage(deleteAccountMutation.error)}
        onCancel={() => {
          if (deleteAccountMutation.isPending) {
            return;
          }

          deleteAccountMutation.reset();
          setIsDeleteModalVisible(false);
        }}
        onConfirm={() => deleteAccountMutation.mutate()}
      />
    </AppScreen>
  );
}

function ProfileHeader({ name, summary }: { name: string; summary: string }) {
  return (
    <View style={styles.profileCard}>
      <CircleAvatar label={name} size={52} />
      <View style={styles.profileCopy}>
        <LedText variant="title">{name}</LedText>
        <LedText variant="bodySmall" color="predawn">
          {summary}
        </LedText>
      </View>
    </View>
  );
}

function MyCircleSection({
  supportPeople,
  careTeamPeople,
  isLoading,
}: {
  supportPeople: CircleSupportPerson[];
  careTeamPeople: CircleCareTeamPerson[];
  isLoading: boolean;
}) {
  return (
    <View style={styles.section}>
      <LedText variant="label" color="predawn">
        My Circle
      </LedText>
      <View style={styles.linkGroup}>
        {isLoading ? (
          <View style={styles.circleEmptyRow}>
            <LedText variant="bodySmall" color="predawn">
              Loading your circle...
            </LedText>
          </View>
        ) : null}

        {!isLoading && supportPeople.length === 0 && careTeamPeople.length === 0 ? (
          <View style={styles.circleEmptyRow}>
            <LedText variant="subtitle">Start building your circle</LedText>
            <LedText variant="bodySmall" color="predawn">
              Add your #1, support people, and care team here.
            </LedText>
          </View>
        ) : null}

        {!isLoading
          ? supportPeople.map((person, index) => (
              <SupportPersonRow
                key={person.id}
                person={person}
                isLast={careTeamPeople.length === 0 && index === supportPeople.length - 1}
                nameAddon={
                  person.role === 'my_number_one' ? (
                    <LedText variant="bodySmall" color="predawn">
                      {' '}
                      (My #1)
                    </LedText>
                  ) : undefined
                }
              />
            ))
          : null}

        {!isLoading && careTeamPeople.length > 0 ? (
          <View style={styles.circleCareDivider}>
            <View style={styles.circleDividerLine} />
            <LedText variant="label" color="predawn">
              Care team
            </LedText>
            <View style={styles.circleDividerLine} />
          </View>
        ) : null}

        {!isLoading
          ? careTeamPeople.map((person, index) => (
              <CareTeamPersonRow
                key={person.id}
                person={person}
                isLast={index === careTeamPeople.length - 1}
              />
            ))
          : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/circle')}
          style={({ pressed }) => [styles.circleManageRow, pressed && styles.pressed]}
        >
          <CircleAvatar label="Add" initials="+" size={36} tone="muted" />
          <LedText variant="subtitle" color="midday" style={styles.linkCopy}>
            Manage My Circle
          </LedText>
          <LedText variant="title" color="predawn">
            ›
          </LedText>
        </Pressable>
      </View>
    </View>
  );
}

function HealthProfileSection({
  conditionDefinition,
  profileValues,
  conditionId,
}: {
  conditionDefinition: ConditionDefinition;
  profileValues: Record<string, SemanticValue>;
  conditionId: string;
}) {
  const links = getAccountSteps(conditionDefinition);

  return (
    <View style={styles.section}>
      <LedText variant="label" color="predawn">
        Health profile
      </LedText>
      <View style={styles.linkGroup}>
        {links.map((step, index) => (
          <HealthProfileLink
            key={step.id}
            label={getAccountLinkLabel(step)}
            summary={summarizeStep(getAccountLinkSummaryKeys(step), profileValues)}
            icon={getAccountLinkIcon(step)}
            isLast={index === links.length - 1}
            onPress={() =>
              router.push({
                pathname: '/conditions/[conditionId]',
                params: {
                  conditionId,
                  stepId: step.id,
                  mode: 'account',
                },
              })
            }
          />
        ))}
      </View>
    </View>
  );
}

function getAccountSteps(conditionDefinition: ConditionDefinition) {
  const configuredLinks = conditionDefinition.flow.filter((step) => step.accountLink);

  if (configuredLinks.length > 0) {
    return configuredLinks;
  }

  return conditionDefinition.flow.filter(
    (step) => step.kind !== 'info_interstitial' && (step.semanticKey || step.fields?.length),
  );
}

function getAccountLinkLabel(step: ConditionDefinition['flow'][number]) {
  return step.accountLink?.label ?? step.title.replace(/[.?]$/, '');
}

function getAccountLinkSummaryKeys(step: ConditionDefinition['flow'][number]) {
  if (step.accountLink?.summarySemanticKeys?.length) {
    return step.accountLink.summarySemanticKeys;
  }

  if (step.semanticKey) {
    return [step.semanticKey];
  }

  return step.fields?.map((field) => field.semanticKey) ?? [];
}

function getAccountLinkIcon(step: ConditionDefinition['flow'][number]): IconName {
  if (step.accountLink?.icon) {
    return step.accountLink.icon as IconName;
  }

  if (step.id.includes('mutation')) {
    return 'flask';
  }

  if (step.id.includes('event') || step.id.includes('history')) {
    return 'bolt';
  }

  if (step.id.includes('year') || step.id.includes('about')) {
    return 'user-o';
  }

  return 'heartbeat';
}

function HealthProfileLink({
  label,
  summary,
  icon,
  isLast,
  onPress,
}: {
  label: string;
  summary: string;
  icon: IconName;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkRow,
        !isLast && styles.linkDivider,
        pressed && styles.pressed,
      ]}
    >
      <FontAwesome name={icon} size={17} color={colors.midday} style={styles.linkIcon} />
      <View style={styles.linkCopy}>
        <LedText variant="subtitle">{label}</LedText>
        <LedText variant="bodySmall" color="predawn">
          {summary}
        </LedText>
      </View>
      <LedText variant="title" color="predawn">
        ›
      </LedText>
    </Pressable>
  );
}

function EmptyHealthProfile() {
  return (
    <View style={styles.section}>
      <LedText variant="label" color="predawn">
        Health profile
      </LedText>
      <View style={styles.emptyCard}>
        <LedText variant="subtitle">No condition profile yet</LedText>
        <LedText variant="bodySmall" color="textMid">
          Choose a condition to start building your profile.
        </LedText>
        <PrimaryButton
          label="Choose condition"
          fullWidth
          onPress={() => router.push('/conditions')}
        />
      </View>
    </View>
  );
}

function DangerZone({ onDeletePress }: { onDeletePress: () => void }) {
  return (
    <View style={styles.section}>
      <LedText variant="label" color="flagHigh">
        Danger zone
      </LedText>
      <View style={styles.dangerCard}>
        <View style={styles.dangerCopy}>
          <LedText variant="subtitle">Delete account and data</LedText>
          <LedText variant="bodySmall" color="predawn">
            Permanently remove your account, health profile, and check-in history.
          </LedText>
        </View>
        <PrimaryButton
          label="Delete my account and data"
          variant="danger"
          fullWidth
          onPress={onDeletePress}
        />
      </View>
    </View>
  );
}

function parseProfileValues(profile: unknown): Record<string, SemanticValue> {
  if (!profile || typeof profile !== 'object' || !('values' in profile)) {
    return {};
  }

  const values = (profile as { values?: unknown }).values;
  return values && typeof values === 'object' && !Array.isArray(values)
    ? (values as Record<string, SemanticValue>)
    : {};
}

function buildProfileSummary(
  conditionDefinition: ConditionDefinition | undefined,
  values: Record<string, SemanticValue> | undefined,
) {
  if (!conditionDefinition) {
    return 'Health profile';
  }

  const condition = conditionDefinition.label;
  const summaryValue = values
    ? conditionDefinition.outputs.summaryFields
        .flatMap((key) => summarizeValue(values[key]))
        .find(Boolean)
    : null;
  const diagnosisYear = values?.['diagnosis.year'];

  return [
    condition,
    summaryValue,
    typeof diagnosisYear === 'number' ? `Diagnosed ${diagnosisYear}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function summarizeStep(keys: string[] | undefined, values: Record<string, SemanticValue>) {
  const summary = (keys ?? [])
    .flatMap((key) => summarizeValue(values[key]))
    .filter(Boolean)
    .join(' · ');

  return summary || 'Not added yet';
}

function summarizeValue(value: SemanticValue | undefined): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (Array.isArray(value)) {
    return value.length ? value.map(formatValue).join(' · ') : null;
  }

  return formatValue(String(value));
}

function formatValue(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function getDisplayName(name?: string | null, email?: string | null) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  return email?.split('@')[0]?.trim() || 'there';
}

function getErrorMessage(error: unknown) {
  if (!error) {
    return null;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to delete your account. Please try again.';
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  section: {
    gap: spacing.sm,
  },
  linkGroup: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
  },
  linkRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  linkDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  linkIcon: {
    width: 22,
  },
  linkCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  circleEmptyRow: {
    gap: spacing.xxs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  circleCareDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  circleDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  circleManageRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emptyCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  dangerCard: {
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.flagHigh,
    borderRadius: radii.xxl,
    backgroundColor: colors.flagHighBg,
    padding: spacing.lg,
  },
  dangerCopy: {
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.72,
  },
});
