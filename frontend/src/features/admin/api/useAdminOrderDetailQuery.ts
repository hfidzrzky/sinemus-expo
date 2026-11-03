import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminOrderDetail } from '../types';
import { ADMIN_ORDERS_QUERY_KEY } from './useAdminOrdersQuery';

export async function fetchAdminOrderDetail(orderId: string): Promise<AdminOrderDetail> {
  const response = await apiClient.get<ApiResponse<AdminOrderDetail>>(
    `/admin/orders/${encodeURIComponent(orderId)}`
  );
  return response.data.data;
}

export function useAdminOrderDetailQuery(
  orderId: string | null,
  enabled = true
): UseQueryResult<AdminOrderDetail, Error> {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_QUERY_KEY, 'detail', orderId],
    queryFn: () => {
      if (!orderId) {
        throw new Error('Order ID wajib diisi untuk mengambil detail pesanan.');
      }
      return fetchAdminOrderDetail(orderId);
    },
    enabled: Boolean(orderId) && enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
