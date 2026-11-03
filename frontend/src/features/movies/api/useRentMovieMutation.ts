import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { MovieRentalPayload, MovieRentalResponse } from '../types';
import { MOVIE_DETAIL_QUERY_KEY } from './useMovieDetailQuery';

export interface RentMovieVariables {
  movieId: number;
  payload?: MovieRentalPayload;
}

export async function rentMovie({
  movieId,
  payload,
}: RentMovieVariables): Promise<MovieRentalResponse> {
  const response = await apiClient.post<ApiResponse<MovieRentalResponse>>(
    `/movies/${movieId}/rent`,
    payload ?? {}
  );
  return response.data.data;
}

export function useRentMovieMutation(): UseMutationResult<
  MovieRentalResponse,
  Error,
  RentMovieVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rentMovie,
    onSuccess: (_data, variables) => {
      // Invalidate detail film & daftar film sewa user secara reaktif
      queryClient.invalidateQueries({ queryKey: MOVIE_DETAIL_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...MOVIE_DETAIL_QUERY_KEY, variables.movieId] });
      queryClient.invalidateQueries({ queryKey: ['user', 'films'] });
      queryClient.invalidateQueries({ queryKey: ['my-films'] });
    },
  });
}
