import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { ResendNotificationPayload, ResendNotificationResponse } from '../types';
import { ADMIN_ORDERS_QUERY_KEY } from './useAdminOrdersQuery';

export interface ResendNotificationArgs {
  orderId: string;
  payload?: ResendNotificationPayload;
}

export function useResendOrderNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResendNotificationResponse, Error, ResendNotificationArgs>({
    mutationFn: async ({ orderId, payload = { channel: 'all' } }) => {
      const response = await apiClient.post<ApiResponse<ResendNotificationResponse>>(
        `/admin/orders/${encodeURIComponent(orderId)}/resend`,
        payload
      );
      return response.data.data;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_ORDERS_QUERY_KEY, 'detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_QUERY_KEY });
    },
  });
}
