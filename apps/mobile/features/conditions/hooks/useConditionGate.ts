import { useConditionSummaryQuery } from '../api/condition-queries';

export function useConditionGate(enabled: boolean) {
  const summaryQuery = useConditionSummaryQuery(enabled);
  const summary = summaryQuery.data;
  const shouldSelectCondition =
    enabled &&
    summaryQuery.isSuccess &&
    !summary?.hasConditionProfile &&
    !summary?.onboarding.skippedAt;

  return {
    ...summaryQuery,
    shouldSelectCondition,
  };
}
