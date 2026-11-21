import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { ScannerSessionItem, ScannerSessionsFilterParams } from '../types';

export const SCANNER_SESSIONS_QUERY_KEY = ['admin', 'scanner', 'sessions'] as const;

export async function fetchScannerSessions(
  params?: ScannerSessionsFilterParams
): Promise<{ sessions: ScannerSessionItem[]; serverTime: string }> {
  const queryParams: Record<string, string> = {};
  if (params?.scope) queryParams.scope = params.scope;
  if (params?.search?.trim()) queryParams.search = params.search.trim();

  const response = await apiClient.get<ApiResponse<ScannerSessionItem[]>>(
    '/admin/scanner/sessions',
    {
      params: queryParams,
    }
  );

  const rawData = response.data?.data;
  const sessions = Array.isArray(rawData) ? rawData : [];
  const serverTime = response.data?.server_time || new Date().toISOString();

  return { sessions, serverTime };
}

export function useScannerSessionsQuery(
  params?: ScannerSessionsFilterParams,
  enabled = true
): UseQueryResult<{ sessions: ScannerSessionItem[]; serverTime: string }, Error> {
  return useQuery({
    queryKey: [...SCANNER_SESSIONS_QUERY_KEY, params],
    queryFn: () => fetchScannerSessions(params),
    enabled,
    staleTime: 15_000, // 15 detik untuk data presisi gerbang
    refetchInterval: 25_000, // Background polling 25 detik agar counter antar staf tetap sinkron
    retry: 2,
  });
}
