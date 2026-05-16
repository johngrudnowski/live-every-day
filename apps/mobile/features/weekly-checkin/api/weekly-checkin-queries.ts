import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  customFetch,
  getWeeklyCheckinsControllerGetCheckinQueryKey,
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
  history: ['/api/me/weekly-checkin/history'] as const,
  detail: (checkinId: string) => getWeeklyCheckinsControllerGetCheckinQueryKey(checkinId),
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

export function useWeeklyCheckinHistoryQuery(enabled = true) {
  return useQuery({
    queryKey: weeklyCheckinQueryKeys.history,
    enabled,
    queryFn: async () => {
      const response = await customFetch<{ data: WeeklyCheckin[]; status: 200 }>(
        '/api/me/weekly-checkin/history',
        { method: 'GET' },
      );
      return response.data;
    },
  });
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

export function useUpdateWeeklyCheckinMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checkinId,
      data,
    }: {
      checkinId: string;
      data: SubmitWeeklyCheckinDto;
    }) => {
      return await customFetch<{ data: WeeklyCheckin; status: 200 }>(
        `/api/me/weekly-checkin/${checkinId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );
    },
    onSuccess: (response, variables) => {
      queryClient.setQueryData(weeklyCheckinQueryKeys.detail(variables.checkinId), response);
      void queryClient.invalidateQueries({ queryKey: weeklyCheckinQueryKeys.summary });
      void queryClient.invalidateQueries({ queryKey: weeklyCheckinQueryKeys.history });
    },
  });
}

export type SaveWeeklyCheckinDraftInput = SaveWeeklyCheckinDraftDto;
export type SubmitWeeklyCheckinInput = SubmitWeeklyCheckinDto;
