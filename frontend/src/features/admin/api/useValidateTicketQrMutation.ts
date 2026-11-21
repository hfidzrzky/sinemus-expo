import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { TicketValidationPayload, TicketValidationResponse } from '../types';

export type TicketValidationMutationResult = TicketValidationResponse & {
  _server_time: string;
};

export function useValidateTicketQrMutation() {
  return useMutation<TicketValidationMutationResult, Error, TicketValidationPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ApiResponse<TicketValidationResponse>>(
        '/admin/tickets/validate',
        payload
      );
      return {
        ...response.data.data,
        _server_time: response.data.server_time || new Date().toISOString(),
      };
    },
  });
}
