import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  AdminBannerItem,
  CreateBannerPayload,
  UpdateBannerPayload,
  ReorderBannersPayload,
} from '../types';
import { ADMIN_BANNERS_QUERY_KEY } from './useAdminBannersQuery';

export function useCreateBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminBannerItem, Error, CreateBannerPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ApiResponse<AdminBannerItem>>(
        '/admin/banners',
        payload
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_BANNERS_QUERY_KEY });
    },
  });
}

export function useUpdateBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminBannerItem, Error, { id: number; payload: UpdateBannerPayload }>({
    mutationFn: async ({ id, payload }) => {
      const response = await apiClient.put<ApiResponse<AdminBannerItem>>(
        `/admin/banners/${id}`,
        payload
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_BANNERS_QUERY_KEY });
    },
  });
}

export function useDeleteBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_BANNERS_QUERY_KEY });
    },
  });
}

export function useReorderBannersMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReorderBannersPayload>({
    mutationFn: async (payload) => {
      await apiClient.post('/admin/banners/reorder', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_BANNERS_QUERY_KEY });
    },
  });
}
