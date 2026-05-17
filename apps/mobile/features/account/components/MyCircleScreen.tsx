import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, colors, radii, spacing } from '@led/design-system';

import { ScreenFooter, screenFooterNavActiveLabel } from '@/components/screen-footer';
import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { useMobileAuth } from '@/features/auth/hooks/use-mobile-auth';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useMyCircleQuery,
  type CircleCareTeamPerson,
  type CircleSupportPerson,
} from '../api/account-queries';

import { CareTeamPersonRow } from './CareTeamPersonRow';
import { SupportPersonRow } from './SupportPersonRow';

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
      {person ? (
        <SupportPersonRow person={person} isLast />
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
      description="Doctors, clinicians, and care coordinators you want to keep handy. These entries are local until you choose to connect a real provider account later."
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
      <AddRow
        label="Add a care team member"
        onPress={() =>
          router.push({
            pathname: '/circle/care-team/[careTeamPersonId]',
            params: { careTeamPersonId: 'new' },
          })
        }
      />
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

function EmptySectionRow({ message }: { message: string }) {
  return (
    <View style={[styles.emptyRow, styles.rowDivider]}>
      <LedText variant="bodySmall" color="predawn">
        {message}
      </LedText>
    </View>
  );
}

function AddRow({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
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
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
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
