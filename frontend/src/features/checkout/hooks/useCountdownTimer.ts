import { useState, useEffect, useRef } from 'react';

export interface UseCountdownTimerOptions {
  expiresAt: string | null;
  serverTime?: string | null;
  totalDurationSeconds?: number; // default 15 minutes = 900s
  onExpire?: () => void;
}

export interface CountdownTimerState {
  minutes: number;
  seconds: number;
  formatted: string;
  remainingSeconds: number;
  progressPercentage: number;
  isWarning: boolean;
  isCritical: boolean;
  isExpired: boolean;
}

function computeRemainingSeconds(
  expiresAt: string | null,
  serverTime: string | null | undefined,
  totalDurationSeconds: number
): number {
  if (!expiresAt) return totalDurationSeconds;

  const target = new Date(expiresAt).getTime();
  const current = serverTime ? new Date(serverTime).getTime() : Date.now();

  if (isNaN(target) || isNaN(current)) {
    return totalDurationSeconds;
  }

  const diffSeconds = Math.floor((target - current) / 1000);
  return Math.max(0, diffSeconds);
}

export function useCountdownTimer({
  expiresAt,
  serverTime,
  totalDurationSeconds = 900,
  onExpire,
}: UseCountdownTimerOptions): CountdownTimerState {
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    computeRemainingSeconds(expiresAt, serverTime, totalDurationSeconds)
  );

  // Sync remainingSeconds when expiresAt or serverTime changes
  const [prevExpiresAt, setPrevExpiresAt] = useState(expiresAt);
  const [prevServerTime, setPrevServerTime] = useState(serverTime);

  if (prevExpiresAt !== expiresAt || prevServerTime !== serverTime) {
    setPrevExpiresAt(expiresAt);
    setPrevServerTime(serverTime);
    setRemainingSeconds(computeRemainingSeconds(expiresAt, serverTime, totalDurationSeconds));
  }

  const isFinished = remainingSeconds <= 0;

  useEffect(() => {
    if (isFinished) {
      onExpireRef.current?.();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, serverTime, isFinished]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercentage = Math.min(
    100,
    Math.max(0, (remainingSeconds / totalDurationSeconds) * 100)
  );

  const isWarning = remainingSeconds <= 300 && remainingSeconds > 120; // < 5 menit
  const isCritical = remainingSeconds <= 120 && remainingSeconds > 0; // < 2 menit
  const isExpired = remainingSeconds <= 0;

  return {
    minutes,
    seconds,
    formatted,
    remainingSeconds,
    progressPercentage,
    isWarning,
    isCritical,
    isExpired,
  };
}
