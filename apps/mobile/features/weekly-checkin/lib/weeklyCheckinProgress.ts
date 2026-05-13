import type {
  WeeklyCheckinDefinition,
  WeeklyCheckinQuestion,
  WeeklyCheckinSummary,
} from '../api/weekly-checkin-queries';
import { isQuestionAnswered } from './weeklyCheckinScoring';

export function getCurrentAnswers(summary: WeeklyCheckinSummary | undefined) {
  return summary?.currentCheckin?.answers ?? {};
}

export function getNextQuestionIndex(
  definition: WeeklyCheckinDefinition,
  answers: Record<string, unknown>,
) {
  const index = definition.questions.findIndex(
    (question) => question.required && !isQuestionAnswered(question, answers),
  );

  return index >= 0 ? index : 0;
}

export function getQuestionByIndex(definition: WeeklyCheckinDefinition, index: number) {
  return definition.questions[index] ?? null;
}

export function getAnswerLabel(question: WeeklyCheckinQuestion, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return 'Not answered';
  }

  if (question.kind === 'enum') {
    return question.options?.find((option) => option.value === value)?.label ?? String(value);
  }

  return String(value);
}
