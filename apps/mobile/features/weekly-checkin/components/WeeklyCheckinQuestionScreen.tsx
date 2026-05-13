import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppScreen,
  LedText,
  PrimaryButton,
  ProgressBar,
  colors,
  spacing,
} from '@led/design-system';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useSaveWeeklyCheckinDraftMutation,
  useWeeklyCheckinSummaryQuery,
} from '../api/weekly-checkin-queries';
import type { WeeklyCheckinQuestion } from '../api/weekly-checkin-queries';
import { getCurrentAnswers } from '../lib/weeklyCheckinProgress';
import { isQuestionAnswered } from '../lib/weeklyCheckinScoring';
import { WeeklyCheckinEnumPicker } from './WeeklyCheckinEnumPicker';
import { WeeklyCheckinNumberScale } from './WeeklyCheckinNumberScale';

export function WeeklyCheckinQuestionScreen() {
  const summaryQuery = useWeeklyCheckinSummaryQuery();
  const saveDraftMutation = useSaveWeeklyCheckinDraftMutation();
  const summary = summaryQuery.data;
  const answers = useMemo(() => getCurrentAnswers(summary), [summary]);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, unknown>>(answers);

  useEffect(() => {
    setDraftAnswers(answers);
  }, [answers]);

  if (summaryQuery.isPending) {
    return <LoadingScreen message="Loading check-in" />;
  }

  if (!summary) {
    return <LoadingScreen message="Opening check-in" />;
  }

  const activeDefinition = summary.activeDefinition;
  const allQuestions = activeDefinition.questions;
  const groups = buildQuestionGroups(allQuestions);
  const answeredCount = allQuestions.filter((question) =>
    isQuestionAnswered(question, draftAnswers),
  ).length;
  const allAnswered = allQuestions.every((question) => isQuestionAnswered(question, draftAnswers));

  function handleAnswerChange(questionId: string, value: unknown) {
    const nextAnswers = { ...draftAnswers, [questionId]: value };
    setDraftAnswers(nextAnswers);
    saveDraftMutation.mutate({
      data: {
        definitionId: activeDefinition.id,
        definitionVersion: activeDefinition.version,
        answers: nextAnswers,
        currentQuestionId: questionId,
      },
    });
  }

  async function handleContinue() {
    if (!allAnswered) {
      return;
    }

    await saveDraftMutation.mutateAsync({
      data: {
        definitionId: activeDefinition.id,
        definitionVersion: activeDefinition.version,
        answers: draftAnswers,
        currentQuestionId: 'anchor_done',
      },
    });
    router.push('/check-in/anchor-done');
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
            MPN-10 - This week
          </LedText>
          <LedText variant="bodySmall" color="predawn">
            5-10 min
          </LedText>
        </View>
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
        {groups.map((group) => {
          const groupAnswered = group.questions.filter((question) =>
            isQuestionAnswered(question, draftAnswers),
          ).length;

          return (
            <View key={group.label} style={styles.groupBlock}>
              <View style={styles.groupHeader}>
                <LedText variant="label" color="predawn">
                  {group.label}
                </LedText>
                <View style={styles.groupDivider} />
                <LedText variant="bodySmall" color="predawn">
                  {groupAnswered}/{group.questions.length}
                </LedText>
              </View>

              <View style={styles.groupQuestions}>
                {group.questions.map((question) => {
                  const value = draftAnswers[question.id];
                  const tone = getQuestionTone(question, value);
                  return (
                    <View
                      key={question.id}
                      style={[
                        styles.questionCard,
                        tone === 'high' && styles.questionCardHigh,
                        tone === 'mid' && styles.questionCardMid,
                        tone === 'low' && styles.questionCardLow,
                      ]}
                    >
                      <View style={styles.questionHeader}>
                        <LedText style={styles.questionIcon}>{getQuestionIcon(question.id)}</LedText>
                        <View style={styles.questionCopy}>
                          <LedText variant="subtitle" style={styles.questionTitle}>
                            {question.title}
                          </LedText>
                          {question.subtitle ? (
                            <LedText variant="bodySmall" color="predawn">
                              {question.subtitle}
                            </LedText>
                          ) : null}
                        </View>
                        <QuestionValueBadge question={question} value={value} />
                      </View>

                      {question.kind === 'number_scale' ? (
                        <WeeklyCheckinNumberScale
                          value={typeof value === 'number' ? value : undefined}
                          min={question.min}
                          max={question.max}
                          lowLabel={question.lowLabel}
                          highLabel={question.highLabel}
                          scoreDirection={question.scoreDirection}
                          onChange={(next) => handleAnswerChange(question.id, next)}
                        />
                      ) : (
                        <WeeklyCheckinEnumPicker
                          value={typeof value === 'string' ? value : undefined}
                          options={question.options ?? []}
                          onChange={(next) => handleAnswerChange(question.id, next)}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

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

function QuestionValueBadge({
  question,
  value,
}: {
  question: WeeklyCheckinQuestion;
  value: unknown;
}) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (question.kind === 'number_scale' && typeof value === 'number') {
    const tone = getQuestionTone(question, value);
    return (
      <LedText
        variant="title"
        style={[
          styles.valueBadge,
          tone === 'high' && styles.valueBadgeHigh,
          tone === 'mid' && styles.valueBadgeMid,
          tone === 'low' && styles.valueBadgeLow,
        ]}
      >
        {value}
      </LedText>
    );
  }

  if (question.kind === 'enum' && typeof value === 'string') {
    const label = question.options?.find((option) => option.value === value)?.label;
    if (!label) {
      return null;
    }
    return (
      <LedText variant="bodySmall" style={styles.enumBadge}>
        {label}
      </LedText>
    );
  }

  return null;
}

function buildQuestionGroups(questions: WeeklyCheckinQuestion[]) {
  const groupMap: Array<{ label: string; ids: string[] }> = [
    { label: 'Fatigue & Energy', ids: ['fatigue_heaviness', 'feeling_unwell'] },
    { label: 'Pain & Body', ids: ['itching', 'bone_pain', 'muscle_pain'] },
    { label: 'Abdominal & Appetite', ids: ['left_rib_discomfort', 'early_satiety'] },
    { label: 'Constitutional', ids: ['night_sweats', 'fevers', 'weight_loss'] },
  ];

  const used = new Set<string>();
  const grouped = groupMap
    .map((group) => ({
      label: group.label,
      questions: group.ids
        .map((id) => {
          const question = questions.find((item) => item.id === id);
          if (question) {
            used.add(question.id);
          }
          return question;
        })
        .filter((question): question is WeeklyCheckinQuestion => Boolean(question)),
    }))
    .filter((group) => group.questions.length > 0);

  const ungrouped = questions.filter((question) => !used.has(question.id));
  if (ungrouped.length > 0) {
    grouped.push({ label: 'Additional symptoms', questions: ungrouped });
  }

  return grouped;
}

function getQuestionTone(question: WeeklyCheckinQuestion, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return 'none';
  }

  if (question.kind === 'number_scale' && typeof value === 'number') {
    const min = question.min ?? 0;
    const max = question.max ?? 10;
    const denominator = Math.max(1, max - min);
    const normalized = (value - min) / denominator;
    const burden = question.scoreDirection === 'higher_is_better' ? 1 - normalized : normalized;

    if (burden >= 0.67) {
      return 'high';
    }
    if (burden >= 0.34) {
      return 'mid';
    }
    return 'low';
  }

  if (question.kind === 'enum' && typeof value === 'string') {
    const highestOptionScore = Math.max(1, ...(question.options ?? []).map((option) => option.score ?? 0));
    const selectedScore =
      (question.options ?? []).find((option) => option.value === value)?.score ?? 0;
    const burden = selectedScore / highestOptionScore;

    if (burden >= 0.67) {
      return 'high';
    }
    if (burden >= 0.34) {
      return 'mid';
    }
    return 'low';
  }

  return 'none';
}

function getQuestionIcon(questionId: string) {
  const icons: Record<string, string> = {
    fatigue_heaviness: '😴',
    feeling_unwell: '🛋️',
    itching: '🤲',
    bone_pain: '🦴',
    muscle_pain: '💪',
    left_rib_discomfort: '🫃',
    early_satiety: '🍽️',
    night_sweats: '🌡️',
    fevers: '🔥',
    weight_loss: '⚖️',
  };

  return icons[questionId] ?? '•';
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
  headerRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
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
  groupBlock: {
    gap: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  groupQuestions: {
    gap: spacing.sm,
  },
  questionCard: {
    gap: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  questionCardLow: {
    borderWidth: 1.5,
    borderColor: 'rgba(106, 176, 200, 0.35)',
    backgroundColor: '#F0F9FF',
  },
  questionCardMid: {
    borderWidth: 1.5,
    borderColor: 'rgba(200, 152, 88, 0.35)',
    backgroundColor: '#FFFBF2',
  },
  questionCardHigh: {
    borderWidth: 1.5,
    borderColor: 'rgba(200, 112, 96, 0.35)',
    backgroundColor: '#FEF2F0',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  questionIcon: {
    fontSize: 24,
    lineHeight: 28,
  },
  questionCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  questionTitle: {
    color: colors.midnight,
    fontSize: 15,
    lineHeight: 20,
  },
  valueBadge: {
    lineHeight: 22,
  },
  valueBadgeLow: {
    color: colors.midday,
  },
  valueBadgeMid: {
    color: colors.sunset,
  },
  valueBadgeHigh: {
    color: colors.flagHigh,
  },
  enumBadge: {
    color: colors.midnight,
    fontFamily: 'DMSans_600SemiBold',
  },
  finishDisabled: {
    opacity: 0.35,
  },
});
