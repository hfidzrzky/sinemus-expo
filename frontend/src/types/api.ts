/**
 * Standard API Response Envelope Types
 * Sinkron 100% dengan standar envelope Sinemus Screen (Expo Edition)
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  server_time: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  server_time?: string;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedApiResponse<T, M = PaginationMeta> {
  success: boolean;
  message: string;
  data: T[];
  meta: M;
  server_time: string;
}
