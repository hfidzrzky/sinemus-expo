import { useState, useEffect, useMemo, useRef } from 'react';

export interface PresaleCountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalRemainingMs: number;
  formatted: string;
}

export interface UsePresaleCountdownProps {
  targetDate?: string | null;
  serverTime?: string | null;
  onExpire?: () => void;
}

/**
 * Pure calculation helper untuk sisa waktu hitung mundur
 */
export function calculateRemainingTime(
  targetTimeMs: number,
  currentTimeMs: number
): PresaleCountdownResult {
  const totalRemainingMs = Math.max(0, targetTimeMs - currentTimeMs);
  const isExpired = totalRemainingMs <= 0;

  if (isExpired) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalRemainingMs: 0,
      formatted: '00:00:00',
    };
  }

  const totalSeconds = Math.floor(totalRemainingMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted =
    days > 0
      ? `${days}h ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalRemainingMs,
    formatted,
  };
}

/**
 * Headless hook presisi 1 detik untuk countdown presale real-time
 */
export function usePresaleCountdown({
  targetDate,
  serverTime,
  onExpire,
}: UsePresaleCountdownProps): PresaleCountdownResult {
  const targetTimeMs = useMemo(() => {
    if (!targetDate) return 0;
    const parsed = new Date(targetDate).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }, [targetDate]);

  // Initial time synchronized with serverTime if provided
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => {
    if (serverTime) {
      const parsed = new Date(serverTime).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    return Date.now();
  });

  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const hasFiredExpire = useRef(false);

  useEffect(() => {
    if (!targetTimeMs) return;

    // Tick every 1 second
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTimeMs(now);

      if (now >= targetTimeMs && !hasFiredExpire.current) {
        hasFiredExpire.current = true;
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTimeMs]);

  return useMemo(() => {
    if (!targetTimeMs) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        totalRemainingMs: 0,
        formatted: '00:00:00',
      };
    }
    return calculateRemainingTime(targetTimeMs, currentTimeMs);
  }, [targetTimeMs, currentTimeMs]);
}
