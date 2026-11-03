import { useQuery, keepPreviousData, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { MovieDetail } from '../types';

export const MOVIE_DETAIL_QUERY_KEY = ['movies', 'detail'] as const;

export async function fetchMovieDetail(
  idOrSlug: string | number,
  signal?: AbortSignal
): Promise<MovieDetail> {
  const response = await apiClient.get<ApiResponse<MovieDetail>>(`/movies/${idOrSlug}`, {
    signal,
  });
  return response.data.data;
}

export function useMovieDetailQuery(
  idOrSlug: string | number | undefined,
  enabled = true
): UseQueryResult<MovieDetail, Error> {
  return useQuery({
    queryKey: [...MOVIE_DETAIL_QUERY_KEY, idOrSlug],
    queryFn: ({ signal }) => fetchMovieDetail(idOrSlug!, signal),
    enabled: enabled && Boolean(idOrSlug),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
