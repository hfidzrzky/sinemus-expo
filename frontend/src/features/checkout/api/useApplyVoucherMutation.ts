import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { ApplyVoucherPayload, ApplyVoucherResponseData } from '../types';

export async function applyVoucher(
  payload: ApplyVoucherPayload
): Promise<ApplyVoucherResponseData> {
  const response = await apiClient.post<ApiResponse<ApplyVoucherResponseData>>(
    '/checkout/voucher/apply',
    payload
  );
  return response.data.data;
}

export function useApplyVoucherMutation(): UseMutationResult<
  ApplyVoucherResponseData,
  Error,
  ApplyVoucherPayload
> {
  return useMutation({
    mutationFn: applyVoucher,
  });
}
