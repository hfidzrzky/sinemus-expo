import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminUserDetail } from '../types';
import { ADMIN_USERS_QUERY_KEY } from './useAdminUsersQuery';

export async function fetchAdminUserDetail(userId: number): Promise<AdminUserDetail> {
  const response = await apiClient.get<ApiResponse<AdminUserDetail>>(`/admin/users/${userId}`);
  return response.data.data;
}

export function useAdminUserDetailQuery(
  userId: number | null,
  enabled = true
): UseQueryResult<AdminUserDetail, Error> {
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, 'detail', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID wajib disertakan.');
      return fetchAdminUserDetail(userId);
    },
    enabled: Boolean(userId) && enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
