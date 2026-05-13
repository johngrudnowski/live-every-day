import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, spacing } from '@led/design-system';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import { useWeeklyCheckinSummaryQuery } from '../api/weekly-checkin-queries';
import { getCurrentAnswers, getNextQuestionIndex } from '../lib/weeklyCheckinProgress';
import { LastWeeksScore } from './LastWeeksScore';
import { WhatToExpect } from './WhatToExpect';

export function WeeklyCheckinIntroScreen() {
  const summaryQuery = useWeeklyCheckinSummaryQuery();

  if (summaryQuery.isPending) {
    return <LoadingScreen message="Loading check-in" />;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <AppScreen style={styles.centered}>
        <LedText variant="title" align="center">
          Unable to load weekly check-in
        </LedText>
        <PrimaryButton label="Try again" onPress={() => void summaryQuery.refetch()} />
      </AppScreen>
    );
  }

  if (summaryQuery.data.hasCompletedCurrentWeek) {
    router.replace('/check-in/saved');
    return <LoadingScreen message="Opening saved check-in" />;
  }

  const { activeDefinition, previousWeekCheckin } = summaryQuery.data;
  const answers = getCurrentAnswers(summaryQuery.data);
  const startIndex = getNextQuestionIndex(activeDefinition, answers);
  const weekLabel = formatWeekRange(summaryQuery.data.weekStartDate);

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/home')}>
            <LedText variant="subtitle" color="midday">
              {'<'} Home
            </LedText>
          </Pressable>
          <LedText variant="subtitle">Weekly check-in</LedText>
          <View style={styles.headerSpacer} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LedText variant="label" color="midday">
            {weekLabel}
          </LedText>
          <LedText variant="title" style={styles.heroTitle}>
            Time for your weekly check-in.
          </LedText>
          <LedText variant="bodySmall" style={styles.heroBody}>
            10 questions about how you've been feeling this week. Be honest - this data is only for
            you.
          </LedText>
        </View>

        <WhatToExpect />
        {previousWeekCheckin ? <LastWeeksScore checkin={previousWeekCheckin} /> : null}

        <View style={styles.actions}>
          <PrimaryButton
            label={
              summaryQuery.data.currentCheckin?.status === 'draft'
                ? 'Resume by tapping ->'
                : 'Answer by tapping ->'
            }
            fullWidth
            onPress={() =>
              router.push({
                pathname: '/check-in/question',
                params: { index: String(startIndex) },
              })
            }
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function formatWeekRange(weekStartDate: string) {
  const start = new Date(`${weekStartDate}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' });
  return `Week of ${formatter.format(start)} - ${formatter.format(end)}`;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    borderRadius: 16,
    backgroundColor: colors.midnight,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  heroTitle: {
    color: colors.white,
  },
  heroBody: {
    color: 'rgba(255,252,245,0.55)',
    lineHeight: 20,
  },
  actions: {
    marginTop: 'auto',
    gap: spacing.md,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
