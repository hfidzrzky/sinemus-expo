import { useQuery, keepPreviousData, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { PaginatedApiResponse } from '@/types/api';
import type { MovieSummary, MovieFilterParams } from '../types';

export const MOVIES_QUERY_KEY = ['movies', 'list'] as const;

export async function fetchMovies(
  params?: MovieFilterParams,
  signal?: AbortSignal
): Promise<MovieSummary[]> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params?.genre) {
    queryParams.genre = params.genre;
  }
  if (params?.search?.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params?.featured !== undefined) {
    queryParams.featured = params.featured;
  }
  if (params?.page) {
    queryParams.page = params.page;
  }
  if (params?.per_page) {
    queryParams.per_page = params.per_page;
  }

  const response = await apiClient.get<PaginatedApiResponse<MovieSummary>>('/movies', {
    params: queryParams,
    signal,
  });
  return response.data.data;
}

export function useMoviesQuery(
  params?: MovieFilterParams,
  enabled = true
): UseQueryResult<MovieSummary[], Error> {
  return useQuery({
    queryKey: [...MOVIES_QUERY_KEY, params],
    queryFn: ({ signal }) => fetchMovies(params, signal),
    enabled,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
