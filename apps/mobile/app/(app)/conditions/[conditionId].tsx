import { useLocalSearchParams } from 'expo-router';

import { ConditionFlowRenderer } from '@/features/conditions/components/ConditionFlowRenderer';

export default function ConditionDetailRoute() {
  const params = useLocalSearchParams<{ conditionId: string }>();
  return <ConditionFlowRenderer conditionId={params.conditionId ?? ''} />;
}
