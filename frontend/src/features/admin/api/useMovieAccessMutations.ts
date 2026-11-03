import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  GrantMovieAccessPayload,
  GrantMovieAccessResponse,
  RevokeMovieAccessPayload,
} from '../types';
import { ADMIN_MOVIE_ACCESS_QUERY_KEY } from './useAdminMovieAccessQuery';

export function useGrantMovieAccessMutation() {
  const queryClient = useQueryClient();

  return useMutation<GrantMovieAccessResponse, Error, GrantMovieAccessPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ApiResponse<GrantMovieAccessResponse>>(
        '/admin/movie-access/grant',
        payload
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MOVIE_ACCESS_QUERY_KEY });
    },
  });
}

export function useRevokeMovieAccessMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: number; payload: RevokeMovieAccessPayload }>({
    mutationFn: async ({ id, payload }) => {
      await apiClient.post(`/admin/movie-access/${id}/revoke`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MOVIE_ACCESS_QUERY_KEY });
    },
  });
}
