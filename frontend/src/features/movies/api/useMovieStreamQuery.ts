import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { MovieStreamAccess } from '../types';

export const MOVIE_STREAM_QUERY_KEY = (id: string | number) =>
  ['movies', 'stream', String(id)] as const;

export async function fetchMovieStreamAccess(id: string | number): Promise<MovieStreamAccess> {
  const response = await apiClient.get<ApiResponse<MovieStreamAccess>>(`/movies/${id}/stream`);
  return {
    ...response.data.data,
    server_time: response.data.server_time,
  };
}

export function useMovieStreamQuery(
  id: string | number | undefined,
  enabled = true
): UseQueryResult<MovieStreamAccess, Error> {
  return useQuery({
    queryKey: MOVIE_STREAM_QUERY_KEY(id || ''),
    queryFn: () => fetchMovieStreamAccess(id!),
    enabled: Boolean(enabled && id),
    staleTime: 60 * 1000, // 1 menit (karena rental countdown dan token expiry)
    retry: false, // Fail fast agar 403 tidak di-retry berulang kali
  });
}
