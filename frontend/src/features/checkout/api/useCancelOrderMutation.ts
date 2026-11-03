import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { PaymentStatusResponseData } from '../types';
import { SCHEDULE_SEATS_QUERY_KEY } from '@/features/events';

export interface CancelOrderPayload {
  order_id: string;
}

export async function cancelOrder(payload: CancelOrderPayload): Promise<PaymentStatusResponseData> {
  const response = await apiClient.post<ApiResponse<PaymentStatusResponseData>>(
    `/checkout/orders/${payload.order_id}/cancel`
  );
  return response.data.data;
}

export function useCancelOrderMutation(): UseMutationResult<
  PaymentStatusResponseData,
  Error,
  CancelOrderPayload
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      // Bebaskan cache denah kursi dan daftar tiket pengguna secara reaktif
      queryClient.invalidateQueries({ queryKey: SCHEDULE_SEATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
    },
  });
}
