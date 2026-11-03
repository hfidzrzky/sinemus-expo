import { useQuery, type UseQueryResult, type Query } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { PaymentStatusResponseData } from '../types';

export const PAYMENT_STATUS_QUERY_KEY = 'payment-status';

export async function fetchPaymentStatus(orderId: string): Promise<PaymentStatusResponseData> {
  const response = await apiClient.get<ApiResponse<PaymentStatusResponseData>>(
    `/checkout/orders/${orderId}/status`
  );
  return response.data.data;
}

export function usePaymentStatusQuery(
  orderId: string | null,
  options?: {
    enabled?: boolean;
    refetchInterval?:
      | number
      | false
      | ((query: Query<PaymentStatusResponseData, Error>) => number | false | undefined);
  }
): UseQueryResult<PaymentStatusResponseData, Error> {
  return useQuery({
    queryKey: [PAYMENT_STATUS_QUERY_KEY, orderId],
    queryFn: () => {
      if (!orderId) {
        throw new Error('Order ID is required to fetch payment status');
      }
      return fetchPaymentStatus(orderId);
    },
    enabled: Boolean(orderId) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
  });
}
