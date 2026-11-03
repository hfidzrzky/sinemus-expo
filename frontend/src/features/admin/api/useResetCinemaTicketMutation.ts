import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { SingleTicketInjectResponse } from '../types';
import { ADMIN_FULFILLMENT_QUERY_KEY } from './useAdminFulfillmentOrdersQuery';

export function useResetCinemaTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation<SingleTicketInjectResponse, Error, number>({
    mutationFn: async (transactionId: number) => {
      const response = await apiClient.post<ApiResponse<SingleTicketInjectResponse>>(
        `/admin/transactions/${transactionId}/reset-cinema-ticket`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_FULFILLMENT_QUERY_KEY });
    },
  });
}
