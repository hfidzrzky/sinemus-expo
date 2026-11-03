import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminMovieAccessItem } from '../types';

export interface AdminMovieAccessQueryParams {
  search?: string;
  status?: string;
  movie_id?: number;
  page?: number;
  per_page?: number;
}

export const ADMIN_MOVIE_ACCESS_QUERY_KEY = ['admin', 'movie-access', 'list'] as const;

export async function fetchAdminMovieAccess(
  params?: AdminMovieAccessQueryParams,
  signal?: AbortSignal
): Promise<AdminMovieAccessItem[]> {
  const response = await apiClient.get<ApiResponse<AdminMovieAccessItem[]>>('/admin/movie-access', {
    params,
    signal,
  });
  return response.data.data;
}

export function useAdminMovieAccessQuery(
  paramsOrEnabled?: AdminMovieAccessQueryParams | boolean,
  enabledParam = true
): UseQueryResult<AdminMovieAccessItem[], Error> {
  const params = typeof paramsOrEnabled === 'object' ? paramsOrEnabled : undefined;
  const enabled = typeof paramsOrEnabled === 'boolean' ? paramsOrEnabled : enabledParam;

  return useQuery({
    queryKey: [...ADMIN_MOVIE_ACCESS_QUERY_KEY, params],
    queryFn: ({ signal }) => fetchAdminMovieAccess(params, signal),
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
