import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { StreamVideoMetadata, VerifyStreamUidPayload } from '../types';

export const STREAM_METADATA_QUERY_KEY = ['admin', 'stream-metadata'] as const;

/**
 * Query deklaratif untuk mengambil metadata video Cloudflare Stream secara otomatis
 * tanpa menimbulkan efek samping cascading re-render (React 19 compliant).
 */
export function useStreamVideoMetadataQuery(uid: string | null | undefined, enabled = true) {
  const cleanUid = uid?.trim().toLowerCase();
  const isValidHex = Boolean(cleanUid && /^[a-f0-9]{32}$/i.test(cleanUid));

  return useQuery<StreamVideoMetadata, Error>({
    queryKey: [...STREAM_METADATA_QUERY_KEY, cleanUid],
    queryFn: async () => {
      const response = await apiClient.post<ApiResponse<StreamVideoMetadata>>(
        '/admin/cloudflare/stream/verify',
        { uid: cleanUid }
      );
      return response.data.data;
    },
    enabled: Boolean(enabled && isValidHex),
    staleTime: 60 * 60 * 1000, // 1 jam cache
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Mutation imperatif untuk verifikasi manual Cloudflare Stream UID.
 */
export function useVerifyStreamUidMutation() {
  return useMutation<StreamVideoMetadata, Error, VerifyStreamUidPayload>({
    mutationFn: async ({ uid }) => {
      const response = await apiClient.post<ApiResponse<StreamVideoMetadata>>(
        '/admin/cloudflare/stream/verify',
        { uid }
      );
      return response.data.data;
    },
  });
}
