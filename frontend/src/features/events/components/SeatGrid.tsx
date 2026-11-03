import React, { useMemo } from 'react';
import { toast } from 'sonner';
import { Armchair, Lock } from 'lucide-react';
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
  const hasVipSeats = useMemo(
    () => seatMap.seats?.some((s) => s.seat_type === 'vip') ?? false,
    [seatMap]
  );

  // Map seats by row
  const seatsByRow = useMemo(() => {
    const map = new Map<string, SeatItem[]>();
    // Sort rows based on rows array
    seatMap.rows.forEach((row) => {
      map.set(row, []);
    });

    (seatMap.seats || []).forEach((seat) => {
      if (!map.has(seat.row_label)) {
        map.set(seat.row_label, []);
      }
      map.get(seat.row_label)?.push(seat);
    });

    // Sort seats in each row by grid_column if available, otherwise fallback to seat_number
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
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-neutral-500">
          <Armchair className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Denah Kursi Belum Tersedia</h4>
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
          'Mode Pratinjau: Pemilihan kursi akan dibuka saat hitung mundur presale berakhir.'
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
      toast.warning(`Kursi ${seat.seat_code} sedang dipesan oleh penonton lain.`);
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
      {/* 0. PREVIEW MODE FLOATING BANNER */}
      {previewMode && (
        <div className="animate-in fade-in mb-5 flex w-full max-w-lg items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-300 shadow-lg backdrop-blur-sm duration-200">
          <Lock className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {previewMessage ||
              'Mode Pratinjau Studio — Pemilihan kursi dibuka serentak saat hitung mundur presale berakhir.'}
          </span>
        </div>
      )}

      {/* 1. CINEMA SCREEN ARC (Layar Bioskop Melengkung) */}
      <div className="mb-6 flex w-full max-w-sm flex-col items-center sm:mb-10 sm:max-w-xl md:max-w-2xl">
        {/* Glow Curved Arc */}
        <div className="relative flex w-full flex-col items-center px-2 sm:px-4">
          <div className="h-2.5 w-full rounded-[50%] border-t border-cyan-300/60 bg-gradient-to-b from-cyan-400 via-[#0066FF] to-transparent shadow-[0_4px_24px_rgba(0,102,255,0.45)] sm:h-3" />
          <div className="pointer-events-none h-6 w-3/4 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent blur-md sm:h-8" />
          <span className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.25em] text-neutral-400 sm:text-[10px] sm:tracking-[0.3em]">
            LAYAR BIOSKOP (SCREEN)
          </span>
        </div>
      </div>

      {/* 2. SEAT MATRIX CONTAINER (Scrollable on mobile without clipping) */}
      <div className="vercel-scrollbar w-full overflow-x-auto pb-4">
        <div className="mx-auto w-fit space-y-2 px-1 text-left sm:space-y-2.5 sm:px-4">
          {Array.from(seatsByRow.entries()).map(([rowLabel, rowSeats]) => (
            <div key={rowLabel} className="flex items-center justify-center gap-1.5 sm:gap-2">
              {/* Left Row Label */}
              <span className="w-4 text-center font-mono text-[10px] font-bold text-neutral-500 sm:w-5 sm:text-xs">
                {rowLabel}
              </span>

              {/* Row Seats: follow admin configuration exactly */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {rowSeats.map((seat) => renderSeatButton(seat))}
              </div>

              {/* Right Row Label */}
              <span className="w-4 text-center font-mono text-[10px] font-bold text-neutral-500 sm:w-5 sm:text-xs">
                {rowLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SEAT STATUS LEGENDA (4 Status + Optional VIP) */}
      <div className="mt-6 flex w-full max-w-lg flex-wrap items-center justify-center gap-2.5 border-t border-neutral-900 pt-4 text-[10px] sm:mt-8 sm:gap-4 sm:text-xs">
        {/* Available */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-3 w-3 rounded border border-neutral-700 bg-neutral-800 sm:h-4 sm:w-4 sm:rounded-md" />
          <span className="text-neutral-400">Tersedia</span>
        </div>

        {/* VIP */}
        {hasVipSeats && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-3 w-3 rounded border border-amber-500/60 bg-amber-500/15 sm:h-4 sm:w-4 sm:rounded-md" />
            <span className="text-amber-400">VIP</span>
          </div>
        )}

        {/* Selected */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-3 w-3 rounded border border-blue-500 bg-blue-600 sm:h-4 sm:w-4 sm:rounded-md" />
          <span className="font-medium text-white">Pilihan Anda</span>
        </div>

        {/* Locked (Yellow) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-3 w-3 rounded border border-amber-500/40 bg-amber-500/20 sm:h-4 sm:w-4 sm:rounded-md" />
          <span className="text-neutral-400">Terkunci (15m)</span>
        </div>

        {/* Booked (Red) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-3 w-3 rounded border border-neutral-800/80 bg-neutral-900 line-through sm:h-4 sm:w-4 sm:rounded-md" />
          <span className="text-neutral-500">Terjual</span>
        </div>
      </div>
    </div>
  );

  function renderSeatButton(seat: SeatItem) {
    if (seat.seat_type === 'aisle' || seat.status === 'disabled') {
      return <div key={seat.id} className="h-6 w-6 sm:h-8 sm:w-8" />;
    }

    const isSelected = selectedSeatIds.has(seat.id);
    const isAvailable = seat.status === 'available';
    const isLocked = seat.status === 'locked';
    const isBooked = seat.status === 'booked';
    const isVip = seat.seat_type === 'vip';

    return (
      <button
        key={seat.id}
        type="button"
        disabled={isBooked || isLocked}
        onClick={() => handleSeatClick(seat)}
        aria-label={`Kursi ${seat.seat_code}${isVip ? ' (VIP)' : ''}, status ${isSelected ? 'terpilih' : seat.status}`}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded font-mono text-[9px] font-bold transition-all duration-150 sm:h-8 sm:w-8 sm:rounded-lg sm:text-xs',
          // Selected
          isSelected &&
            'z-10 scale-105 border border-blue-500 bg-blue-600 font-semibold text-white',
          // Available VIP
          isAvailable &&
            !isSelected &&
            isVip &&
            'cursor-pointer border border-amber-500/60 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20',
          // Available Standard
          isAvailable &&
            !isSelected &&
            !isVip &&
            'cursor-pointer border border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-700',
          // Locked
          isLocked &&
            'cursor-not-allowed border border-amber-600/30 bg-amber-950/20 text-amber-500/50',
          // Booked
          isBooked &&
            'cursor-not-allowed border border-neutral-800/80 bg-neutral-900 text-neutral-600 line-through'
        )}
      >
        {seat.seat_number}
      </button>
    );
  }
};
