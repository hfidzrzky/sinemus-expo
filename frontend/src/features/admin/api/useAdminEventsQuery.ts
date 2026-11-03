import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { PaginatedApiResponse } from '@/types/api';
import type { AdminEventItem } from '../types';

export const ADMIN_EVENTS_QUERY_KEY = ['admin', 'events', 'list'] as const;

export interface AdminEventsFilterParams {
  search?: string;
  type?: 'all' | 'regular' | 'presale_cinema';
  event_type?: 'all' | 'regular' | 'presale_cinema';
  status?: 'all' | 'published' | 'draft';
  city?: string;
  per_page?: number;
}

export async function fetchAdminEvents(
  params?: AdminEventsFilterParams
): Promise<AdminEventItem[]> {
  const queryParams: Record<string, string> = {};
  if (params?.search?.trim()) queryParams.search = params.search.trim();

  const selectedType = params?.event_type ?? params?.type;
  if (selectedType && selectedType !== 'all') {
    queryParams.event_type = selectedType;
    queryParams.type = selectedType;
  }

  if (params?.status && params.status !== 'all') queryParams.status = params.status;
  if (params?.city && params.city !== 'all') queryParams.city = params.city;
  if (params?.per_page) queryParams.per_page = String(params.per_page);

  const response = await apiClient.get<PaginatedApiResponse<AdminEventItem>>('/admin/events', {
    params: queryParams,
  });

  const rawData = response.data?.data;
  if (Array.isArray(rawData)) {
    return rawData;
  }
  if (
    rawData &&
    typeof rawData === 'object' &&
    Array.isArray((rawData as unknown as { data?: AdminEventItem[] }).data)
  ) {
    return (rawData as unknown as { data: AdminEventItem[] }).data;
  }
  return [];
}

export function useAdminEventsQuery(
  params?: AdminEventsFilterParams,
  enabled = true
): UseQueryResult<AdminEventItem[], Error> {
  return useQuery({
    queryKey: [...ADMIN_EVENTS_QUERY_KEY, params],
    queryFn: () => fetchAdminEvents(params),
    enabled,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });
}
