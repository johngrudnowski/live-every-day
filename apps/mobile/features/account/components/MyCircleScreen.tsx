import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, CircleAvatar, LedText, colors, radii, spacing } from '@led/design-system';

import { ScreenFooter, screenFooterNavActiveLabel } from '@/components/screen-footer';
import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { useMobileAuth } from '@/features/auth/hooks/use-mobile-auth';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useMyCircleQuery,
  type CircleCareTeamPerson,
  type CirclePermission,
  type CircleStateTone,
  type CircleSupportPerson,
} from '../api/account-queries';

const permissionOptions = [
  { key: 'weekly_score', label: 'Weekly score' },
  { key: 'symptom_trends', label: 'Symptom trends' },
  { key: 'labs', label: 'Labs' },
  { key: 'appointment_brief', label: 'Appointment brief' },
] as const;

export function MyCircleScreen() {
  const auth = useMobileAuth();
  const circleQuery = useMyCircleQuery(Boolean(auth.data?.session));

  useEffect(() => {
    if (!auth.isPending && !auth.data?.session) {
      router.replace('/auth/login');
    }
  }, [auth.data?.session, auth.isPending]);

  if (auth.isPending) {
    return <LoadingScreen message="Loading your circle" />;
  }

  if (!auth.data?.session) {
    return <LoadingScreen message="Checking your session" />;
  }

  const supportPeople = circleQuery.data?.supportPeople ?? [];
  const myNumberOne = supportPeople.find((person) => person.role === 'my_number_one') ?? null;
  const otherSupportPeople = supportPeople.filter((person) => person.role !== 'my_number_one');

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={
            <ScreenHeaderChevronLink label="Account" onPress={() => router.replace('/account')} />
          }
          title={
            <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
              My Circle
            </LedText>
          }
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <IntroBanner />

        {circleQuery.isPending ? (
          <View style={styles.loadingCard}>
            <LedText variant="bodySmall" color="predawn">
              Loading your circle...
            </LedText>
          </View>
        ) : (
          <>
            <SupportSection supportPeople={otherSupportPeople} />
            <MyNumberOneSection person={myNumberOne} />
            <CareTeamSection careTeamPeople={circleQuery.data?.careTeamPeople ?? []} />
          </>
        )}
      </ScrollView>

      <ScreenFooter activeLabel={screenFooterNavActiveLabel.account} />
    </AppScreen>
  );
}

function IntroBanner() {
  return (
    <View style={styles.banner}>
      <LedText variant="subtitle" style={styles.bannerTitle}>
        You don't manage this alone.
      </LedText>
      <LedText variant="bodySmall" style={styles.bannerBody}>
        Choose who's in your circle and what they can see. You're always in control.
      </LedText>
    </View>
  );
}

function SupportSection({ supportPeople }: { supportPeople: CircleSupportPerson[] }) {
  return (
    <CircleSection
      title="My Support"
      description="Friends and family who cheer you on. No app needed - they get a link to leave you encouraging messages before your weekly check-in."
    >
      {supportPeople.length > 0 ? (
        supportPeople.map((person, index) => (
          <SupportPersonRow
            key={person.id}
            person={person}
            isLast={index === supportPeople.length - 1}
          />
        ))
      ) : (
        <EmptySectionRow message="No support people added yet." />
      )}
      <AddRow label="Add someone to My Support" />
    </CircleSection>
  );
}

function MyNumberOneSection({ person }: { person: CircleSupportPerson | null }) {
  return (
    <CircleSection
      title="My #1"
      description="Your closest person - a spouse, parent, or caregiver who's with you day to day. They can see your weekly summary with your permission."
    >
      {person ? <SupportPersonRow person={person} isLast={false} avatarTone="primary" /> : null}
      {person ? (
        <PermissionPanel displayName={person.displayName} permissions={person.permissions} />
      ) : (
        <EmptySectionRow message="Choose one person as your #1." />
      )}
      <AddRow label="Only one My #1 at a time" disabled />
    </CircleSection>
  );
}

function CareTeamSection({ careTeamPeople }: { careTeamPeople: CircleCareTeamPerson[] }) {
  return (
    <CircleSection
      title="My Care Team"
      description="Your hematologist, PA, or care coordinator. They get a provider dashboard - your symptom trends and patterns, nothing more, unless you choose to share more."
    >
      {careTeamPeople.length > 0 ? (
        careTeamPeople.map((person, index) => (
          <CareTeamPersonRow
            key={person.id}
            person={person}
            isLast={index === careTeamPeople.length - 1}
          />
        ))
      ) : (
        <EmptySectionRow message="No care team members added yet." />
      )}
      <AddRow label="Add a care team member" />
    </CircleSection>
  );
}

function CircleSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <LedText variant="label" color="predawn" style={styles.sectionTitle}>
        {title}
      </LedText>
      <View style={styles.sectionCard}>
        <View style={styles.sectionIntro}>
          <LedText variant="bodySmall" color="predawn" style={styles.sectionIntroText}>
            {description}
          </LedText>
        </View>
        {children}
      </View>
    </View>
  );
}

