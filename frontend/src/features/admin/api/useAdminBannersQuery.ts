import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminBannerItem } from '../types';

export const ADMIN_BANNERS_QUERY_KEY = ['admin', 'banners', 'list'] as const;

export async function fetchAdminBanners(): Promise<AdminBannerItem[]> {
  const response = await apiClient.get<ApiResponse<AdminBannerItem[]>>('/admin/banners');
  return response.data.data;
}

export function useAdminBannersQuery(enabled = true): UseQueryResult<AdminBannerItem[], Error> {
  return useQuery({
    queryKey: ADMIN_BANNERS_QUERY_KEY,
    queryFn: fetchAdminBanners,
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
