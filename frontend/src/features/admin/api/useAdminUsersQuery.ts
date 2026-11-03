import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { PaginatedApiResponse, PaginationMeta } from '@/types/api';
import type { AdminUserListItem, AdminUsersFilterParams, AdminUsersSummary } from '../types';

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;

export interface AdminUsersResult {
  users: AdminUserListItem[];
  meta: PaginationMeta & {
    summary?: AdminUsersSummary;
  };
}

export async function fetchAdminUsers(params?: AdminUsersFilterParams): Promise<AdminUsersResult> {
  const queryParams: Record<string, string | number> = {};

  if (params?.search?.trim()) queryParams.search = params.search.trim();
  if (params?.role && params.role !== 'all') queryParams.role = params.role;
  if (params?.phone_locked && params.phone_locked !== 'all') {
    queryParams.phone_locked = params.phone_locked;
  }
  if (params?.page) queryParams.page = params.page;
  if (params?.per_page) queryParams.per_page = params.per_page;

  const response = await apiClient.get<PaginatedApiResponse<AdminUserListItem>>('/admin/users', {
    params: queryParams,
  });

  return {
    users: response.data.data,
    meta: response.data.meta,
  };
}

export function useAdminUsersQuery(
  params?: AdminUsersFilterParams,
  enabled = true
): UseQueryResult<AdminUsersResult, Error> {
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, 'list', params],
    queryFn: () => fetchAdminUsers(params),
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
