import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { GoogleAuthPayload, GoogleAuthResponseData } from '../types';

export async function loginWithGoogle(payload: GoogleAuthPayload): Promise<GoogleAuthResponseData> {
  const response = await apiClient.post<ApiResponse<GoogleAuthResponseData>>(
    '/auth/google',
    payload
  );
  return response.data.data;
}

export function useGoogleAuthMutation(): UseMutationResult<
  GoogleAuthResponseData,
  Error,
  GoogleAuthPayload
> {
  return useMutation({
    mutationFn: loginWithGoogle,
  });
}
