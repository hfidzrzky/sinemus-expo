import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { PaginatedApiResponse } from '@/types/api';
import type { AdminMovieItem } from '../types';

export interface AdminMoviesQueryParams {
  search?: string;
  genre?: string;
  page?: number;
  per_page?: number;
}

export const ADMIN_MOVIES_QUERY_KEY = ['admin', 'movies', 'list'] as const;

export async function fetchAdminMovies(
  params?: AdminMoviesQueryParams,
  signal?: AbortSignal
): Promise<AdminMovieItem[]> {
  const response = await apiClient.get<PaginatedApiResponse<AdminMovieItem>>('/admin/movies', {
    params,
    signal,
  });
  return response.data.data;
}

export function useAdminMoviesQuery(
  paramsOrEnabled?: AdminMoviesQueryParams | boolean,
  enabledParam = true
): UseQueryResult<AdminMovieItem[], Error> {
  const params = typeof paramsOrEnabled === 'object' ? paramsOrEnabled : undefined;
  const enabled = typeof paramsOrEnabled === 'boolean' ? paramsOrEnabled : enabledParam;

  return useQuery({
    queryKey: [...ADMIN_MOVIES_QUERY_KEY, params],
    queryFn: ({ signal }) => fetchAdminMovies(params, signal),
    enabled,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });
}
