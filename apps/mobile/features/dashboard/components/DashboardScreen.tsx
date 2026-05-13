import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, colors, spacing } from '@led/design-system';

import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import { useMobileAuth } from '@/features/auth/hooks/use-mobile-auth';
import { useConditionGate } from '@/features/conditions/hooks/useConditionGate';
import { DashboardBottomBar } from './DashboardBottomBar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardWidgets } from './DashboardWidgets';
import { QuickLinks } from './QuickLinks';
import { SelectConditionCard } from './SelectConditionCard';
import { WeeklyCheckInCard } from './WeeklyCheckInCard';

export function DashboardScreen() {
  const { data, isPending, signOut } = useMobileAuth();
  const conditionGate = useConditionGate(Boolean(data?.session));
  const user = data?.user;
  const displayName = getDisplayName(user?.name, user?.email);

  useEffect(() => {
    if (!isPending && !data?.session) {
      router.replace('/auth/login');
    }
  }, [data?.session, isPending]);

  useEffect(() => {
    if (conditionGate.shouldSelectCondition) {
      router.replace('/conditions');
    }
  }, [conditionGate.shouldSelectCondition]);

  if (isPending || !data?.session || conditionGate.isPending || conditionGate.shouldSelectCondition) {
    return <LoadingScreen message="Checking your session" />;
  }

  const shouldShowConditionCard = conditionGate.isSuccess && !conditionGate.data.hasConditionProfile;

  return (
    <AppScreen padded={false} style={styles.screen}>
      <DashboardHeader
        user={{
          name: displayName,
          email: user?.email ?? null,
          image: user?.image ?? null,
        }}
        onLogoPress={() => router.push('/design-system')}
        onSignOut={() => void signOut()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GreetingBlock dateLabel={getDashboardDateLabel()} name={displayName} />
        {shouldShowConditionCard ? <SelectConditionCard /> : null}
        <WeeklyCheckInCard />
        <DashboardWidgets />
        <QuickLinks />
      </ScrollView>

      <DashboardBottomBar />
    </AppScreen>
  );
}

function GreetingBlock({ dateLabel, name }: { dateLabel: string; name: string }) {
  return (
    <View style={styles.greeting}>
      <LedText variant="bodySmall" color="predawn">
        {dateLabel}
      </LedText>
      <LedText variant="displayMedium" style={styles.greetingTitle}>
        Good morning, {name}.
      </LedText>
      <LedText variant="body" color="textMid">
        Time for our weekly check-in.
      </LedText>
    </View>
  );
}

function getDashboardDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function getDisplayName(name?: string | null, email?: string | null) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName.split(/\s+/)[0] ?? trimmedName;
  }

  const emailName = email?.split('@')[0]?.trim();
  return emailName || 'there';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    gap: spacing.xs,
  },
  greetingTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 25,
    lineHeight: 31,
  },
});
