import { useLocalSearchParams } from 'expo-router';
import type { SemanticValue } from '@led/conditions';

import { useConditionSummaryQuery } from '@/features/conditions/api/condition-queries';
import { ConditionFlowRenderer } from '@/features/conditions/components/ConditionFlowRenderer';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';

export default function ConditionDetailRoute() {
  const params = useLocalSearchParams<{ conditionId: string; stepId?: string; mode?: string }>();
  const isAccountMode = params.mode === 'account';
  const shouldLoadProfile = isAccountMode || Boolean(params.stepId);
  const summaryQuery = useConditionSummaryQuery(shouldLoadProfile);
  const profile = isAccountMode
    ? (summaryQuery.data?.activeConditionProfile ?? summaryQuery.data?.draftConditionProfile)
    : summaryQuery.data?.draftConditionProfile;

  if (shouldLoadProfile && summaryQuery.isPending) {
    return <LoadingScreen message="Loading health profile" />;
  }

  return (
    <ConditionFlowRenderer
      conditionId={params.conditionId ?? ''}
      initialStepId={params.stepId ?? getProfileStepId(profile?.profile)}
      initialValues={getProfileValues(profile?.profile)}
      mode={isAccountMode ? 'account' : 'onboarding'}
    />
  );
}

function getProfileValues(profile: unknown): Record<string, SemanticValue> | undefined {
  if (!profile || typeof profile !== 'object' || !('values' in profile)) {
    return undefined;
  }

  const values = (profile as { values?: unknown }).values;
  return values && typeof values === 'object' && !Array.isArray(values)
    ? (values as Record<string, SemanticValue>)
    : undefined;
}

function getProfileStepId(profile: unknown): string | undefined {
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
