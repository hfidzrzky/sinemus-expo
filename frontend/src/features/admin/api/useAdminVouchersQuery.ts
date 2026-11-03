import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminVoucherItem, PromoType } from '../types';

export interface AdminVouchersFilters {
  promo_type?: PromoType | 'all';
  search?: string;
  status?: string;
  item_type?: string;
}

export const ADMIN_VOUCHERS_QUERY_KEY = ['admin', 'vouchers', 'list'] as const;

export async function fetchAdminVouchers(
  filters?: AdminVouchersFilters
): Promise<AdminVoucherItem[]> {
  const params: Record<string, string> = {};
  if (filters?.promo_type && filters.promo_type !== 'all') {
    params.promo_type = filters.promo_type;
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.status && filters.status !== 'all') {
    params.status = filters.status;
  }
  if (filters?.item_type && filters.item_type !== 'all') {
    params.item_type = filters.item_type;
  }

  const response = await apiClient.get<ApiResponse<AdminVoucherItem[]>>('/admin/vouchers', {
    params,
  });
  return response.data.data;
}

export function useAdminVouchersQuery(
  filtersOrEnabled?: AdminVouchersFilters | boolean,
  maybeEnabled = true
): UseQueryResult<AdminVoucherItem[], Error> {
  const filters = typeof filtersOrEnabled === 'object' ? filtersOrEnabled : undefined;
  const enabled = typeof filtersOrEnabled === 'boolean' ? filtersOrEnabled : maybeEnabled;

  return useQuery({
    queryKey: filters
      ? ([...ADMIN_VOUCHERS_QUERY_KEY, filters] as const)
      : ADMIN_VOUCHERS_QUERY_KEY,
    queryFn: () => fetchAdminVouchers(filters),
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
