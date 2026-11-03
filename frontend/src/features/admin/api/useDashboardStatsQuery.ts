import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminDashboardStats, DashboardPeriod } from '../types';

export const ADMIN_DASHBOARD_STATS_QUERY_KEY = ['admin', 'dashboard', 'stats'] as const;

export interface DashboardStatsFilterParams {
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
}

export async function fetchAdminDashboardStats(
  params?: DashboardStatsFilterParams
): Promise<AdminDashboardStats> {
  const queryParams: Record<string, string> = {};
  if (params?.period && params.period !== 'custom') {
    queryParams.period = params.period;
  }
  if (params?.startDate) {
    queryParams.start_date = params.startDate;
  }
  if (params?.endDate) {
    queryParams.end_date = params.endDate;
  }

  const response = await apiClient.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard/stats', {
    params: queryParams,
  });
  return response.data.data;
}

export function useDashboardStatsQuery(
  params: DashboardStatsFilterParams = { period: '7d' },
  enabled = true
): UseQueryResult<AdminDashboardStats, Error> {
  return useQuery({
    queryKey: [...ADMIN_DASHBOARD_STATS_QUERY_KEY, params],
    queryFn: () => fetchAdminDashboardStats(params),
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
