import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  AppScreen,
  LedText,
  PrimaryButton,
  ProgressBar,
  colors,
  spacing,
} from '@led/design-system';
import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useSaveWeeklyCheckinDraftMutation,
  useWeeklyCheckinSummaryQuery,
} from '../api/weekly-checkin-queries';
import { getCurrentAnswers } from '../lib/weeklyCheckinProgress';
import { isQuestionAnswered } from '../lib/weeklyCheckinScoring';
import {
  WeeklyCheckinAnswersForm,
  buildWeeklyCheckinQuestionGroups,
} from './WeeklyCheckinAnswersForm';
import { WeeklyCheckinCustomNoteCard } from './WeeklyCheckinCustomNoteCard';

export function WeeklyCheckinQuestionScreen() {
  const summaryQuery = useWeeklyCheckinSummaryQuery();
  const saveDraftMutation = useSaveWeeklyCheckinDraftMutation();
  const summary = summaryQuery.data;
  const answers = useMemo(() => getCurrentAnswers(summary), [summary]);
  const currentCheckinId = summary?.currentCheckin?.id ?? '';
  const savedCustomNote = summary?.currentCheckin?.customNote ?? '';
  const [draftAnswers, setDraftAnswers] = useState<Record<string, unknown>>(answers);
  const [customNote, setCustomNote] = useState(savedCustomNote);
  const persistedNoteRef = useRef(savedCustomNote);
  const loadedCheckinIdRef = useRef(currentCheckinId);
  const hasLocalDraftEditsRef = useRef(false);

  useEffect(() => {
    if (!hasLocalDraftEditsRef.current) {
      setDraftAnswers(answers);
    }
  }, [answers, currentCheckinId]);

  useEffect(() => {
    if (currentCheckinId === loadedCheckinIdRef.current) {
      persistedNoteRef.current = savedCustomNote;
      return;
    }

    loadedCheckinIdRef.current = currentCheckinId;
    persistedNoteRef.current = savedCustomNote;
    setCustomNote(savedCustomNote);
  }, [currentCheckinId, savedCustomNote]);

  useEffect(() => {
    if (!summary || customNote === persistedNoteRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      saveDraftMutation.mutate(
        {
          data: {
            answers: draftAnswers,
            currentQuestionId: 'custom_note',
            customNote,
          },
        },
        {
          onSuccess: () => {
            persistedNoteRef.current = customNote;
          },
        },
      );
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [customNote, draftAnswers, saveDraftMutation, summary]);

  if (summaryQuery.isPending) {
    return <LoadingScreen message="Loading check-in" />;
  }

  if (!summary) {
    return <LoadingScreen message="Opening check-in" />;
  }

  const activeDefinition = summary.activeDefinition;
  const allQuestions = activeDefinition.questions;
  const groups = buildWeeklyCheckinQuestionGroups(allQuestions);
  const answeredCount = allQuestions.filter((question) =>
    isQuestionAnswered(question, draftAnswers),
  ).length;
  const allAnswered = allQuestions.every((question) => isQuestionAnswered(question, draftAnswers));

  function handleAnswerChange(questionId: string, value: unknown) {
    const nextAnswers = { ...draftAnswers, [questionId]: value };
    hasLocalDraftEditsRef.current = true;
    setDraftAnswers(nextAnswers);
    saveDraftMutation.mutate({
      data: {
        answers: nextAnswers,
        currentQuestionId: questionId,
        customNote,
      },
    });
  }

  async function handleContinue() {
    if (!allAnswered) {
      return;
    }

    await saveDraftMutation.mutateAsync({
      data: {
        answers: draftAnswers,
        currentQuestionId: 'anchor_done',
        customNote,
      },
    });
    router.push('/check-in/anchor-done');
  }

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={<ScreenHeaderChevronLink label="Back" onPress={() => router.back()} />}
          title={
            <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
              MPN-10 - This week
            </LedText>
          }
          right={
            <LedText variant="bodySmall" color="predawn">
              5-10 min
            </LedText>
          }
        />
        <View style={styles.groupDots}>
          {groups.map((group) => {
            const groupAnswered = group.questions.filter((question) =>
              isQuestionAnswered(question, draftAnswers),
            ).length;
            const isComplete = groupAnswered === group.questions.length;
            return (
              <View
                key={group.label}
                style={[
                  styles.groupDot,
                  isComplete && styles.groupDotComplete,
                  groupAnswered > 0 && !isComplete && styles.groupDotPartial,
                ]}
              />
            );
          })}
        </View>
        <ProgressBar value={answeredCount} max={allQuestions.length} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WeeklyCheckinAnswersForm
          answers={draftAnswers}
          questions={allQuestions}
          onAnswerChange={handleAnswerChange}
        />

        <WeeklyCheckinCustomNoteCard
          value={customNote}
          onChangeText={setCustomNote}
          footerText={saveDraftMutation.isPending ? 'Saving...' : 'Saved with your answers'}
        />

        <PrimaryButton
          label="Finish check-in ✓"
          fullWidth
          disabled={!allAnswered || saveDraftMutation.isPending}
          onPress={() => void handleContinue()}
          style={!allAnswered ? styles.finishDisabled : undefined}
        />
        <LedText variant="bodySmall" color="predawn" align="center">
          {allAnswered
            ? 'All 10 answered - ready to save.'
            : `${allQuestions.length - answeredCount} questions remaining`}
        </LedText>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  groupDots: {
    flexDirection: 'row',
    gap: 6,
  },
  groupDot: {
    width: 8,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  groupDotPartial: {
    borderWidth: 0,
    backgroundColor: 'rgba(106, 176, 200, 0.5)',
  },
  groupDotComplete: {
    width: 28,
    borderWidth: 0,
    backgroundColor: colors.midday,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  finishDisabled: {
    opacity: 0.35,
  },
});
