import { useState, useEffect, useMemo } from 'react';

export type EventSalesPhase = 'unconfigured' | 'upcoming' | 'live' | 'ended' | 'concluded';

export interface EventSalesStatusInfo {
  phase: EventSalesPhase;
  isUpcoming: boolean;
  isLive: boolean;
  isEnded: boolean;
  isConcluded: boolean;
  canBook: boolean;
  cta: string;
  label: string;
  shortLabel: string;
  badgeStyle: string;
}

/**
 * Pure calculation function for Event Sales Lifecycle Status (SSOT)
 */
export function calculateEventSalesStatus(
  salesStartAt?: string | null,
  salesEndAt?: string | null,
  currentTimeMs?: number,
  eventConcludesAt?: string | null
): EventSalesStatusInfo {
  const now = currentTimeMs ?? Date.now();

  // 1. Cek apakah acara sudah selesai sepenuhnya (Concluded / Auto-Draft)
  if (eventConcludesAt) {
    const concludesMs = new Date(eventConcludesAt).getTime();
    if (!isNaN(concludesMs) && now >= concludesMs) {
      return {
        phase: 'concluded',
        isUpcoming: false,
        isLive: false,
        isEnded: true,
        isConcluded: true,
        canBook: false,
        cta: 'SELESAI',
        label: 'Penayangan Selesai (Draf)',
        shortLabel: 'Selesai',
        badgeStyle: 'border-neutral-800 bg-neutral-900/60 text-neutral-400',
      };
    }
  }

  // 2. Jika tidak ada sales_start_at & sales_end_at, default aktif
  if (!salesStartAt && !salesEndAt) {
    return {
      phase: 'live',
      isUpcoming: false,
      isLive: true,
      isEnded: false,
      isConcluded: false,
      canBook: true,
      cta: 'PILIH KURSI',
      label: 'Tiket Tersedia',
      shortLabel: 'Tersedia',
      badgeStyle: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400',
    };
  }

  const startMs = salesStartAt ? new Date(salesStartAt).getTime() : null;
  const endMs = salesEndAt ? new Date(salesEndAt).getTime() : null;

  // 3. Fase Upcoming: Waktu sekarang belum mencapai sales_start_at
  if (startMs && !isNaN(startMs) && now < startMs) {
    const startDate = new Date(salesStartAt!);
    const dateFormatted = startDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      phase: 'upcoming',
      isUpcoming: true,
      isLive: false,
      isEnded: false,
      isConcluded: false,
      canBook: false,
      cta: 'SEGERA DIBUKA',
      label: `Buka ${dateFormatted} WIB`,
      shortLabel: 'Segera Buka',
      badgeStyle: 'border-blue-500/30 bg-blue-950/40 text-blue-400',
    };
  }

  // 4. Fase Ended: Waktu sekarang telah melewati sales_end_at
  if (endMs && !isNaN(endMs) && now > endMs) {
    return {
      phase: 'ended',
      isUpcoming: false,
      isLive: false,
      isEnded: true,
      isConcluded: false,
      canBook: false,
      cta: 'TIKET DITUTUP',
      label: 'Penjualan Ditutup',
      shortLabel: 'Ditutup',
      badgeStyle: 'border-neutral-700 bg-neutral-900/70 text-neutral-400',
    };
  }

  // 5. Fase Live: Penjualan tiket sedang berlangsung aktif
  const endFormatted = salesEndAt
    ? new Date(salesEndAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return {
    phase: 'live',
    isUpcoming: false,
    isLive: true,
    isEnded: false,
    isConcluded: false,
    canBook: true,
    cta: 'PILIH KURSI',
    label: endFormatted ? `Tiket Buka • s/d ${endFormatted} WIB` : 'Tiket Tersedia',
    shortLabel: 'Tersedia',
    badgeStyle:
      'border-emerald-500/30 bg-emerald-950/40 text-emerald-400 shadow-sm shadow-emerald-950/20',
  };
}

/**
 * Headless hook untuk status real-time siklus penjualan tiket.
 * Melakukan auto-refresh status setiap 30 detik untuk akurasi UI penonton.
 */
export function useEventSalesStatus(
  salesStartAt?: string | null,
  salesEndAt?: string | null,
  eventConcludesAt?: string | null
): EventSalesStatusInfo {
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    return calculateEventSalesStatus(salesStartAt, salesEndAt, currentTimeMs, eventConcludesAt);
  }, [salesStartAt, salesEndAt, currentTimeMs, eventConcludesAt]);
}
