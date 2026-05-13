import { useConditionSummaryQuery } from '../api/condition-queries';

export function useConditionGate(enabled: boolean) {
  const summaryQuery = useConditionSummaryQuery(enabled);
  const summary = summaryQuery.data;
  const draftProfile = summary?.draftConditionProfile;
  const draftResumeStepId = getDraftResumeStepId(draftProfile?.profile);
  const shouldResumeCondition =
    enabled &&
    summaryQuery.isSuccess &&
    Boolean(summary) &&
    !summary?.hasConditionProfile &&
    Boolean(draftProfile) &&
    !summary?.onboarding.skippedAt;
  const shouldSelectCondition =
    enabled &&
    summaryQuery.isSuccess &&
    Boolean(summary) &&
    !summary?.hasConditionProfile &&
    !draftProfile &&
    !summary?.onboarding.skippedAt;

  return {
    ...summaryQuery,
    draftProfile,
    draftResumeStepId,
    shouldResumeCondition,
    shouldSelectCondition,
  };
}

function getDraftResumeStepId(profile: unknown) {
  if (!profile || typeof profile !== 'object' || !('onboarding' in profile)) {
    return undefined;
  }

  const onboarding = (profile as { onboarding?: unknown }).onboarding;
  if (!onboarding || typeof onboarding !== 'object' || !('currentStepId' in onboarding)) {
    return undefined;
  }

  const currentStepId = (onboarding as { currentStepId?: unknown }).currentStepId;
  return typeof currentStepId === 'string' ? currentStepId : undefined;
}
