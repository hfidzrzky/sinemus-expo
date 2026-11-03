import { useState, useEffect, useMemo } from 'react';

export type PresalePhase = 'unconfigured' | 'upcoming' | 'live' | 'ended';

export interface PresaleStatusInfo {
  phase: PresalePhase;
  label: string;
  shortLabel: string;
  badgeStyle: string;
  tone: 'neutral' | 'warning' | 'active' | 'error';
  canBook: boolean;
  ctaText: string;
  cta: string;
  isLive: boolean;
  formattedDate?: string;
}

/**
 * Pure calculation function for Presale & Regular Sales Lifecycle Status.
 * Pure, deterministic, and idempotent.
 * Memperhitungkan sales window (startAt, endAt) dan waktu penayangan selesai (concludesAt).
 */
export function calculatePresaleStatus(
  startAt?: string | null,
  endAt?: string | null,
  currentTimeMs = 0,
  isPresale = true,
  concludesAt?: string | null
): PresaleStatusInfo {
  const start = startAt ? new Date(startAt).getTime() : null;
  const salesEnd = endAt ? new Date(endAt).getTime() : null;
  const concludes = concludesAt ? new Date(concludesAt).getTime() : null;

  // Waktu efektif berakhirnya penayangan: prioritaskan event_concludes_at jika disetel
  const effectiveEnd = concludes ?? salesEnd;
  const prefix = isPresale ? 'Presale' : 'Penjualan Tiket';

  if (!start && !salesEnd && !concludes) {
    return {
      phase: 'unconfigured',
      label: isPresale ? 'Presale Bioskop' : 'Tiket Tersedia',
      shortLabel: isPresale ? 'Presale' : 'Reguler',
      badgeStyle: 'bg-neutral-900/80 text-neutral-300 border-neutral-800',
      tone: 'neutral',
      canBook: true,
      ctaText: 'Pilih Kursi',
      cta: 'PILIH KURSI',
      isLive: false,
    };
  }

  // 1. Upcoming Phase: sebelum penjualan dibuka
  if (start && currentTimeMs < start) {
    const startDate = new Date(start);
    const shortStartDate = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
    }).format(startDate);

    const fullStartDate = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(startDate);

    return {
      phase: 'upcoming',
      label: `${prefix} Dibuka: ${shortStartDate}`,
      shortLabel: `Buka ${shortStartDate}`,
      badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      tone: 'warning',
      canBook: false,
      ctaText: `${prefix} Belum Dibuka`,
      cta: 'LIHAT JADWAL',
      isLive: false,
      formattedDate: `${fullStartDate} WIB`,
    };
  }

  // 2. Ended Phase: seluruh acara telah selesai (setelah concludesAt atau salesEnd)
  if (effectiveEnd && currentTimeMs > effectiveEnd) {
    return {
      phase: 'ended',
      label: `Acara Telah Berakhir`,
      shortLabel: `Selesai`,
      badgeStyle: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      tone: 'neutral',
      canBook: false,
      ctaText: 'Acara Selesai',
      cta: 'ACARA SELESAI',
      isLive: false,
    };
  }

  // 3. Sales Ended Phase: penjualan tiket ditutup tetapi acara masih berjalan (menjelang tayang)
  if (salesEnd && currentTimeMs > salesEnd && effectiveEnd && currentTimeMs <= effectiveEnd) {
    const endDate = new Date(effectiveEnd);
    const shortEndDate = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
    }).format(endDate);

    const fullEndDate = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(endDate);

    return {
      phase: 'ended',
      label: `Tiket Ditutup • Acara s/d ${shortEndDate}`,
      shortLabel: `Tiket Tutup`,
      badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      tone: 'warning',
      canBook: false,
      ctaText: 'Tiket Ditutup',
      cta: 'TIKET DITUTUP',
      isLive: false,
      formattedDate: `${fullEndDate} WIB`,
    };
  }

  // 4. Live Phase: penjualan tiket sedang aktif (Opsi 1: Minimalis & Lugas Tiket)
  if (salesEnd || effectiveEnd) {
    const targetEndDate = new Date(salesEnd ?? effectiveEnd!);
    const shortDateStr = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
    }).format(targetEndDate);

    const fullDateStr = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(targetEndDate);

    const activeLabel = isPresale
      ? `Presale Aktif • Tiket s/d ${shortDateStr}`
      : `Beli Tiket • s/d ${shortDateStr}`;

    return {
      phase: 'live',
      label: activeLabel,
      shortLabel: `${prefix} • s/d ${shortDateStr}`,
      badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      tone: 'active',
      canBook: true,
      ctaText: 'Beli Tiket',
      cta: 'PILIH KURSI',
      isLive: true,
      formattedDate: `${fullDateStr} WIB`,
    };
  }

  return {
    phase: 'live',
    label: `${prefix} Sedang Berlangsung`,
    shortLabel: `${prefix} Aktif`,
    badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    tone: 'active',
    canBook: true,
    ctaText: 'Beli Tiket',
    cta: 'PILIH KURSI',
    isLive: true,
  };
}

/**
 * Headless React Hook to observe sales status safely without impure render violations.
 * Updates periodically via internal effect timer to keep badges reactive.
 */
export function usePresaleStatus(
  startAt?: string | null,
  endAt?: string | null,
  serverTime?: string | null,
  isPresale = true,
  concludesAt?: string | null
): PresaleStatusInfo {
  // Initialize with serverTime or client initial time in a pure state initializer
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => {
    if (serverTime) {
      const parsed = new Date(serverTime).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    return Date.now();
  });

  useEffect(() => {
    // Keep time fresh every 15 seconds so upcoming -> live -> ended transitions happen in real-time
    const interval = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    return calculatePresaleStatus(startAt, endAt, currentTimeMs, isPresale, concludesAt);
  }, [startAt, endAt, currentTimeMs, isPresale, concludesAt]);
}
