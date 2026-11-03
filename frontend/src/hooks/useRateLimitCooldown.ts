import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api-client';

export interface UseRateLimitCooldownOptions {
  /**
   * Durasi fallback (detik) jika respons 429 tidak menyertakan Retry-After.
   * Default: 60 detik.
   */
  defaultSeconds?: number;
  /**
   * Callback yang dipanggil saat cooldown selesai (mencapai 0).
   */
  onFinish?: () => void;
}

export interface UseRateLimitCooldownReturn {
  /**
   * Sisa detik waktu tunggu cooldown.
   */
  cooldownSeconds: number;
  /**
   * Status apakah sistem saat ini sedang dalam masa cooldown rate limit.
   */
  isCooldownActive: boolean;
  /**
   * Pemicu cooldown: dapat menerima objek error (ApiError), number detik, atau error sembarang.
   */
  triggerCooldown: (secondsOrError: number | unknown) => void;
  /**
   * Reset cooldown secara instan ke 0.
   */
  resetCooldown: () => void;
}

/**
 * Headless Hook Reusable untuk Manajemen State Rate Limit Cooldown (SRP & SSOT).
 * Menghitung mundur detik cooldown secara reaktif per 1 detik dan otomatis nonaktif saat 0.
 */
export function useRateLimitCooldown(
  options?: UseRateLimitCooldownOptions
): UseRateLimitCooldownReturn {
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          options?.onFinish?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds, options]);

  const triggerCooldown = useCallback(
    (secondsOrError: number | unknown) => {
      if (typeof secondsOrError === 'number') {
        setCooldownSeconds(Math.max(1, secondsOrError));
        return;
      }

      if (secondsOrError instanceof ApiError && secondsOrError.status === 429) {
        const waitSeconds = secondsOrError.retryAfter ?? options?.defaultSeconds ?? 60;
        setCooldownSeconds(Math.max(1, waitSeconds));
        return;
      }

      // Fallback aman untuk error 429 umum
      const waitSeconds = options?.defaultSeconds ?? 60;
      setCooldownSeconds(Math.max(1, waitSeconds));
    },
    [options?.defaultSeconds]
  );

  const resetCooldown = useCallback(() => {
    setCooldownSeconds(0);
  }, []);

  return {
    cooldownSeconds,
    isCooldownActive: cooldownSeconds > 0,
    triggerCooldown,
    resetCooldown,
  };
}