function SupportPersonRow({
  person,
  isLast,
  avatarTone,
}: {
  person: CircleSupportPerson;
  isLast: boolean;
  avatarTone?: 'primary' | 'support' | 'muted';
}) {
  return (
    <PersonRow
      avatar={
        <CircleAvatar
          label={person.displayName}
          initials={person.initials}
          size={36}
          tone={avatarTone ?? getSupportAvatarTone(person)}
        />
      }
      name={person.displayName}
      detail={person.detailLine}
      stateLabel={person.stateLabel}
      stateTone={person.stateTone}
      isLast={isLast}
    />
  );
}

function CareTeamPersonRow({ person, isLast }: { person: CircleCareTeamPerson; isLast: boolean }) {
  return (
    <PersonRow
      avatar={
        <CircleAvatar
          label={person.displayName}
          initials={person.initials}
          size={36}
          tone={person.stateTone === 'muted' ? 'muted' : 'care'}
        />
      }
      name={person.displayName}
      detail={formatCareTeamDetail(person)}
      stateLabel={person.stateLabel}
      stateTone={person.stateTone}
      isLast={isLast}
    />
  );
}

function PersonRow({
  avatar,
  name,
  detail,
  stateLabel,
  stateTone,
  isLast,
}: {
  avatar: ReactNode;
  name: string;
  detail: string;
  stateLabel: string;
  stateTone: CircleStateTone;
  isLast: boolean;
}) {
  return (
    <View style={[styles.personRow, !isLast && styles.rowDivider]}>
      <View style={styles.personIdentity}>
        {avatar}
        <View style={styles.personCopy}>
          <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
            {name}
          </LedText>
          <LedText variant="bodySmall" color="predawn" numberOfLines={1} ellipsizeMode="tail">
            {detail}
          </LedText>
        </View>
      </View>
      <LedText variant="bodySmall" color={getStateToneColor(stateTone)} style={styles.stateLabel}>
        {stateLabel}
      </LedText>
    </View>
  );
}

function PermissionPanel({
  displayName,
  permissions,
}: {
  displayName: string;
  permissions: CirclePermission[];
}) {
  const grantedKeys = new Set(permissions.map((permission) => permission.key));

  return (
    <View style={[styles.permissionPanel, styles.rowDivider]}>
      <LedText variant="bodySmall" color="predawn" style={styles.permissionTitle}>
        What {getFirstName(displayName)} can see
      </LedText>
      <View style={styles.permissionChips}>
        {permissionOptions.map((permission) => {
          const granted = grantedKeys.has(permission.key);

          return (
            <View
              key={permission.key}
              style={[
                styles.permissionChip,
                granted ? styles.permissionChipOn : styles.permissionChipOff,
              ]}
            >
              <LedText
                variant="bodySmall"
                style={[
                  styles.permissionChipText,
                  granted ? styles.permissionChipTextOn : styles.permissionChipTextOff,
                ]}
              >
                {granted ? permission.label : `${permission.label} - off`}
              </LedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function EmptySectionRow({ message }: { message: string }) {
  return (
    <View style={[styles.emptyRow, styles.rowDivider]}>
      <LedText variant="bodySmall" color="predawn">
        {message}
      </LedText>
    </View>
  );
}

function AddRow({ label, disabled = false }: { label: string; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.addRow,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.addIcon}>
        <FontAwesome name="plus" size={14} color={disabled ? colors.predawn : colors.midday} />
      </View>
      <LedText variant="subtitle" color={disabled ? 'predawn' : 'midday'} style={styles.addLabel}>
        {label}
      </LedText>
    </Pressable>
  );
}

function getSupportAvatarTone(person: CircleSupportPerson) {
  return person.stateTone === 'muted' || person.inviteStatus === 'pending' ? 'muted' : 'support';
}

function getStateToneColor(tone: CircleStateTone) {
  if (tone === 'attention') {
    return 'sunset';
  }

  if (tone === 'muted') {
    return 'afternoon';
  }

  return 'midday';
}

function formatCareTeamDetail(person: CircleCareTeamPerson) {
  return [person.specialty, person.organization].filter(Boolean).join(' · ') || person.detailLine;
}

function getFirstName(displayName: string) {
  return displayName.split(/\s+/).filter(Boolean)[0] ?? displayName;
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
  loadingCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
  },
  sectionIntro: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionIntroText: {
    lineHeight: 20,
  },
  personRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  personIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  stateLabel: {
    flexShrink: 0,
    fontFamily: 'DMSans_600SemiBold',
  },
  permissionPanel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  permissionTitle: {
    marginBottom: spacing.sm,
  },
  permissionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  permissionChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
  permissionChipOn: {
    backgroundColor: colors.flagOkBg,
  },
  permissionChipOff: {
    backgroundColor: colors.surface,
  },
  permissionChipText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'DMSans_500Medium',
  },
  permissionChipTextOn: {
    color: '#1A6040',
  },
  permissionChipTextOff: {
    color: colors.predawn,
  },
  emptyRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  addLabel: {
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.72,
  },
});
