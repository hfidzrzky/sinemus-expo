import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { TicketDetail } from '../types';

export const TICKET_DETAIL_QUERY_KEY = ['user', 'ticket-detail'] as const;

export async function fetchTicketDetail(ticketCode: string): Promise<TicketDetail> {
  const response = await apiClient.get<ApiResponse<TicketDetail>>(`/user/tickets/${ticketCode}`);
  return response.data.data;
}

export function useTicketDetailQuery(
  ticketCode: string | null,
  enabled = true
): UseQueryResult<TicketDetail, Error> {
  return useQuery({
    queryKey: [...TICKET_DETAIL_QUERY_KEY, ticketCode],
    queryFn: () => {
      if (!ticketCode) {
        throw new Error('Ticket code is required');
      }
      return fetchTicketDetail(ticketCode);
    },
    enabled: Boolean(ticketCode) && enabled,
    staleTime: 60 * 1000,
  });
}
