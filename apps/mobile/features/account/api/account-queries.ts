import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  getCircleControllerGetMyCircleQueryKey,
  getCircleControllerGetPermissionDefinitionsQueryKey,
  useAccountControllerDeleteCurrentUser,
  useCircleControllerCancelSupportInvitation,
  useCircleControllerCreateCareTeamPerson,
  useCircleControllerDemoteSupportPerson,
  useCircleControllerGetMyCircle,
  useCircleControllerGetPermissionDefinitions,
  useCircleControllerPromoteSupportPerson,
  useCircleControllerRemoveCareTeamPerson,
  useCircleControllerRemoveSupportPerson,
  useCircleControllerUpdateCareTeamPerson,
  useCircleControllerUpdateSupportPermissions,
  useCircleControllerUpdateSupportPerson,
  type CircleCareTeamPersonDto,
  type CirclePermissionDefinitionDto,
  type CirclePermissionDto,
  type CircleSupportPersonDto,
  type MyCircleDto,
  type SaveCircleCareTeamPersonDto,
} from '@led/api-client';

import { authClient } from '@/features/auth/lib/auth-client';

export type CircleStateTone = 'active' | 'attention' | 'muted';
export type CirclePermission = CirclePermissionDto;
export type CirclePermissionDefinition = Omit<CirclePermissionDefinitionDto, 'description'> & {
  description: string | null;
};
export type CircleSupportPerson = Omit<
  CircleSupportPersonDto,
  'initials' | 'relationship' | 'linkedUserId' | 'permissions' | 'stateTone'
> & {
  initials: string | null;
  relationship: string | null;
  linkedUserId: string | null;
  permissions: CirclePermission[];
  stateTone: CircleStateTone;
};
export type CircleCareTeamPerson = Omit<
  CircleCareTeamPersonDto,
  | 'initials'
  | 'specialty'
  | 'organization'
  | 'address'
  | 'phoneNumber'
  | 'nextAppointmentAt'
  | 'providerUserId'
  | 'stateTone'
> & {
  initials: string | null;
  specialty: string | null;
  organization: string | null;
  address: string | null;
  phoneNumber: string | null;
  nextAppointmentAt: string | null;
  providerUserId: string | null;
  stateTone: CircleStateTone;
};
export type MyCircle = Omit<MyCircleDto, 'supportPeople' | 'careTeamPeople'> & {
  supportPeople: CircleSupportPerson[];
  careTeamPeople: CircleCareTeamPerson[];
};

export type UpdateCircleSupportPersonInput = {
  supportPersonId: string;
  displayName: string;
};

export type UpdateCircleSupportPermissionsInput = {
  supportPersonId: string;
  permissionKeys: string[];
};

export type SaveCircleCareTeamPersonInput = SaveCircleCareTeamPersonDto;

export type UpdateCircleCareTeamPersonInput = SaveCircleCareTeamPersonInput & {
  careTeamPersonId: string;
};

export const accountQueryKeys = {
  myCircle: getCircleControllerGetMyCircleQueryKey(),
  circlePermissions: getCircleControllerGetPermissionDefinitionsQueryKey(),
};

export function useMyCircleQuery(enabled = true) {
  const queryClient = useQueryClient();

  return useCircleControllerGetMyCircle<MyCircle>(
    {
      query: {
        enabled,
        select: (response) => response.data as MyCircle,
      },
    },
    queryClient,
  );
}

export function useCirclePermissionDefinitionsQuery(enabled = true) {
  const queryClient = useQueryClient();

  return useCircleControllerGetPermissionDefinitions<CirclePermissionDefinition[]>(
    {
      query: {
        enabled,
        select: (response) => response.data as CirclePermissionDefinition[],
      },
    },
    queryClient,
  );
}

export function useUpdateCircleSupportPersonMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerUpdateSupportPerson(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(accountQueryKeys.myCircle, response);
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (
      input: UpdateCircleSupportPersonInput,
      options?: Parameters<typeof mutation.mutate>[1],
    ) =>
      mutation.mutate(
        {
          supportPersonId: input.supportPersonId,
          data: { displayName: input.displayName },
        },
        options,
      ),
    mutateAsync: (
      input: UpdateCircleSupportPersonInput,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) =>
      mutation.mutateAsync(
        {
          supportPersonId: input.supportPersonId,
          data: { displayName: input.displayName },
        },
        options,
      ),
  };
}

export function useUpdateCircleSupportPermissionsMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerUpdateSupportPermissions(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(accountQueryKeys.myCircle, response);
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (
      input: UpdateCircleSupportPermissionsInput,
      options?: Parameters<typeof mutation.mutate>[1],
    ) =>
      mutation.mutate(
        {
          supportPersonId: input.supportPersonId,
          data: { permissionKeys: input.permissionKeys },
        },
        options,
      ),
    mutateAsync: (
      input: UpdateCircleSupportPermissionsInput,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) =>
      mutation.mutateAsync(
        {
          supportPersonId: input.supportPersonId,
          data: { permissionKeys: input.permissionKeys },
        },
        options,
      ),
  };
}

export function useCancelCircleSupportInvitationMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerCancelSupportInvitation(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(accountQueryKeys.myCircle, response);
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (supportPersonId: string, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate({ supportPersonId }, options),
    mutateAsync: (supportPersonId: string, options?: Parameters<typeof mutation.mutateAsync>[1]) =>
      mutation.mutateAsync({ supportPersonId }, options),
  };
}

export function usePromoteCircleSupportPersonMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerPromoteSupportPerson(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(accountQueryKeys.myCircle, response);
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (supportPersonId: string, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate({ supportPersonId }, options),
    mutateAsync: (supportPersonId: string, options?: Parameters<typeof mutation.mutateAsync>[1]) =>
      mutation.mutateAsync({ supportPersonId }, options),
  };
}

export function useDemoteCircleSupportPersonMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerDemoteSupportPerson(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(accountQueryKeys.myCircle, response);
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (supportPersonId: string, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate({ supportPersonId }, options),
    mutateAsync: (supportPersonId: string, options?: Parameters<typeof mutation.mutateAsync>[1]) =>
      mutation.mutateAsync({ supportPersonId }, options),
  };
}

export function useRemoveCircleSupportPersonMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerRemoveSupportPerson(
    {
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: accountQueryKeys.myCircle });
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (supportPersonId: string, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate({ supportPersonId }, options),
    mutateAsync: (supportPersonId: string, options?: Parameters<typeof mutation.mutateAsync>[1]) =>
      mutation.mutateAsync({ supportPersonId }, options),
  };
}

export function useCreateCircleCareTeamPersonMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerCreateCareTeamPerson(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(accountQueryKeys.myCircle, response);
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (
      input: SaveCircleCareTeamPersonInput,
      options?: Parameters<typeof mutation.mutate>[1],
    ) => mutation.mutate({ data: input }, options),
    mutateAsync: (
      input: SaveCircleCareTeamPersonInput,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync({ data: input }, options),
  };
}

export function useUpdateCircleCareTeamPersonMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerUpdateCareTeamPerson(
    {
      mutation: {
        onSuccess: (response) => {
          queryClient.setQueryData(accountQueryKeys.myCircle, response);
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (
      input: UpdateCircleCareTeamPersonInput,
      options?: Parameters<typeof mutation.mutate>[1],
    ) =>
      mutation.mutate(
        {
          careTeamPersonId: input.careTeamPersonId,
          data: mapSaveCircleCareTeamPersonInput(input),
        },
        options,
      ),
    mutateAsync: (
      input: UpdateCircleCareTeamPersonInput,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) =>
      mutation.mutateAsync(
        {
          careTeamPersonId: input.careTeamPersonId,
          data: mapSaveCircleCareTeamPersonInput(input),
        },
        options,
      ),
  };
}

export function useRemoveCircleCareTeamPersonMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerRemoveCareTeamPerson(
    {
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: accountQueryKeys.myCircle });
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (careTeamPersonId: string, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate({ careTeamPersonId }, options),
    mutateAsync: (careTeamPersonId: string, options?: Parameters<typeof mutation.mutateAsync>[1]) =>
      mutation.mutateAsync({ careTeamPersonId }, options),
  };
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

function mapSaveCircleCareTeamPersonInput({
  careTeamPersonId: _careTeamPersonId,
  ...input
}: UpdateCircleCareTeamPersonInput): SaveCircleCareTeamPersonInput {
  return input;
}
