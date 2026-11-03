import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { TicketItem, TicketFilterStatus } from '../types';

export const MY_TICKETS_QUERY_KEY = ['user', 'tickets'] as const;

export async function fetchMyTickets(status?: TicketFilterStatus): Promise<TicketItem[]> {
  const params: Record<string, string> = {};
  if (status && status !== 'all') {
    params.status = status;
  }

  const response = await apiClient.get<ApiResponse<TicketItem[]>>('/user/tickets', {
    params,
  });

  return response.data.data;
}

export function useMyTicketsQuery(
  status: TicketFilterStatus = 'all',
  enabled = true
): UseQueryResult<TicketItem[], Error> {
  return useQuery({
    queryKey: [...MY_TICKETS_QUERY_KEY, status],
    queryFn: () => fetchMyTickets(status),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
}
