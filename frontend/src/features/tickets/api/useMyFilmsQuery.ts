import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { MyFilmRentalItem } from '../types';

export const MY_FILMS_QUERY_KEY = ['user', 'films'] as const;

export async function fetchMyFilms(): Promise<MyFilmRentalItem[]> {
  const response = await apiClient.get<ApiResponse<MyFilmRentalItem[]>>('/user/films');
  return response.data.data;
}

export function useMyFilmsQuery(enabled = true): UseQueryResult<MyFilmRentalItem[], Error> {
  return useQuery({
    queryKey: MY_FILMS_QUERY_KEY,
    queryFn: fetchMyFilms,
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
