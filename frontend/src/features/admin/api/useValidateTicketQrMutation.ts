import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { TicketValidationPayload, TicketValidationResponse } from '../types';

export function useValidateTicketQrMutation() {
  return useMutation<TicketValidationResponse, Error, TicketValidationPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ApiResponse<TicketValidationResponse>>(
        '/admin/tickets/validate',
        payload
      );
      return response.data.data;
    },
  });
}
