import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import {
  getHealthDataControllerGetDailySummaryQueryKey,
  getHealthDataControllerGetLatestObservationsQueryKey,
  getHealthDataControllerGetObservationHistoryQueryKey,
  useHealthDataControllerGetDailySummary,
  useHealthDataControllerGetLatestObservations,
  useHealthDataControllerGetObservationHistory,
  type DailyHealthSummaryDto,
  type HealthDataControllerGetDailySummaryParams,
  type HealthDataControllerGetLatestObservationsParams,
  type HealthDataControllerGetObservationHistoryParams,
  type HealthObservationListDto,
} from '@led/api-client';

export type DailyHealthSummary = DailyHealthSummaryDto;
export type HealthObservationList = HealthObservationListDto;

export type DailySummaryParams = HealthDataControllerGetDailySummaryParams;
export type ObservationHistoryParams = HealthDataControllerGetObservationHistoryParams;
export type LatestObservationsParams = HealthDataControllerGetLatestObservationsParams;

export const healthDataQueryKeys = {
  dailySummary: (params: DailySummaryParams) =>
    getHealthDataControllerGetDailySummaryQueryKey(params),
  observationHistory: (params: ObservationHistoryParams) =>
    getHealthDataControllerGetObservationHistoryQueryKey(params),
  latestObservations: (params?: LatestObservationsParams) =>
    getHealthDataControllerGetLatestObservationsQueryKey(params),
};

export function useDailyHealthSummaryQuery(params: DailySummaryParams, enabled = true) {
  const queryClient = useQueryClient();

  return useHealthDataControllerGetDailySummary<DailyHealthSummary>(
    params,
    {
      query: {
        enabled,
        placeholderData: keepPreviousData,
        select: (response) => response.data,
      },
    },
    queryClient,
  );
}

export function useObservationHistoryQuery(params: ObservationHistoryParams, enabled = true) {
  const queryClient = useQueryClient();

  return useHealthDataControllerGetObservationHistory<HealthObservationList>(
    params,
    {
      query: {
        enabled,
        placeholderData: keepPreviousData,
        select: (response) => response.data,
      },
    },
    queryClient,
  );
}

export function useLatestObservationsQuery(params: LatestObservationsParams, enabled = true) {
  const queryClient = useQueryClient();

  return useHealthDataControllerGetLatestObservations<HealthObservationList>(
    params,
    {
      query: {
        enabled,
        placeholderData: keepPreviousData,
        select: (response) => response.data,
      },
    },
    queryClient,
  );
}
