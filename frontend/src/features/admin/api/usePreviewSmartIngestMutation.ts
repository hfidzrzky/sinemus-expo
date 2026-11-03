import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { SmartIngestPreviewResponse } from '../types';

export interface PreviewSmartIngestArgs {
  scheduleId: number;
  file: File;
}

export function usePreviewSmartIngestMutation() {
  return useMutation<SmartIngestPreviewResponse, Error, PreviewSmartIngestArgs>({
    mutationFn: async ({ scheduleId, file }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<ApiResponse<SmartIngestPreviewResponse>>(
        `/admin/schedules/${scheduleId}/smart-ingest/preview`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 120 detik toleransi untuk ekstraksi PDF & deteksi OCR/QR
        }
      );
      return response.data.data;
    },
  });
}
