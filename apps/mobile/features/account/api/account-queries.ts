import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAccountControllerDeleteCurrentUser } from '@led/api-client';

import { authClient } from '@/features/auth/lib/auth-client';

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
