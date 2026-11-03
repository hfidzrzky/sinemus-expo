import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { EventDetail } from '../types';

export const EVENT_DETAIL_QUERY_KEY = ['events', 'detail'] as const;

export async function fetchEventDetail(idOrSlug: string | number): Promise<EventDetail> {
  const response = await apiClient.get<ApiResponse<EventDetail>>(`/events/${idOrSlug}`);
  return response.data.data;
}

export function useEventDetailQuery(
  idOrSlug: string | number | undefined,
  enabled = true
): UseQueryResult<EventDetail, Error> {
  return useQuery({
    queryKey: [...EVENT_DETAIL_QUERY_KEY, idOrSlug],
    queryFn: () => {
      if (!idOrSlug) throw new Error('ID atau slug event diperlukan.');
      return fetchEventDetail(idOrSlug);
    },
    enabled: Boolean(idOrSlug) && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
