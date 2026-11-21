import React, { useMemo } from 'react';
import { toast } from 'sonner';
import { Armchair, Clock, Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleSeatMap, SeatItem } from '../types';

interface SeatGridProps {
  seatMap: ScheduleSeatMap;
  selectedSeats: SeatItem[];
  onToggleSeat: (seat: SeatItem) => void;
  maxSeats?: number;
  className?: string;
  previewMode?: boolean;
  previewMessage?: string;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  seatMap,
  selectedSeats,
  onToggleSeat,
  maxSeats = 6,
  className,
  previewMode = false,
  previewMessage,
}) => {
  const { hasVipSeats, totalSellable, availableCount } = useMemo(() => {
    const seats = seatMap.seats || [];
    let vipFound = false;
    let sellable = 0;
    let available = 0;

    for (const seat of seats) {
      if (seat.seat_type === 'aisle' || seat.status === 'disabled') {
        continue;
      }
      sellable += 1;
      if (seat.seat_type === 'vip') {
        vipFound = true;
      }
      if (seat.status === 'available') {
        available += 1;
      }
    }

    return {
      hasVipSeats: vipFound,
      totalSellable: sellable,
      availableCount: available,
    };
  }, [seatMap.seats]);

  const vipPriceLabel = useMemo(() => {
    if (!hasVipSeats) return null;
    if (
      seatMap.vip_ticket_price !== null &&
      seatMap.vip_ticket_price !== undefined &&
      seatMap.vip_ticket_price !== seatMap.ticket_price
    ) {
      return `Rp ${seatMap.vip_ticket_price.toLocaleString('id-ID')}`;
    }
    return null;
  }, [hasVipSeats, seatMap.vip_ticket_price, seatMap.ticket_price]);

  // Map seats by row
  const seatsByRow = useMemo(() => {
    const map = new Map<string, SeatItem[]>();
    seatMap.rows.forEach((row) => {
      map.set(row, []);
    });

    (seatMap.seats || []).forEach((seat) => {
      if (!map.has(seat.row_label)) {
        map.set(seat.row_label, []);
      }
      map.get(seat.row_label)?.push(seat);
    });

    map.forEach((rowSeats) => {
      rowSeats.sort((a, b) => {
        const colA = a.grid_column ?? a.seat_number;
        const colB = b.grid_column ?? b.seat_number;
        return colA - colB;
      });
    });

    return map;
  }, [seatMap]);

  const selectedSeatIds = useMemo(() => {
    return new Set(selectedSeats.map((s) => s.id));
  }, [selectedSeats]);

  if (!seatMap.seats || seatMap.seats.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center space-y-3 py-16 text-center',
          className
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-500">
          <Armchair className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-sans text-sm font-semibold text-white">Denah Kursi Belum Tersedia</h4>
          <p className="max-w-xs text-xs text-neutral-400">
            Denah kursi fisik untuk sesi ini belum dikonfigurasi oleh pengelola venue.
          </p>
        </div>
      </div>
    );
  }

  const handleSeatClick = (seat: SeatItem) => {
    if (previewMode) {
      toast.info(
        previewMessage ||
          'Mode Pratinjau: Pemilihan kursi akan dibuka saat jendela penjualan tiket dimulai.'
      );
      return;
    }

    if (seat.seat_type === 'aisle' || seat.status === 'disabled') {
      return;
    }
    if (seat.status === 'booked') {
      toast.error(`Kursi ${seat.seat_code} sudah terjual.`);
      return;
    }
    if (seat.status === 'locked') {
      toast.warning(`Kursi ${seat.seat_code} sedang dalam proses pembayaran penonton lain.`);
      return;
    }

    const isAlreadySelected = selectedSeatIds.has(seat.id);

    if (!isAlreadySelected && selectedSeats.length >= maxSeats) {
      toast.warning(`Maksimal pemesanan adalah ${maxSeats} kursi per transaksi.`);
      return;
    }

    onToggleSeat(seat);
  };

  return (
    <div className={cn('flex w-full select-none flex-col items-center', className)}>
      {/* 0. PREVIEW MODE NOTICE (Flat, zero neon) */}
      {previewMode && (
        <div className="mb-5 flex w-full max-w-lg items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-300">
          <Lock className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {previewMessage ||
              'Mode Pratinjau Studio — Pemilihan kursi dibuka serentak saat jendela penjualan tiket dimulai.'}
          </span>
        </div>
      )}

      {/* 1. MINIMALIST ARCHITECTURAL CINEMA SCREEN (Zero blur / zero glow) */}
      <div className="mb-7 flex w-full max-w-xs flex-col items-center sm:mb-9 sm:max-w-md md:max-w-lg">
        <div className="h-2 w-full rounded-t-full border-t-2 border-[#0066FF]" />
        <span className="mt-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          Layar Bioskop
        </span>
      </div>

      {/* 2. SEAT MATRIX CONTAINER */}
      <div className="vercel-scrollbar w-full overflow-x-auto pb-3">
        <div className="mx-auto w-fit space-y-2 px-1 text-left sm:space-y-2.5 sm:px-4">
          {Array.from(seatsByRow.entries()).map(([rowLabel, rowSeats]) => (
            <div key={rowLabel} className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Left Row Label */}
              <span className="w-4 text-center font-mono text-[10px] font-medium text-neutral-500 sm:w-5 sm:text-xs">
                {rowLabel}
              </span>

              {/* Row Seats */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {rowSeats.map((seat) => renderSeatButton(seat))}
              </div>

              {/* Right Row Label */}
              <span className="w-4 text-center font-mono text-[10px] font-medium text-neutral-500 sm:w-5 sm:text-xs">
                {rowLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. OCCUPANCY MICRO-SUMMARY & STRUCTURED LEGEND (Status Lifecycle | Tier Category) */}
      <div className="mt-6 w-full max-w-2xl border-t border-neutral-800/80 pt-4 sm:mt-8">
        {/* Live Availability Counter */}
        <div className="mb-3.5 flex items-center justify-center">
          <span className="font-mono text-[11px] tabular-nums text-neutral-400">
            <span className="font-semibold text-white">{availableCount}</span> dari{' '}
            <span>{totalSellable}</span> kursi tersedia
          </span>
        </div>

        {/* Dual-Encoded Legend (1:1 visual match with seat grid) */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 text-[11px] sm:gap-x-5 sm:text-xs">
          {/* Group 1: Lifecycle Statuses */}
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center rounded border border-neutral-700 bg-neutral-900 font-mono text-[9px] font-medium text-neutral-300 sm:h-5 sm:w-5 sm:rounded-md"
            >
              1
            </span>
            <span className="text-neutral-300">Tersedia</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center rounded border border-[#0066FF] bg-[#0066FF] font-mono text-[9px] font-semibold text-white sm:h-5 sm:w-5 sm:rounded-md"
            >
              1
            </span>
            <span className="font-medium text-white">Pilihan Anda</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center rounded border border-dashed border-amber-500/50 bg-neutral-950 text-amber-400/80 sm:h-5 sm:w-5 sm:rounded-md"
            >
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </span>
            <span className="text-neutral-400">Sedang Dipesan</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center rounded border border-neutral-800/70 bg-neutral-950 text-neutral-600 sm:h-5 sm:w-5 sm:rounded-md"
            >
              <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={2.25} />
            </span>
            <span className="text-neutral-500">Terjual</span>
          </div>

          {/* Group 2: Tier Category (Separated visually from Lifecycle Status) */}
          {hasVipSeats && (
            <>
              <span aria-hidden="true" className="hidden h-4 w-px bg-neutral-800 sm:inline-block" />
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="relative flex h-4 w-4 items-center justify-center rounded border border-amber-500/60 bg-amber-500/10 font-mono text-[9px] font-semibold text-amber-300 sm:h-5 sm:w-5 sm:rounded-md"
                >
                  <span className="absolute inset-x-1 top-0 h-[1.5px] rounded-full bg-amber-400/80" />
                  1
                </span>
                <span className="text-amber-300">
                  VIP
                  {vipPriceLabel && (
                    <span className="ml-1 font-mono text-[10px] tabular-nums text-neutral-400">
                      ({vipPriceLabel})
                    </span>
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  function renderSeatButton(seat: SeatItem) {
    if (seat.seat_type === 'aisle' || seat.status === 'disabled') {
      return <div key={seat.id} className="h-7 w-7 sm:h-8 sm:w-8" />;
    }

    const isSelected = selectedSeatIds.has(seat.id);
    const isAvailable = seat.status === 'available';
    const isLocked = seat.status === 'locked';
    const isBooked = seat.status === 'booked';
    const isVip = seat.seat_type === 'vip';
    const isUnavailable = isBooked || isLocked;

    const statusText = isSelected
      ? 'Pilihan Anda'
      : isBooked
        ? 'Terjual'
        : isLocked
          ? 'Sedang dipesan penonton lain'
          : 'Tersedia';

    const seatLabel = `Kursi ${seat.seat_code}${isVip ? ' (VIP)' : ''} — ${statusText}`;

    return (
      <button
        key={seat.id}
        type="button"
        aria-disabled={isUnavailable}
        aria-pressed={isAvailable ? isSelected : undefined}
        aria-label={seatLabel}
        title={seatLabel}
        onClick={() => handleSeatClick(seat)}
        className={cn(
          'relative flex h-7 w-7 items-center justify-center rounded-md border font-mono text-[10px] font-medium tabular-nums transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-1 focus-visible:ring-offset-black sm:h-8 sm:w-8 sm:rounded-lg sm:text-xs',
          // 1. Selected (Pilihan Anda)
          isSelected &&
            'z-10 cursor-pointer border-[#0066FF] bg-[#0066FF] font-semibold text-white active:scale-95',
          // 2. Available VIP
          isAvailable &&
            !isSelected &&
            isVip &&
            'cursor-pointer border-amber-500/60 bg-amber-500/10 font-semibold text-amber-300 hover:border-amber-400 hover:bg-amber-500/20 active:scale-95',
          // 3. Available Standard
          isAvailable &&
            !isSelected &&
            !isVip &&
            'cursor-pointer border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800 hover:text-white active:scale-95',
          // 4. Locked (Sedang Dipesan — dashed border + Clock icon)
          isLocked &&
            'cursor-not-allowed border-dashed border-amber-500/50 bg-neutral-950 text-amber-400/80',
          // 5. Booked (Terjual — recessed dark surface + X icon)
          isBooked && 'cursor-not-allowed border-neutral-800/70 bg-neutral-950 text-neutral-700'
        )}
      >
        {/* Top Hairline Accent for Available VIP */}
        {isAvailable && !isSelected && isVip && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1.5 top-0 h-[1.5px] rounded-full bg-amber-400/80"
          />
        )}

        {/* Subtle Corner Marker when VIP seat is Selected */}
        {isSelected && isVip && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-300"
          />
        )}

        {/* Dual Visual Encoding Content: X for Booked, Clock for Locked, Number for Available/Selected */}
        {isBooked ? (
          <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.25} aria-hidden="true" />
        ) : isLocked ? (
          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
        ) : (
          seat.seat_number
        )}
      </button>
    );
  }
};
