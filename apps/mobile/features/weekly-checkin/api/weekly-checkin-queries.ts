import { useQueryClient } from '@tanstack/react-query';
import {
  getWeeklyCheckinsControllerGetSummaryQueryKey,
  useWeeklyCheckinsControllerGetCheckin,
  useWeeklyCheckinsControllerGetCurrent,
  useWeeklyCheckinsControllerGetSummary,
  useWeeklyCheckinsControllerSaveDraft,
  useWeeklyCheckinsControllerSubmit,
  type SaveWeeklyCheckinDraftDto,
  type SubmitWeeklyCheckinDto,
  type WeeklyCheckinDefinitionDto,
  type WeeklyCheckinDto,
  type WeeklyCheckinQuestionDto,
  type WeeklyCheckinSummaryDto,
} from '@led/api-client';

export type WeeklyCheckinDefinition = WeeklyCheckinDefinitionDto;
export type WeeklyCheckinQuestion = WeeklyCheckinQuestionDto;
export type WeeklyCheckin = WeeklyCheckinDto;
export type WeeklyCheckinSummary = WeeklyCheckinSummaryDto;

export const weeklyCheckinQueryKeys = {
  summary: getWeeklyCheckinsControllerGetSummaryQueryKey(),
};

export function useWeeklyCheckinSummaryQuery(enabled = true) {
  const queryClient = useQueryClient();

  return useWeeklyCheckinsControllerGetSummary<WeeklyCheckinSummary>(
    {
      query: {
        enabled,
        select: (response) => response.data,
      },
    },
    queryClient,
  );
}

export function useCurrentWeeklyCheckinQuery(enabled = true) {
  const queryClient = useQueryClient();

  return useWeeklyCheckinsControllerGetCurrent<WeeklyCheckinSummary>(
    {
      query: {
        enabled,
        select: (response) => response.data,
      },
    },
    queryClient,
  );
}

export function useWeeklyCheckinDetailQuery(checkinId: string, enabled = true) {
  const queryClient = useQueryClient();

  return useWeeklyCheckinsControllerGetCheckin<WeeklyCheckin>(
    checkinId,
    {
      query: {
        enabled: enabled && checkinId.length > 0,
        select: (response) => response.data,
      },
    },
    queryClient,
  );
}

export function useSaveWeeklyCheckinDraftMutation() {
  const queryClient = useQueryClient();

  return useWeeklyCheckinsControllerSaveDraft(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(weeklyCheckinQueryKeys.summary, response);
        },
      },
    },
    queryClient,
  );
}

export function useSubmitWeeklyCheckinMutation() {
  const queryClient = useQueryClient();

  return useWeeklyCheckinsControllerSubmit(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(weeklyCheckinQueryKeys.summary, response);
        },
      },
    },
    queryClient,
  );
}

export type SaveWeeklyCheckinDraftInput = SaveWeeklyCheckinDraftDto;
export type SubmitWeeklyCheckinInput = SubmitWeeklyCheckinDto;
