import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppScreen,
  LedText,
  PrimaryButton,
  colors,
  radii,
  spacing,
} from '@led/design-system';
import {
  ScreenHeaderChevronLink,
  ScreenHeaderNavRow,
} from '@/components/screen-header';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useWeeklyCheckinHistoryQuery,
  useWeeklyCheckinSummaryQuery,
  type WeeklyCheckin,
} from '../api/weekly-checkin-queries';
import { routeToWeeklyCheckin } from '../lib/weeklyCheckinRoutes';
import { WeeklyCheckinScoreBadge } from './WeeklyCheckinScoreBadge';

export function WeeklyCheckinHistoryScreen() {
  const historyQuery = useWeeklyCheckinHistoryQuery();
  const summaryQuery = useWeeklyCheckinSummaryQuery();
  const currentWeekStartDate = summaryQuery.data?.weekStartDate;

  if (historyQuery.isPending || summaryQuery.isPending || !summaryQuery.data) {
    return <LoadingScreen message="Loading check-in history" />;
  }

  const checkins = historyQuery.data ?? [];

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={
            <ScreenHeaderChevronLink
              label="Back"
              onPress={() => router.back()}
            />
          }
          title={
            <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
              Score history
            </LedText>
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <LedText variant="displayMedium">Weekly scores</LedText>
          <LedText variant="body" color="textMid">
            Review each submitted week and tap any row to update the answers.
          </LedText>
          <PrimaryButton
            label={
              summaryQuery.data.hasCompletedCurrentWeek
                ? 'View this week'
                : 'Start this week'
            }
            fullWidth
            onPress={() => routeToWeeklyCheckin(summaryQuery.data)}
          />
        </View>

        {checkins.length > 0 ? (
          <View style={styles.list}>
            {checkins.map((checkin) => (
              <HistoryRow
                key={checkin.id}
                checkin={checkin}
                isCurrentWeek={checkin.weekStartDate === currentWeekStartDate}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <LedText variant="subtitle">No saved scores yet</LedText>
            <LedText variant="bodySmall" color="textMid">
              Complete a weekly check-in to start building your history.
            </LedText>
            <PrimaryButton
              label="Start check-in"
              onPress={() => router.replace('/check-in')}
            />
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

function HistoryRow({
  checkin,
  isCurrentWeek,
}: {
  checkin: WeeklyCheckin;
  isCurrentWeek: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/check-in/[checkinId]',
          params: { checkinId: checkin.id },
        })
      }
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowCopy}>
        <View style={styles.rowTitle}>
          <LedText variant="subtitle" style={styles.weekTitle}>
            {isCurrentWeek
              ? 'This week'
              : formatWeekRange(checkin.weekStartDate)}
          </LedText>
          {isCurrentWeek ? (
            <View style={styles.currentPill}>
              <LedText variant="label" color="midday">
                Current
              </LedText>
            </View>
          ) : null}
        </View>
        <LedText variant="bodySmall" color="predawn">
          Week of {formatLongDate(checkin.weekStartDate)}
        </LedText>
      </View>
      <View style={styles.rowScore}>
        <WeeklyCheckinScoreBadge
          compact
          percent={checkin.score.percent}
          total={checkin.score.total}
          max={checkin.score.max}
        />
        <LedText variant="title" color="predawn">
          {'>'}
        </LedText>
      </View>
    </Pressable>
  );
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatWeekRange(weekStartDate: string) {
  const start = new Date(`${weekStartDate}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    gap: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  rowPressed: {
    opacity: 0.78,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  weekTitle: {
    color: colors.midnight,
  },
  currentPill: {
    borderRadius: radii.pill,
    backgroundColor: colors.selectedBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  rowScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
});
