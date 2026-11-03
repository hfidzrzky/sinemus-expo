import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { SmartIngestConfirmPayload, SmartIngestConfirmResponse } from '../types';
import { ADMIN_FULFILLMENT_QUERY_KEY } from './useAdminFulfillmentOrdersQuery';

export interface ConfirmSmartIngestArgs {
  scheduleId: number;
  payload: SmartIngestConfirmPayload;
}

export function useConfirmSmartIngestMutation() {
  const queryClient = useQueryClient();

  return useMutation<SmartIngestConfirmResponse, Error, ConfirmSmartIngestArgs>({
    mutationFn: async ({ scheduleId, payload }) => {
      const response = await apiClient.post<ApiResponse<SmartIngestConfirmResponse>>(
        `/admin/schedules/${scheduleId}/smart-ingest/confirm`,
        payload,
        { timeout: 60000 }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_FULFILLMENT_QUERY_KEY });
    },
  });
}
