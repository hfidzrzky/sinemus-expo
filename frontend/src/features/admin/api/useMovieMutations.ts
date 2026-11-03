import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminMovieItem, CreateMoviePayload, UpdateMoviePayload } from '../types';
import { ADMIN_MOVIES_QUERY_KEY } from './useAdminMoviesQuery';
import { ADMIN_MOVIE_DETAIL_QUERY_KEY } from './useAdminMovieDetailQuery';

export function useCreateMovieMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminMovieItem, Error, CreateMoviePayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ApiResponse<AdminMovieItem>>('/admin/movies', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MOVIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

export function useUpdateMovieMutation(id?: number) {
  const queryClient = useQueryClient();

  return useMutation<AdminMovieItem, Error, { id: number; data: UpdateMoviePayload }>({
    mutationFn: async ({ id: movieId, data }) => {
      const response = await apiClient.put<ApiResponse<AdminMovieItem>>(
        `/admin/movies/${movieId}`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MOVIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_MOVIE_DETAIL_QUERY_KEY, variables.id] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [...ADMIN_MOVIE_DETAIL_QUERY_KEY, id] });
      }
    },
  });
}

export function useDeleteMovieMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ id: number }, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/movies/${id}`);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MOVIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}
