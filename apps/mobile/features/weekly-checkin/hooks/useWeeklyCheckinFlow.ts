import { useMemo, useReducer } from 'react';
import type { WeeklyCheckinDefinition } from '../api/weekly-checkin-queries';
import { createWeeklyCheckinFlowState, weeklyCheckinReducer } from '../lib/weeklyCheckinReducer';
import { calculateWeeklyCheckinScore } from '../lib/weeklyCheckinScoring';

export function useWeeklyCheckinFlow(
  definition: WeeklyCheckinDefinition,
  initialAnswers: Record<string, unknown> = {},
) {
  const [state, dispatch] = useReducer(
    weeklyCheckinReducer,
    createWeeklyCheckinFlowState(initialAnswers),
  );
  const score = useMemo(
    () => calculateWeeklyCheckinScore(definition, state.answers),
    [definition, state.answers],
  );

  function setAnswer(questionId: string, value: unknown) {
    dispatch({ type: 'set_answer', questionId, value });
  }

  function setAnswers(answers: Record<string, unknown>) {
    dispatch({ type: 'set_answers', answers });
  }

  return {
    answers: state.answers,
    score,
    setAnswer,
    setAnswers,
  };
}
