import React from 'react';
import { Minus, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleItem } from '../types';

interface GeneralAdmissionSelectorProps {
  schedule: ScheduleItem;
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  maxTickets?: number;
  className?: string;
}

export const GeneralAdmissionSelector: React.FC<GeneralAdmissionSelectorProps> = ({
  schedule,
  quantity,
  onQuantityChange,
  maxTickets = 6,
  className,
}) => {
  const availableQuota = schedule.available_seats_count;
  const effectiveMax = Math.min(maxTickets, availableQuota);
  const isSoldOut = availableQuota <= 0;

  const handleDecrement = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < effectiveMax) {
      onQuantityChange(quantity + 1);
    }
  };

  const subtotal = quantity * schedule.ticket_price;
  const quotaPercentage = Math.round(
    ((schedule.total_seats - availableQuota) / (schedule.total_seats || 1)) * 100
  );

  return (
    <div
      className={cn(
        'space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6',
        className
      )}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Tiket Masuk Umum (General Admission)
            </h4>
          </div>
          <p className="text-xs text-neutral-400">
            Penonton bebas memilih posisi duduk atau berdiri di area auditorium saat masuk venue
            (*First Come, First Served*).
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[10px] font-bold uppercase text-neutral-500">Harga Satuan</p>
          <p className="text-base font-extrabold text-white">
            {schedule.formatted_ticket_price ||
              `Rp ${schedule.ticket_price.toLocaleString('id-ID')}`}
          </p>
        </div>
      </div>

      {/* Quota Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Users className="h-3.5 w-3.5 text-neutral-500" />
            <span>Kapasitas Venue</span>
          </div>
          <span
            className={cn(
              'font-semibold',
              isSoldOut
                ? 'text-red-400'
                : availableQuota <= 10
                  ? 'text-amber-400'
                  : 'text-neutral-300'
            )}
          >
            {isSoldOut
              ? 'Tiket Habis'
              : `Tersisa ${availableQuota} dari ${schedule.total_seats} Tiket`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              quotaPercentage > 85 ? 'bg-amber-500' : 'bg-[#0066FF]'
            )}
            style={{ width: `${quotaPercentage}%` }}
          />
        </div>
      </div>

      {/* Stepper Counter & Subtotal Calculation */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-neutral-800/80 pt-4 sm:flex-row">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-neutral-400">Jumlah Tiket:</span>
          <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-1">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1 || isSoldOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Kurangi jumlah tiket"
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="w-8 text-center font-mono text-sm font-bold text-white">
              {quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrement}
              disabled={quantity >= effectiveMax || isSoldOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Tambah jumlah tiket"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-[11px] text-neutral-500">(Maks. {maxTickets} tiket)</span>
        </div>

        {/* Calculated Instant Subtotal */}
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase text-neutral-500">
              Subtotal ({quantity} Tiket)
            </p>
            <p className="font-display text-lg font-extrabold text-[#0066FF]">
              Rp {subtotal.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
