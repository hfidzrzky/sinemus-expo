import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { User } from '../types';

export const CURRENT_USER_QUERY_KEY = ['auth', 'me'] as const;

export async function fetchCurrentUser(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}

export function useCurrentUserQuery(enabled: boolean): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 menit — data user jarang berubah
    gcTime: 10 * 60 * 1000, // pertahankan cache 10 menit setelah unmount
    retry: false,
    refetchOnWindowFocus: false,
  });
}
