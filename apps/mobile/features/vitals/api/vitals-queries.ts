import { useQueryClient } from '@tanstack/react-query';
import {
  getHealthDataControllerGetLatestVitalReadingQueryKey,
  getHealthDataControllerGetVitalMetricsSummaryQueryKey,
  useHealthDataControllerGetLatestVitalReading,
  useHealthDataControllerGetVitalMetricsSummary,
  useHealthDataControllerSaveVitalReading,
  type LatestVitalReadingDto,
  type SaveHealthVitalReadingDto,
  type VitalMetricsSummaryDto,
  type VitalReadingDto,
} from '@led/api-client';

export type LatestVitalReading = LatestVitalReadingDto;
export type VitalMetricsSummary = VitalMetricsSummaryDto;
export type VitalReading = VitalReadingDto;
export type SaveVitalReadingInput = SaveHealthVitalReadingDto;

export const vitalsQueryKeys = {
  latest: getHealthDataControllerGetLatestVitalReadingQueryKey(),
  summary: getHealthDataControllerGetVitalMetricsSummaryQueryKey(),
};

export function useLatestVitalReadingQuery(enabled = true) {
  const queryClient = useQueryClient();

  return useHealthDataControllerGetLatestVitalReading<LatestVitalReading>(
    {
      query: {
        enabled,
        select: (response) => response.data,
      },
    },
    queryClient,
  );
}

export function useVitalMetricsSummaryQuery(enabled = true) {
  const queryClient = useQueryClient();

  return useHealthDataControllerGetVitalMetricsSummary<VitalMetricsSummary>(
    {
      query: {
        enabled,
        select: (response) => response.data,
      },
    },
    queryClient,
  );
}

export function useSaveVitalReadingMutation() {
  const queryClient = useQueryClient();

  return useHealthDataControllerSaveVitalReading(
    {
      mutation: {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: vitalsQueryKeys.latest }),
            queryClient.invalidateQueries({ queryKey: vitalsQueryKeys.summary }),
          ]);
        },
      },
    },
    queryClient,
  );
}
