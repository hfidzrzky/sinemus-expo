import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { PaginatedApiResponse, PaginationMeta } from '@/types/api';
import type { AdminOrderItem, AdminOrdersFilterParams } from '../types';

export const ADMIN_ORDERS_QUERY_KEY = ['admin', 'orders'] as const;

export interface AdminOrdersResult {
  orders: AdminOrderItem[];
  meta: PaginationMeta;
}

export async function fetchAdminOrders(
  params?: AdminOrdersFilterParams
): Promise<AdminOrdersResult> {
  const queryParams: Record<string, string | number> = {};

  if (params?.type && params.type !== 'all') {
    queryParams.type = params.type;
  }
  if (params?.status && params.status !== 'all') {
    queryParams.status = params.status;
  }
  if (params?.search?.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params?.start_date?.trim()) {
    queryParams.start_date = params.start_date.trim();
  }
  if (params?.end_date?.trim()) {
    queryParams.end_date = params.end_date.trim();
  }
  if (params?.page) {
    queryParams.page = params.page;
  }
  if (params?.per_page) {
    queryParams.per_page = params.per_page;
  }

  const response = await apiClient.get<PaginatedApiResponse<AdminOrderItem>>('/admin/orders', {
    params: queryParams,
  });

  return {
    orders: response.data.data,
    meta: response.data.meta,
  };
}

export function useAdminOrdersQuery(
  params?: AdminOrdersFilterParams,
  enabled = true
): UseQueryResult<AdminOrdersResult, Error> {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_QUERY_KEY, 'list', params],
    queryFn: () => fetchAdminOrders(params),
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
