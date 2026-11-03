import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { SingleTicketInjectPayload, SingleTicketInjectResponse } from '../types';
import { ADMIN_FULFILLMENT_QUERY_KEY } from './useAdminFulfillmentOrdersQuery';

export interface InjectCinemaTicketArgs {
  transactionId: number;
  payload: SingleTicketInjectPayload;
}

export function useInjectCinemaTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation<SingleTicketInjectResponse, Error, InjectCinemaTicketArgs>({
    mutationFn: async ({ transactionId, payload }) => {
      const formData = new FormData();
      formData.append('cinema_booking_code', payload.cinema_booking_code);
      formData.append('cinema_passcode', payload.cinema_passcode);
      if (payload.qr_image instanceof File) {
        formData.append('qr_image', payload.qr_image);
      }
      if (payload.notes) {
        formData.append('notes', payload.notes);
      }
      formData.append('send_notification', String(payload.send_notification));
      if (typeof payload.allow_update === 'boolean') {
        formData.append('allow_update', String(payload.allow_update));
      }

      const response = await apiClient.post<ApiResponse<SingleTicketInjectResponse>>(
        `/admin/transactions/${transactionId}/inject-cinema-ticket`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_FULFILLMENT_QUERY_KEY });
    },
  });
}
