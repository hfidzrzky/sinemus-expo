import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminUserListItem, UpdateUserRolePayload } from '../types';
import { ADMIN_USERS_QUERY_KEY } from './useAdminUsersQuery';

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminUserListItem, Error, { id: number; payload: UpdateUserRolePayload }>({
    mutationFn: async ({ id, payload }) => {
      const response = await apiClient.put<ApiResponse<AdminUserListItem>>(
        `/admin/users/${id}/role`,
        payload
      );
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_QUERY_KEY, 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
}
