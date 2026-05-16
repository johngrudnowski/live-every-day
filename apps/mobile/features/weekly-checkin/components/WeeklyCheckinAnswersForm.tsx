import { StyleSheet, View } from 'react-native';
import { LedText, colors, spacing } from '@led/design-system';
import type { WeeklyCheckinQuestion } from '../api/weekly-checkin-queries';
import { isQuestionAnswered } from '../lib/weeklyCheckinScoring';
import { WeeklyCheckinEnumPicker } from './WeeklyCheckinEnumPicker';
import { WeeklyCheckinNumberScale } from './WeeklyCheckinNumberScale';

type WeeklyCheckinAnswersFormProps = {
  answers: Record<string, unknown>;
  questions: WeeklyCheckinQuestion[];
  onAnswerChange: (questionId: string, value: unknown) => void;
  showGroupProgress?: boolean;
};

export function WeeklyCheckinAnswersForm({
  answers,
  questions,
  onAnswerChange,
  showGroupProgress = true,
}: WeeklyCheckinAnswersFormProps) {
  const groups = buildQuestionGroups(questions);

  return (
    <>
      {groups.map((group) => {
        const groupAnswered = group.questions.filter((question) =>
          isQuestionAnswered(question, answers),
        ).length;

        return (
          <View key={group.label} style={styles.groupBlock}>
            <View style={styles.groupHeader}>
              <LedText variant="label" color="predawn">
                {group.label}
              </LedText>
              <View style={styles.groupDivider} />
              {showGroupProgress ? (
                <LedText variant="bodySmall" color="predawn">
                  {groupAnswered}/{group.questions.length}
                </LedText>
              ) : null}
            </View>

            <View style={styles.groupQuestions}>
              {group.questions.map((question) => {
                const value = answers[question.id];
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
                        onChange={(next) => onAnswerChange(question.id, next)}
                      />
                    ) : (
                      <WeeklyCheckinEnumPicker
                        value={typeof value === 'string' ? value : undefined}
                        options={question.options ?? []}
                        onChange={(next) => onAnswerChange(question.id, next)}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </>
  );
}

export function buildWeeklyCheckinQuestionGroups(questions: WeeklyCheckinQuestion[]) {
  return buildQuestionGroups(questions);
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
    const highestOptionScore = Math.max(
      1,
      ...(question.options ?? []).map((option) => option.score ?? 0),
    );
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
});
