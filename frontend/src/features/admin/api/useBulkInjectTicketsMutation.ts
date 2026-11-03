import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { BulkInjectTicketsPayload, BulkInjectTicketsResponse } from '../types';
import { ADMIN_FULFILLMENT_QUERY_KEY } from './useAdminFulfillmentOrdersQuery';

export interface BulkInjectTicketsArgs {
  scheduleId: number;
  payload: BulkInjectTicketsPayload;
}

export function useBulkInjectTicketsMutation() {
  const queryClient = useQueryClient();

  return useMutation<BulkInjectTicketsResponse, Error, BulkInjectTicketsArgs>({
    mutationFn: async ({ scheduleId, payload }) => {
      const formData = new FormData();
      formData.append('csv_file', payload.csv_file);
      if (payload.assets_zip) {
        formData.append('assets_zip', payload.assets_zip);
      }
      formData.append('send_notification', String(payload.send_notification ?? true));

      const response = await apiClient.post<ApiResponse<BulkInjectTicketsResponse>>(
        `/admin/schedules/${scheduleId}/bulk-inject-tickets`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 120 detik toleransi untuk upload arsip massal
        }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_FULFILLMENT_QUERY_KEY });
    },
  });
}
