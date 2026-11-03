import { useState, useEffect, useRef } from 'react';

export interface UseMovieRentalCountdownOptions {
  rentalExpiresAt?: string | null;
  serverTime?: string | null;
  isFreeAccess?: boolean;
  onExpire?: () => void;
}

export interface MovieRentalCountdownState {
  remainingSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedTime: string;
  formattedShort: string;
  isExpired: boolean;
  isWarning: boolean;
  isCritical: boolean;
}

function calculateInitialRemaining(
  rentalExpiresAt?: string | null,
  serverTime?: string | null
): number {
  if (!rentalExpiresAt) return -1;
  const target = new Date(rentalExpiresAt).getTime();
  if (isNaN(target)) return -1;
  // SSOT: server_time backend jika ada, fallback ke waktu client jika server_time belum tersedia
  const current = serverTime ? new Date(serverTime).getTime() : Date.now();
  if (isNaN(current)) return -1;
  return Math.floor((target - current) / 1000);
}

/**
 * Headless Hook: Sisa Waktu Sewa Film Digital (SSOT server_time)
 */
export function useMovieRentalCountdown({
  rentalExpiresAt,
  serverTime,
  isFreeAccess = false,
  onExpire,
}: UseMovieRentalCountdownOptions): MovieRentalCountdownState {
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  const isNonExpiring = Boolean(isFreeAccess || !rentalExpiresAt);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    isNonExpiring ? -1 : calculateInitialRemaining(rentalExpiresAt, serverTime)
  );

  const [prevExpiresAt, setPrevExpiresAt] = useState(rentalExpiresAt);
  const [prevServerTime, setPrevServerTime] = useState(serverTime);
  const [prevIsFreeAccess, setPrevIsFreeAccess] = useState(isFreeAccess);

  // Synchronize state during render when props change
  if (
    prevExpiresAt !== rentalExpiresAt ||
    prevServerTime !== serverTime ||
    prevIsFreeAccess !== isFreeAccess
  ) {
    setPrevExpiresAt(rentalExpiresAt);
    setPrevServerTime(serverTime);
    setPrevIsFreeAccess(isFreeAccess);
    setRemainingSeconds(
      isFreeAccess || !rentalExpiresAt ? -1 : calculateInitialRemaining(rentalExpiresAt, serverTime)
    );
  }

  // Hanya expired jika bukan film gratis/tanpa batas dan sisa detik sudah habis
  const isExpired = !isNonExpiring && remainingSeconds <= 0;

  useEffect(() => {
    if (isNonExpiring || isExpired) {
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
  }, [rentalExpiresAt, serverTime, isNonExpiring, isExpired]);

  if (isNonExpiring) {
    return {
      remainingSeconds: -1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formattedTime: 'Akses Penuh',
      formattedShort: 'Akses Penuh',
      isExpired: false,
      isWarning: false,
      isCritical: false,
    };
  }

  const safeSeconds = Math.max(0, remainingSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedTime = isExpired ? '00:00:00' : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const formattedShort = isExpired
    ? 'Masa Sewa Habis'
    : hours > 0
      ? `${hours} Jam ${minutes} Menit`
      : minutes > 0
        ? `${minutes} Menit ${seconds} Detik`
        : `${seconds} Detik`;

  return {
    remainingSeconds,
    hours,
    minutes,
    seconds,
    formattedTime,
    formattedShort,
    isExpired,
    isWarning: !isExpired && safeSeconds <= 2 * 3600 && safeSeconds > 30 * 60, // < 2 jam
    isCritical: !isExpired && safeSeconds <= 30 * 60, // < 30 menit
  };
}
