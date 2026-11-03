import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { CloudflareDirectUploadResponse } from '../types';

export function useCreateImageDirectUploadMutation() {
  return useMutation<CloudflareDirectUploadResponse, Error, { asset_type?: string }>({
    mutationFn: async ({ asset_type = 'general' }) => {
      const response = await apiClient.post<ApiResponse<CloudflareDirectUploadResponse>>(
        '/admin/cloudflare/images/direct-upload',
        { asset_type }
      );
      return response.data.data;
    },
  });
}

export function useDeleteCloudflareImageMutation() {
  return useMutation<{ image_id: string }, Error, string>({
    mutationFn: async (imageId) => {
      const response = await apiClient.delete<ApiResponse<{ image_id: string }>>(
        `/admin/cloudflare/images/${imageId}`
      );
      return response.data.data;
    },
  });
}
