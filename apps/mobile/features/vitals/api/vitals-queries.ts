import { useQueryClient } from '@tanstack/react-query';
import {
  getVitalsControllerGetLatestReadingQueryKey,
  useVitalsControllerGetLatestReading,
  useVitalsControllerSaveReading,
  type LatestVitalReadingDto,
  type SaveVitalReadingDto,
  type VitalReadingDto,
} from '@led/api-client';

export type LatestVitalReading = LatestVitalReadingDto;
export type VitalReading = VitalReadingDto;
export type SaveVitalReadingInput = SaveVitalReadingDto;

export const vitalsQueryKeys = {
  latest: getVitalsControllerGetLatestReadingQueryKey(),
};

export function useLatestVitalReadingQuery(enabled = true) {
  const queryClient = useQueryClient();

  return useVitalsControllerGetLatestReading<LatestVitalReading>(
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

  return useVitalsControllerSaveReading(
    {
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: vitalsQueryKeys.latest });
        },
      },
    },
    queryClient,
  );
}
