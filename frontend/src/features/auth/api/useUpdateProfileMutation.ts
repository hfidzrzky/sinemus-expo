import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { UpdateProfilePayload, User } from '../types';
import { CURRENT_USER_QUERY_KEY } from './useCurrentUserQuery';

export async function updateUserProfile(payload: UpdateProfilePayload): Promise<User> {
  const response = await apiClient.put<ApiResponse<User>>('/user/profile', payload);
  return response.data.data;
}

export function useUpdateProfileMutation(): UseMutationResult<User, Error, UpdateProfilePayload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedUser);
    },
  });
}
