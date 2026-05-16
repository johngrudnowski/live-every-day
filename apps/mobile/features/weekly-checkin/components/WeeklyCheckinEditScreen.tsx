import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useUpdateWeeklyCheckinMutation,
  useWeeklyCheckinDetailQuery,
  useWeeklyCheckinSummaryQuery,
} from '../api/weekly-checkin-queries';
import { calculateWeeklyCheckinScore, isQuestionAnswered } from '../lib/weeklyCheckinScoring';
import { WeeklyCheckinAnswersForm } from './WeeklyCheckinAnswersForm';
import { WeeklyCheckinCustomNoteCard } from './WeeklyCheckinCustomNoteCard';
import { WeeklyCheckinScoreBadge } from './WeeklyCheckinScoreBadge';

export function WeeklyCheckinEditScreen() {
  const params = useLocalSearchParams<{ checkinId?: string }>();
  const checkinId = params.checkinId ?? '';
  const summaryQuery = useWeeklyCheckinSummaryQuery();
  const detailQuery = useWeeklyCheckinDetailQuery(checkinId, checkinId.length > 0);
  const updateMutation = useUpdateWeeklyCheckinMutation();
  const definition = summaryQuery.data?.activeDefinition;
  const checkin = detailQuery.data;
  const [draftAnswers, setDraftAnswers] = useState<Record<string, unknown>>({});
  const [customNote, setCustomNote] = useState('');
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setDraftAnswers(checkin?.answers ?? {});
    setCustomNote(checkin?.customNote ?? '');
    setHasSaved(false);
  }, [checkin?.id, checkin?.answers, checkin?.customNote]);

  const score = useMemo(() => {
    if (!definition) {
      return null;
    }

    return calculateWeeklyCheckinScore(definition, draftAnswers);
  }, [definition, draftAnswers]);

  if (summaryQuery.isPending || detailQuery.isPending) {
    return <LoadingScreen message="Loading check-in" />;
  }

  if (!definition || !checkin) {
    return <LoadingScreen message="Opening check-in" />;
  }

  const selectedCheckin = checkin;
  const allAnswered = definition.questions.every((question) =>
    isQuestionAnswered(question, draftAnswers),
  );

  function handleAnswerChange(questionId: string, value: unknown) {
    setHasSaved(false);
    setDraftAnswers((current) => ({ ...current, [questionId]: value }));
  }

  async function handleSave() {
    if (!allAnswered) {
      return;
    }

    await updateMutation.mutateAsync({
      checkinId: selectedCheckin.id,
      data: {
        answers: draftAnswers,
        customNote,
      },
    });
    setHasSaved(true);
  }

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <LedText variant="subtitle" color="midday">
              {'<'} Back
            </LedText>
          </Pressable>
          <LedText variant="subtitle" align="center" style={styles.headerTitle}>
            Edit check-in
          </LedText>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryCopy}>
            <LedText variant="label" color="predawn">
              Week of {formatLongDate(checkin.weekStartDate)}
            </LedText>
            <LedText variant="title">Update answers</LedText>
            <LedText variant="bodySmall" color="textMid">
              Changes recalculate the score for this week.
            </LedText>
          </View>
          {score ? (
            <WeeklyCheckinScoreBadge percent={score.percent} total={score.total} max={score.max} />
          ) : null}
        </View>

        <WeeklyCheckinAnswersForm
          answers={draftAnswers}
          questions={definition.questions}
          onAnswerChange={handleAnswerChange}
        />

        <WeeklyCheckinCustomNoteCard
          value={customNote}
          onChangeText={(value) => {
            setHasSaved(false);
            setCustomNote(value);
          }}
        />

        <View style={styles.actions}>
          <PrimaryButton
            label={updateMutation.isPending ? 'Saving...' : 'Save changes'}
            fullWidth
            disabled={!allAnswered || updateMutation.isPending}
            onPress={() => void handleSave()}
            style={!allAnswered ? styles.disabled : undefined}
          />
          <PrimaryButton
            label="Back to history"
            variant="secondary"
            fullWidth
            onPress={() => router.replace('/check-in/history')}
          />
          <LedText variant="bodySmall" color={hasSaved ? 'flagOk' : 'predawn'} align="center">
            {hasSaved
              ? 'Changes saved.'
              : allAnswered
                ? 'Ready to save.'
                : 'Answer every MPN-10 question before saving.'}
          </LedText>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`));
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  actions: {
    gap: spacing.md,
  },
  disabled: {
    opacity: 0.35,
  },
});
