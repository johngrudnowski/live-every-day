import { useQueryClient } from '@tanstack/react-query';
import {
  getConditionsControllerGetSummaryQueryKey,
  useConditionsControllerGetCondition,
  useConditionsControllerGetSummary,
  useConditionsControllerListConditions,
  useConditionsControllerSaveProfile,
  useConditionsControllerSkipOnboarding,
  type ConditionDefinitionDto,
  type ConditionRegistryItemDto,
  type ConditionSummaryDto,
  type SaveConditionProfileDto,
} from '@led/api-client';
import type { ConditionDefinition, ConditionRegistryItem, SemanticValue } from '@led/conditions';

export type ConditionSummary = ConditionSummaryDto;

export type SaveConditionProfileInput = {
  conditionId: string;
  conditionDefinitionVersion: number;
  values: Record<string, SemanticValue>;
};

export const conditionQueryKeys = {
  summary: getConditionsControllerGetSummaryQueryKey(),
};

export function useConditionRegistryQuery() {
  const queryClient = useQueryClient();

  return useConditionsControllerListConditions<ConditionRegistryItem[]>(
    {
      query: {
        select: (response) => response.data.map(mapRegistryItem),
      },
    },
    queryClient,
  );
}

export function useConditionDefinitionQuery(conditionId: string) {
  const queryClient = useQueryClient();

  return useConditionsControllerGetCondition<ConditionDefinition>(
    conditionId,
    {
      query: {
        enabled: conditionId.length > 0,
        select: (response) => mapConditionDefinition(response.data),
      },
    },
    queryClient,
  );
}

export function useConditionSummaryQuery(enabled = true) {
  const queryClient = useQueryClient();

  return useConditionsControllerGetSummary<ConditionSummary>(
    {
      query: {
        enabled,
        select: (response) => response.data,
      },
    },
    queryClient,
  );
}

export function useSkipConditionOnboardingMutation() {
  const queryClient = useQueryClient();

  return useConditionsControllerSkipOnboarding(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(conditionQueryKeys.summary, response.data);
        },
      },
    },
    queryClient,
  );
}

export function useSaveConditionProfileMutation() {
  const queryClient = useQueryClient();

  const mutation = useConditionsControllerSaveProfile(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(conditionQueryKeys.summary, response.data);
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (input: SaveConditionProfileInput) =>
      mutation.mutate({
        conditionId: input.conditionId,
        data: mapSaveConditionProfileInput(input),
      }),
    mutateAsync: (input: SaveConditionProfileInput) =>
      mutation.mutateAsync({
        conditionId: input.conditionId,
        data: mapSaveConditionProfileInput(input),
      }),
  };
}

function mapRegistryItem(item: ConditionRegistryItemDto): ConditionRegistryItem {
  return {
    id: item.id as ConditionRegistryItem['id'],
    version: item.version,
    label: item.label,
    subtitle: item.subtitle,
    status: item.status,
  };
}

function mapConditionDefinition(definition: ConditionDefinitionDto): ConditionDefinition {
  return definition as unknown as ConditionDefinition;
}

function mapSaveConditionProfileInput(input: SaveConditionProfileInput): SaveConditionProfileDto {
  return {
    conditionDefinitionVersion: input.conditionDefinitionVersion,
    values: input.values,
  };
}
