import { useQueryClient } from '@tanstack/react-query';
import {
  getCircleControllerGetAppointmentsQueryKey,
  useCircleControllerCreateAppointment,
  useCircleControllerGetAppointments,
  useCircleControllerRemoveAppointment,
  useCircleControllerUpdateAppointment,
  type CircleAppointmentDto,
  type SaveCircleAppointmentDto,
} from '@led/api-client';

export type Appointment = Omit<CircleAppointmentDto, 'careTeamSpecialty' | 'location' | 'notes'> & {
  careTeamSpecialty: string | null;
  location: string | null;
  notes: string | null;
};

export type SaveAppointmentInput = SaveCircleAppointmentDto;

export type UpdateAppointmentInput = SaveAppointmentInput & {
  appointmentId: string;
};

export const appointmentQueryKeys = {
  appointments: getCircleControllerGetAppointmentsQueryKey(),
};

export function useAppointmentsQuery(enabled = true) {
  const queryClient = useQueryClient();

  return useCircleControllerGetAppointments<Appointment[]>(
    {
      query: {
        enabled,
        select: (response) => response.data as Appointment[],
      },
    },
    queryClient,
  );
}

export function useCreateAppointmentMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerCreateAppointment(
    {
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.appointments });
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (input: SaveAppointmentInput, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate({ data: input }, options),
    mutateAsync: (
      input: SaveAppointmentInput,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync({ data: input }, options),
  };
}

export function useUpdateAppointmentMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerUpdateAppointment(
    {
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.appointments });
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (input: UpdateAppointmentInput, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate(
        {
          appointmentId: input.appointmentId,
          data: mapSaveInput(input),
        },
        options,
      ),
    mutateAsync: (
      input: UpdateAppointmentInput,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) =>
      mutation.mutateAsync(
        {
          appointmentId: input.appointmentId,
          data: mapSaveInput(input),
        },
        options,
      ),
  };
}

export function useRemoveAppointmentMutation() {
  const queryClient = useQueryClient();
  const mutation = useCircleControllerRemoveAppointment(
    {
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.appointments });
        },
      },
    },
    queryClient,
  );

  return {
    ...mutation,
    mutate: (appointmentId: string, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate({ appointmentId }, options),
    mutateAsync: (appointmentId: string, options?: Parameters<typeof mutation.mutateAsync>[1]) =>
      mutation.mutateAsync({ appointmentId }, options),
  };
}

export function getUpcomingAppointment(appointments: Appointment[], now = new Date()) {
  return (
    appointments
      .filter((appointment) => new Date(appointment.scheduledAt).getTime() >= now.getTime())
      .sort(
        (left, right) =>
          new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
      )[0] ?? null
  );
}

function mapSaveInput({
  appointmentId: _appointmentId,
  ...input
}: UpdateAppointmentInput): SaveAppointmentInput {
  return input;
}
