import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  AdminEventItem,
  CreateEventPayload,
  UpdateEventPayload,
  CreateSchedulePayload,
  GenerateSeatMapPayload,
} from '../types';
import { ADMIN_EVENTS_QUERY_KEY } from './useAdminEventsQuery';
import { ADMIN_EVENT_DETAIL_QUERY_KEY } from './useAdminEventDetailQuery';

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminEventItem, Error, CreateEventPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ApiResponse<AdminEventItem>>('/admin/events', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_QUERY_KEY });
    },
  });
}

export function useUpdateEventMutation(id?: number) {
  const queryClient = useQueryClient();

  return useMutation<AdminEventItem, Error, { id: number; data: UpdateEventPayload }>({
    mutationFn: async ({ id: eventId, data }) => {
      const response = await apiClient.put<ApiResponse<AdminEventItem>>(
        `/admin/events/${eventId}`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_EVENT_DETAIL_QUERY_KEY, variables.id] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [...ADMIN_EVENT_DETAIL_QUERY_KEY, id] });
      }
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ id: number }, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/events/${id}`);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_QUERY_KEY });
    },
  });
}

export function useCreateScheduleMutation(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, CreateSchedulePayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post(`/admin/events/${eventId}/schedules`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_EVENT_DETAIL_QUERY_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_QUERY_KEY });
    },
  });
}

export function useGenerateSeatMapMutation(scheduleId: number) {
  return useMutation<
    { schedule_id: number; generated_count: number },
    Error,
    GenerateSeatMapPayload
  >({
    mutationFn: async (payload) => {
      const response = await apiClient.post<
        ApiResponse<{ schedule_id: number; generated_count: number }>
      >(`/admin/schedules/${scheduleId}/seats/generate`, payload);
      return response.data.data;
    },
  });
}
