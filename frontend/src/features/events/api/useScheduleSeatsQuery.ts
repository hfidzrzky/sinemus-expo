import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { ScheduleSeatMap } from '../types';

export const SCHEDULE_SEATS_QUERY_KEY = ['schedules', 'seats'] as const;

export async function fetchScheduleSeats(scheduleId: number): Promise<ScheduleSeatMap> {
  const response = await apiClient.get<ApiResponse<ScheduleSeatMap>>(
    `/schedules/${scheduleId}/seats`
  );
  return response.data.data;
}

export function useScheduleSeatsQuery(
  scheduleId: number | undefined,
  enabled = true
): UseQueryResult<ScheduleSeatMap, Error> {
  return useQuery({
    queryKey: [...SCHEDULE_SEATS_QUERY_KEY, scheduleId],
    queryFn: () => {
      if (!scheduleId) throw new Error('Schedule ID diperlukan.');
      return fetchScheduleSeats(scheduleId);
    },
    enabled: Boolean(scheduleId) && enabled,
    // Polling interval 10s for live seat status if user is in booking view
    refetchInterval: 10000,
    staleTime: 5000,
    retry: 1,
  });
}
