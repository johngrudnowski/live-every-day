import { useQueryClient } from '@tanstack/react-query';
import {
  getHealthDataControllerGetLatestObservationsQueryKey,
  getHealthImportsControllerGetImportQueryKey,
  getHealthImportsControllerListImportsQueryKey,
  useHealthImportsControllerAcceptCandidates,
  useHealthImportsControllerCreateManualLabImport,
  useHealthImportsControllerGetImport,
  useHealthImportsControllerRejectCandidates,
  useHealthImportsControllerUpdateCandidate,
  type CreateManualLabImportDto,
  type HealthImportCandidateDto,
  type HealthImportDto,
  type HealthImportListDto,
  type ReviewHealthImportCandidatesDto,
  type UpdateHealthImportCandidateDto,
} from '@led/api-client';

export type CreateManualLabImportInput = CreateManualLabImportDto;
export type HealthImport = HealthImportDto;
export type HealthImportList = HealthImportListDto;
export type HealthImportCandidate = HealthImportCandidateDto;
export type ReviewHealthImportInput = ReviewHealthImportCandidatesDto;
export type UpdateHealthImportCandidateInput = UpdateHealthImportCandidateDto;

export const healthImportQueryKeys = {
  list: getHealthImportsControllerListImportsQueryKey(),
  detail: (jobId: string) => getHealthImportsControllerGetImportQueryKey(jobId),
};

export function useHealthImportQuery(
  jobId: string | undefined,
  enabled = true,
) {
  const queryClient = useQueryClient();

  return useHealthImportsControllerGetImport<HealthImport>(
    jobId ?? '',
    {
      query: {
        enabled: enabled && Boolean(jobId),
        select: (response) => response.data,
      },
    },
    queryClient,
  );
}

export function useCreateManualLabImportMutation() {
  const queryClient = useQueryClient();

  return useHealthImportsControllerCreateManualLabImport(
    {
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: healthImportQueryKeys.list,
          });
        },
      },
    },
    queryClient,
  );
}

export function useUpdateHealthImportCandidateMutation() {
  const queryClient = useQueryClient();

  return useHealthImportsControllerUpdateCandidate(
    {
      mutation: {
        onSuccess: async (response) => {
          await queryClient.setQueryData(
            healthImportQueryKeys.detail(response.data.job.id),
            response,
          );
        },
      },
    },
    queryClient,
  );
}

export function useAcceptHealthImportCandidatesMutation() {
  const queryClient = useQueryClient();

  return useHealthImportsControllerAcceptCandidates(
    {
      mutation: {
        onSuccess: async (response) => {
          await Promise.all([
            queryClient.setQueryData(
              healthImportQueryKeys.detail(response.data.job.id),
              response,
            ),
            queryClient.invalidateQueries({
              queryKey: healthImportQueryKeys.list,
            }),
            queryClient.invalidateQueries({
              queryKey: getHealthDataControllerGetLatestObservationsQueryKey(),
            }),
          ]);
        },
      },
    },
    queryClient,
  );
}

export function useRejectHealthImportCandidatesMutation() {
  const queryClient = useQueryClient();

  return useHealthImportsControllerRejectCandidates(
    {
      mutation: {
        onSuccess: async (response) => {
          await Promise.all([
            queryClient.setQueryData(
              healthImportQueryKeys.detail(response.data.job.id),
              response,
            ),
            queryClient.invalidateQueries({
              queryKey: healthImportQueryKeys.list,
            }),
          ]);
        },
      },
    },
    queryClient,
  );
}
