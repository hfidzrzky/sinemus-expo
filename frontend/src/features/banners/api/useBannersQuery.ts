import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { BannerItem } from '../types';

export const BANNERS_QUERY_KEY = ['banners', 'active'] as const;

export async function fetchBanners(): Promise<BannerItem[]> {
  const response = await apiClient.get<ApiResponse<BannerItem[]>>('/banners');
  return response.data.data;
}

export function useBannersQuery(enabled = true): UseQueryResult<BannerItem[], Error> {
  return useQuery({
    queryKey: BANNERS_QUERY_KEY,
    queryFn: fetchBanners,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 menit
    retry: 1,
  });
}
