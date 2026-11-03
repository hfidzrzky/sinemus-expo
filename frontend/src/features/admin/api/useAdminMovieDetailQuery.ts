import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminMovieItem } from '../types';

export const ADMIN_MOVIE_DETAIL_QUERY_KEY = ['admin', 'movies', 'detail'] as const;

export async function fetchAdminMovieDetail(id: number): Promise<AdminMovieItem> {
  const response = await apiClient.get<ApiResponse<AdminMovieItem>>(`/admin/movies/${id}`);
  return response.data.data;
}

export function useAdminMovieDetailQuery(
  id?: number,
  enabled = true
): UseQueryResult<AdminMovieItem, Error> {
  return useQuery({
    queryKey: [...ADMIN_MOVIE_DETAIL_QUERY_KEY, id],
    queryFn: () => {
      if (!id) throw new Error('ID Film tidak valid');
      return fetchAdminMovieDetail(id);
    },
    enabled: Boolean(id && enabled),
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });
}
