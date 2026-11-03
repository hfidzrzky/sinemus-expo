import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { tokenStorage } from '@/lib/token-storage';
import type { ApiResponse } from '@/types/api';

/**
 * Revokasi sesi token pengguna di backend.
 *
 * Menerima opsional parameter `token`. Jika `tokenStorage.clear()` telah dipanggil
 * secara sinkron oleh UI, token yang telah disimpan sebelum clear akan digunakan untuk
 * menyertakan header `Authorization: Bearer <token>`, sehingga backend Laravel Sanctum
 * dapat me-revoke token tersebut tanpa mengalami HTTP 401 Unauthorized.
 *
 * @param token - Optional Sanctum Bearer token yang akan di-revoke
 */
export async function logoutUser(token?: string): Promise<void> {
  const authToken = token || tokenStorage.getToken();
  if (!authToken) return;

  try {
    await apiClient.post<ApiResponse<null>>(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
  } catch {
    // Intentionally ignored — sesi lokal sudah dibersihkan dan dipastikan aman.
  }
}

export function useLogoutMutation(): UseMutationResult<void, Error, string | undefined> {
  return useMutation({
    mutationFn: (token?: string) => logoutUser(token),
  });
}
