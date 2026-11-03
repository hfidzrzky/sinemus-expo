import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '@/types/api';
import { tokenStorage } from '@/lib/token-storage';
import { extractRetryAfterSeconds, getFriendlyErrorMessage } from '@/lib/error-formatter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Axios instance dengan base URL dan default headers untuk API Sinemus.
 *
 * Konfigurasi:
 * - baseURL: dari VITE_API_BASE_URL env var (fallback ke /api/v1 untuk proxy)
 * - Content-Type: application/json (standar Laravel API)
 * - Accept: application/json (trigger JSON response dari Laravel)
 * - timeout: 15 detik (toleransi untuk koneksi lambat)
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// ---------------------------------------------------------------------------
// Request Interceptor: Attach Sanctum Bearer Token
//
// Membaca token dari tokenStorage (centralized) — bukan langsung dari localStorage.
// Token disertakan sebagai Authorization header pada setiap request.
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Representasi baku error API pada platform Sinemus (SSOT).
 * Membawa metadata status HTTP, durasi retry-after (jika rate limited), dan error code.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly retryAfter?: number;
  public readonly code?: string;
  public readonly rawData?: unknown;

  constructor(
    message: string,
    status = 500,
    retryAfter?: number,
    code?: string,
    rawData?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfter = retryAfter;
    this.code = code;
    this.rawData = rawData;
  }
}

// ---------------------------------------------------------------------------
// Response Interceptor: Error Normalization & Session Expiry Guard
//
// - HTTP 401: token expired atau invalid → bersihkan storage via tokenStorage
//   (bukan direct localStorage) agar konsisten dengan tokenStorage contract.
//   AuthContext akan mendeteksi tokenStorage kosong saat re-render berikutnya.
// - Error lain: normalisasi pesan error ke ApiError dengan metadata lengkap.
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      // Bersihkan credential via tokenStorage — satu titik akses
      tokenStorage.clear();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sinemus:auth:session-expired'));
      }
    }

    const friendlyErrorMessage = getFriendlyErrorMessage(error);
    const retryAfter = extractRetryAfterSeconds(error) ?? undefined;
    const status = error.response?.status ?? 500;
    const code = error.code;
    const rawData = error.response?.data;

    return Promise.reject(new ApiError(friendlyErrorMessage, status, retryAfter, code, rawData));
  }
);

export default apiClient;
