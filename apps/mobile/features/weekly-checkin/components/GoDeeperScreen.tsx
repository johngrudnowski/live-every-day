import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  type WeeklyCheckinQuestion,
  useSaveWeeklyCheckinDraftMutation,
  useSubmitWeeklyCheckinMutation,
  useWeeklyCheckinSummaryQuery,
} from '../api/weekly-checkin-queries';
import { getCurrentAnswers } from '../lib/weeklyCheckinProgress';
import { routeToSaved } from '../lib/weeklyCheckinRoutes';
import { WeeklyCheckinEnumPicker } from './WeeklyCheckinEnumPicker';

const DEEPER_GROUPS: Array<{ title: string; ids: string[] }> = [
  { title: 'Fatigue & Energy', ids: ['d_inactivity'] },
  { title: 'Sleep & Autonomic', ids: ['d_sleep', 'd_restless', 'd_flushing'] },
  {
    title: 'Cognitive & Neurologic',
    ids: ['d_fog', 'd_headache', 'd_migraine', 'd_numb', 'd_tinnitus', 'd_vision'],
  },
  { title: 'Musculoskeletal', ids: ['d_joint', 'd_cramp', 'd_spasm', 'd_ache'] },
  { title: 'GI, Abdominal & Spleen', ids: ['d_abdom', 'd_appetite', 'd_bloat'] },
  { title: 'Constitutional', ids: ['d_gain'] },
  {
    title: 'Functional Impact & Quality of Life',
    ids: ['d_active', 'd_conc', 'd_intimacy', 'd_self'],
  },
];

export function GoDeeperScreen() {
  const summaryQuery = useWeeklyCheckinSummaryQuery();
  const saveDraftMutation = useSaveWeeklyCheckinDraftMutation();
  const submitMutation = useSubmitWeeklyCheckinMutation();
  const summary = summaryQuery.data;
  const answers = useMemo(() => getCurrentAnswers(summary), [summary]);
  const prompts = useMemo(() => summary?.activeDefinition.deeperPrompts ?? [], [summary]);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(prompts.map((prompt) => [prompt.id, answers[prompt.id]])),
  );

  useEffect(() => {
    setDraftAnswers(Object.fromEntries(prompts.map((prompt) => [prompt.id, answers[prompt.id]])));
  }, [answers, prompts]);

  if (summaryQuery.isPending) {
    return <LoadingScreen message="Loading check-in" />;
  }

  if (!summary) {
    return <LoadingScreen message="Opening check-in" />;
  }

  const groupedPrompts = groupDeeperPrompts(prompts);
  const customNote = summary.currentCheckin?.customNote ?? undefined;

  function handlePromptChange(promptId: string, value: string) {
    const nextAnswers = {
      ...draftAnswers,
      [promptId]: value,
    };
    setDraftAnswers(nextAnswers);

    saveDraftMutation.mutate({
      data: {
        answers: {
          ...answers,
          ...nextAnswers,
        },
        currentQuestionId: promptId,
        customNote,
      },
    });
  }

  async function handleSaveAndFinish() {
    if (!summary) {
      return;
    }

    await submitMutation.mutateAsync({
      data: {
        answers: {
          ...answers,
          ...draftAnswers,
        },
        customNote,
      },
    });
    routeToSaved(true);
  }

  async function handleSkip() {
    if (!summary) {
      return;
    }

    await submitMutation.mutateAsync({
      data: {
        answers: {
          ...answers,
          ...draftAnswers,
        },
        customNote,
      },
    });
    routeToSaved(true);
  }

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.push('/check-in/anchor-done')}>
            <LedText variant="subtitle" color="midday">
              {'<'}
            </LedText>
          </Pressable>
          <LedText variant="subtitle">Anything else this week?</LedText>
          <View style={styles.headerSpacer} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.copy}>
          <LedText variant="body" color="textMid">
            Tap how each symptom has felt this week. Skip anything that doesn&apos;t apply.
          </LedText>
        </View>

        <View style={styles.prompts}>
          {groupedPrompts.map((group) => (
            <View key={group.title} style={styles.group}>
              <LedText variant="label" color="predawn" style={styles.groupTitle}>
                {group.title}
              </LedText>
              <View style={styles.groupCards}>
                {group.questions.map((prompt) => (
                  <View key={prompt.id} style={styles.prompt}>
                    <LedText variant="body" style={styles.promptTitle}>
                      {prompt.title}
                    </LedText>
                    <WeeklyCheckinEnumPicker
                      value={
                        typeof draftAnswers[prompt.id] === 'string'
                          ? (draftAnswers[prompt.id] as string)
                          : undefined
                      }
                      options={prompt.options ?? []}
                      onChange={(value) => handlePromptChange(prompt.id, value)}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Save and finish ✓"
            fullWidth
            disabled={submitMutation.isPending}
            onPress={() => void handleSaveAndFinish()}
          />
          <PrimaryButton
            label="Skip"
            variant="secondary"
            fullWidth
            disabled={submitMutation.isPending}
            onPress={() => void handleSkip()}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function groupDeeperPrompts(prompts: WeeklyCheckinQuestion[]) {
  const enumPrompts = prompts.filter((prompt) => prompt.kind === 'enum');
  const promptById = new Map(enumPrompts.map((prompt) => [prompt.id, prompt]));
  const grouped = DEEPER_GROUPS.map((group) => ({
    title: group.title,
    questions: group.ids
      .map((id) => promptById.get(id))
      .filter((prompt): prompt is WeeklyCheckinQuestion => Boolean(prompt)),
  })).filter((group) => group.questions.length > 0);

  const groupedIds = new Set(
    grouped.flatMap((group) => group.questions.map((question) => question.id)),
  );
  const ungrouped = enumPrompts.filter((prompt) => !groupedIds.has(prompt.id));

  if (ungrouped.length > 0) {
    grouped.push({
      title: 'Additional symptoms',
      questions: ungrouped,
    });
  }

  return grouped;
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
  headerRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 20,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  copy: {
    gap: spacing.sm,
  },
  prompts: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.sm,
  },
  groupTitle: {
    letterSpacing: 0.7,
  },
  groupCards: {
    gap: spacing.sm,
  },
  prompt: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  promptTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: colors.midnight,
    fontFamily: 'DMSans_500Medium',
  },
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
});
