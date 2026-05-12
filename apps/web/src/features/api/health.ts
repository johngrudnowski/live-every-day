import {
  useHealthControllerGetHealth,
  type HealthControllerGetHealthQueryResult,
  type HealthResponseDto,
} from '@led/api-client';

export type ApiHealth = HealthResponseDto;
export type ApiHealthQueryResult = HealthControllerGetHealthQueryResult;

export function useApiHealth() {
  return useHealthControllerGetHealth();
}
