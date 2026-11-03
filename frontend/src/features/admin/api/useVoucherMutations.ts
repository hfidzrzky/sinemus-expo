import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminVoucherItem, CreateVoucherPayload, UpdateVoucherPayload } from '../types';
import { ADMIN_VOUCHERS_QUERY_KEY } from './useAdminVouchersQuery';

export function useCreateVoucherMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminVoucherItem, Error, CreateVoucherPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ApiResponse<AdminVoucherItem>>(
        '/admin/vouchers',
        payload
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_VOUCHERS_QUERY_KEY });
    },
  });
}

export function useUpdateVoucherMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminVoucherItem, Error, { id: number; payload: UpdateVoucherPayload }>({
    mutationFn: async ({ id, payload }) => {
      const response = await apiClient.put<ApiResponse<AdminVoucherItem>>(
        `/admin/vouchers/${id}`,
        payload
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_VOUCHERS_QUERY_KEY });
    },
  });
}

export function useDeleteVoucherMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/vouchers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_VOUCHERS_QUERY_KEY });
    },
  });
}
