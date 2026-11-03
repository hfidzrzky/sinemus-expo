import { isAxiosError } from 'axios';

/**
 * Ekstraksi estimasi waktu tunggu (detik) dari header response rate limiting (HTTP 429).
 */
export function extractRetryAfterSeconds(error: unknown): number | null {
  if (!isAxiosError(error) || !error.response) return null;

  const headers = error.response.headers;
  if (!headers) return null;

  // 1. Periksa header standar 'retry-after'
  const retryAfterHeader = headers['retry-after'] ?? headers['Retry-After'];
  if (retryAfterHeader) {
    const parsed = parseInt(String(retryAfterHeader), 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // 2. Periksa header 'x-ratelimit-reset' (Unix timestamp)
  const resetHeader = headers['x-ratelimit-reset'] ?? headers['X-RateLimit-Reset'];
  if (resetHeader) {
    const resetTime = parseInt(String(resetHeader), 10);
    if (!isNaN(resetTime)) {
      const now = Math.floor(Date.now() / 1000);
      const diff = resetTime - now;
      if (diff > 0) return diff;
    }
  }

  return null;
}

/**
 * Normalisasi dan format error teknis/API menjadi pesan yang ramah pengguna (UX friendly),
 * profesional, serta aman untuk produksi (zero detail sensitif/stack trace leak).
 *
 * @param error - Objek error yang ditangkap dari try/catch (AxiosError, Error, dsb)
 * @param defaultFallback - Pesan default jika error tidak dapat diidentifikasi
 * @returns Pesan deskriptif dan ramah pengguna dalam Bahasa Indonesia
 */
export function getFriendlyErrorMessage(
  error: unknown,
  defaultFallback = 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.'
): string {
  if (!error) return defaultFallback;

  // 1. Error dari Axios HTTP Client (Network error, Server status error, Timeout)
  if (isAxiosError(error)) {
    // A. Timeout & Network Connection Failures
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'Waktu koneksi habis. Silakan periksa koneksi internet Anda dan coba lagi.';
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Gagal terhubung ke server Sinemus. Pastikan koneksi internet Anda aktif.';
    }

    const status = error.response.status;
    const backendMessage = error.response.data?.message;

    // B. HTTP Status Code Handling
    switch (status) {
      case 400:
        return (
          backendMessage || 'Permintaan tidak dapat diproses. Silakan periksa kembali data Anda.'
        );

      case 401:
        return 'Sesi login Anda telah berakhir. Silakan masuk kembali ke akun Anda.';

      case 403:
        return 'Anda tidak memiliki izin akses untuk melakukan tindakan ini.';

      case 404:
        return 'Data yang diminta tidak ditemukan atau telah diperbarui.';

      case 409:
        return backendMessage || 'Terjadi konflik data. Silakan muat ulang halaman dan coba lagi.';

      case 422: {
        // Validasi FormRequest Laravel — utamakan pesan error field spesifik
        const errors = error.response?.data?.errors;
        if (errors && typeof errors === 'object') {
          const firstField = Object.keys(errors)[0];
          const firstMessage = Array.isArray(errors[firstField]) ? errors[firstField][0] : null;
          if (firstMessage) return firstMessage;
        }

        if (
          backendMessage &&
          typeof backendMessage === 'string' &&
          !backendMessage.toLowerCase().includes('validation')
        ) {
          return backendMessage;
        }

        return 'Data yang Anda masukkan tidak memenuhi kriteria validasi.';
      }

      case 429: {
        const retryAfter = extractRetryAfterSeconds(error);
        if (retryAfter && retryAfter > 0) {
          return `Batas frekuensi permintaan tercapai (Rate Limit). Silakan tunggu ${retryAfter} detik sebelum mencoba kembali.`;
        }
        return 'Terlalu banyak permintaan dalam waktu singkat (Rate Limit). Silakan tunggu sekitar 1 menit sebelum mencoba kembali.';
      }

      case 500:
      case 502:
      case 503:
      case 504:
        return 'Layanan kami sedang dalam penanganan teknis. Silakan coba beberapa saat lagi.';

      default:
        return backendMessage || defaultFallback;
    }
  }

  // 2. Standard Error Object
  if (error instanceof Error) {
    const msg = error.message;

    // Filter pesan error teknis umum
    if (msg.includes('Network Error') || msg.includes('Failed to fetch')) {
      return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    }
    if (msg.includes('popup_closed_by_user')) {
      return 'Proses masuk Google dibatalkan karena jendela autentikasi ditutup.';
    }

    return msg;
  }

  return defaultFallback;
}
