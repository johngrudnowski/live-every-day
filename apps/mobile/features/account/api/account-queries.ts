import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customFetch, useAccountControllerDeleteCurrentUser } from '@led/api-client';

import { authClient } from '@/features/auth/lib/auth-client';

export type CircleStateTone = 'active' | 'attention' | 'muted';

export type CirclePermission = {
  key: string;
  label: string;
  category: string;
};

export type CircleSupportPerson = {
  id: string;
  displayName: string;
  initials: string | null;
  relationship: string | null;
  role: string;
  inviteStatus: string;
  stateLabel: string;
  stateTone: CircleStateTone;
  detailLine: string;
  permissions: CirclePermission[];
  linkedUserId: string | null;
  sortOrder: number;
};

export type CircleCareTeamPerson = {
  id: string;
  displayName: string;
  initials: string | null;
  role: string;
  specialty: string | null;
  organization: string | null;
  connectionStatus: string;
  stateLabel: string;
  stateTone: CircleStateTone;
  detailLine: string;
  nextAppointmentAt: string | null;
  providerUserId: string | null;
  sortOrder: number;
};

export type MyCircle = {
  supportPeople: CircleSupportPerson[];
  careTeamPeople: CircleCareTeamPerson[];
};

export const accountQueryKeys = {
  myCircle: ['/api/me/circle'] as const,
};

export function useMyCircleQuery(enabled = true) {
  return useQuery({
    queryKey: accountQueryKeys.myCircle,
    enabled,
    queryFn: async () => {
      const response = await customFetch<{ data: MyCircle; status: 200 }>('/api/me/circle', {
        method: 'GET',
      });

      return response.data;
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();

  return useAccountControllerDeleteCurrentUser(
    {
      mutation: {
        onSuccess: async () => {
          await authClient.signOut().catch(() => undefined);
          queryClient.clear();
          router.replace('/auth/login');
        },
      },
    },
    queryClient,
  );
}
