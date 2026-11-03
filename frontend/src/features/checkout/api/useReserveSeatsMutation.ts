import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { ReserveSeatsPayload, ReserveSeatsResponseData } from '../types';

export interface ReserveSeatsResult {
  data: ReserveSeatsResponseData;
  server_time: string;
}

export async function reserveSeats(payload: ReserveSeatsPayload): Promise<ReserveSeatsResult> {
  const response = await apiClient.post<ApiResponse<ReserveSeatsResponseData>>(
    '/bookings/reserve',
    payload
  );
  return {
    data: response.data.data,
    server_time: response.data.server_time,
  };
}

export function useReserveSeatsMutation(): UseMutationResult<
  ReserveSeatsResult,
  Error,
  ReserveSeatsPayload
> {
  return useMutation({
    mutationFn: reserveSeats,
  });
}
