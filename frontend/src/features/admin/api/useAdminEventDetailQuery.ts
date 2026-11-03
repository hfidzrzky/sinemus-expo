import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminEventItem } from '../types';

export const ADMIN_EVENT_DETAIL_QUERY_KEY = ['admin', 'events', 'detail'] as const;

export async function fetchAdminEventDetail(id: number): Promise<AdminEventItem> {
  const response = await apiClient.get<ApiResponse<AdminEventItem>>(`/admin/events/${id}`);
  return response.data.data;
}

export function useAdminEventDetailQuery(
  id?: number,
  enabled = true
): UseQueryResult<AdminEventItem, Error> {
  return useQuery({
    queryKey: [...ADMIN_EVENT_DETAIL_QUERY_KEY, id],
    queryFn: () => {
      if (!id) throw new Error('ID Event tidak valid');
      return fetchAdminEventDetail(id);
    },
    enabled: Boolean(id && enabled),
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });
}
