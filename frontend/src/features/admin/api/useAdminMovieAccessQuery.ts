import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { PaginatedApiResponse } from '@/types/api';
import type { AdminMovieAccessItem, AdminMovieAccessResult, MovieAccessMeta } from '../types';

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
): Promise<AdminMovieAccessResult> {
  const queryParams: Record<string, string | number> = {};

  if (params?.search?.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params?.status && params.status !== 'all') {
    queryParams.status = params.status;
  }
  if (params?.movie_id) {
    queryParams.movie_id = params.movie_id;
  }
  if (params?.page) {
    queryParams.page = params.page;
  }
  if (params?.per_page) {
    queryParams.per_page = params.per_page;
  }

  const response = await apiClient.get<PaginatedApiResponse<AdminMovieAccessItem, MovieAccessMeta>>(
    '/admin/movie-access',
    {
      params: queryParams,
      signal,
    }
  );

  return {
    items: response.data.data ?? [],
    meta: response.data.meta ?? {
      current_page: 1,
      from: 0,
      last_page: 1,
      per_page: params?.per_page || 20,
      to: 0,
      total: 0,
    },
    server_time: response.data.server_time,
  };
}

export function useAdminMovieAccessQuery(
  paramsOrEnabled?: AdminMovieAccessQueryParams | boolean,
  enabledParam = true
): UseQueryResult<AdminMovieAccessResult, Error> {
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
