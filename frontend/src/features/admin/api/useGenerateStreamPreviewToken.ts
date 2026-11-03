import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

export interface StreamPreviewTokenResponse {
  uid: string;
  signed_token: string;
  preview_iframe_url: string;
  playback_hls_url: string;
  expires_in: number;
}

export function useGenerateStreamPreviewTokenMutation() {
  return useMutation<StreamPreviewTokenResponse, Error, string>({
    mutationFn: async (uid: string) => {
      const response = await apiClient.post<ApiResponse<StreamPreviewTokenResponse>>(
        `/admin/cloudflare/stream/${uid}/token`
      );
      return response.data.data;
    },
  });
}
