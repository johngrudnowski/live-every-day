import type { WeeklyCheckinDefinition, WeeklyCheckinQuestion } from '../api/weekly-checkin-queries';

export type WeeklyCheckinScore = {
  total: number;
  max: number;
  numericTotal: number;
  enumTotal: number;
  percent: number;
};

export function calculateWeeklyCheckinScore(
  definition: WeeklyCheckinDefinition,
  answers: Record<string, unknown>,
): WeeklyCheckinScore {
  let numericTotal = 0;
  let enumTotal = 0;
  let max = 0;

  for (const question of definition.questions) {
    if (question.kind === 'number_scale') {
      max += question.max ?? 10;
      const value = answers[question.id];
      if (typeof value === 'number') {
        numericTotal += value;
      }
      continue;
    }

    if (question.kind === 'enum') {
      const highestOptionScore = Math.max(
        ...(question.options ?? []).map((option) => option.score ?? 0),
      );
      max += highestOptionScore;
      const value = answers[question.id];
      const option = (question.options ?? []).find((item) => item.value === value);
      enumTotal += option?.score ?? 0;
    }
  }

  return {
    total: numericTotal + enumTotal,
    max,
    numericTotal,
    enumTotal,
    percent: getPercent(numericTotal + enumTotal, max),
  };
}

export function isQuestionAnswered(
  question: WeeklyCheckinQuestion,
  answers: Record<string, unknown>,
) {
  const value = answers[question.id];
  return value !== undefined && value !== null && value !== '';
}

function getPercent(total: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((total / max) * 100)));
}
