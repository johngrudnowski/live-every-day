type WeeklyCheckinFlowAction =
  | { type: 'set_answer'; questionId: string; value: unknown }
  | { type: 'set_answers'; answers: Record<string, unknown> };

export type WeeklyCheckinFlowState = {
  answers: Record<string, unknown>;
};

export function createWeeklyCheckinFlowState(
  answers: Record<string, unknown> = {},
): WeeklyCheckinFlowState {
  return { answers };
}

export function weeklyCheckinReducer(
  state: WeeklyCheckinFlowState,
  action: WeeklyCheckinFlowAction,
): WeeklyCheckinFlowState {
  if (action.type === 'set_answers') {
    return {
      answers: action.answers,
    };
  }

  return {
    ...state,
    answers: {
      ...state.answers,
      [action.questionId]: action.value,
    },
  };
}
