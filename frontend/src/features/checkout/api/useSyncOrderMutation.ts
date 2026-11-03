import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { PaymentStatusResponseData } from '../types';

export interface SyncOrderPayload {
  order_id: string;
}

export async function syncOrder(payload: SyncOrderPayload): Promise<PaymentStatusResponseData> {
  // ZERO CLIENT TRUST: Request POST dikirim tanpa body manipulatif;
  // Backend secara independen memeriksa status transaksi langsung ke Midtrans API secara Server-to-Server.
  const response = await apiClient.post<ApiResponse<PaymentStatusResponseData>>(
    `/checkout/orders/${payload.order_id}/sync`
  );
  return response.data.data;
}

export function useSyncOrderMutation(): UseMutationResult<
  PaymentStatusResponseData,
  Error,
  SyncOrderPayload
> {
  return useMutation({
    mutationFn: syncOrder,
  });
}
