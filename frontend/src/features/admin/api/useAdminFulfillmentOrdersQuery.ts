import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { AdminFulfillmentOrder } from '../types';

export const ADMIN_FULFILLMENT_QUERY_KEY = ['admin', 'fulfillment'] as const;

export function useAdminFulfillmentOrdersQuery(scheduleId: number | null) {
  return useQuery<AdminFulfillmentOrder[], Error>({
    queryKey: [...ADMIN_FULFILLMENT_QUERY_KEY, scheduleId],
    queryFn: async () => {
      if (!scheduleId) return [];
      const response = await apiClient.get<ApiResponse<AdminFulfillmentOrder[]>>(
        `/admin/schedules/${scheduleId}/fulfillment`
      );
      return response.data.data;
    },
    enabled: !!scheduleId,
  });
}
