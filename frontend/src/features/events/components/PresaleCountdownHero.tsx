import React from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePresaleCountdown } from '../hooks/usePresaleCountdown';
import { AddToCalendarDropdown, type CalendarEventTarget } from './AddToCalendarDropdown';

interface PresaleCountdownHeroProps {
  event: CalendarEventTarget;
  presaleStartAt: string;
  serverTime?: string | null;
  onExpire?: () => void;
  className?: string;
}

export const PresaleCountdownHero: React.FC<PresaleCountdownHeroProps> = ({
  event,
  presaleStartAt,
  serverTime,
  onExpire,
  className,
}) => {
  const { days, hours, minutes, seconds } = usePresaleCountdown({
    targetDate: presaleStartAt,
    serverTime,
    onExpire,
  });

  const formattedTargetDate = (() => {
    try {
      const date = new Date(presaleStartAt);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return presaleStartAt;
    }
  })();

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-neutral-950/80 to-neutral-950 p-4 shadow-2xl backdrop-blur-md sm:p-6',
        className
      )}
    >
      {/* Background Accent Glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Info & Headline */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 sm:text-xs">
              <Sparkles className="h-3 w-3" />
              <span>PRESALE E-PASS RESMI</span>
            </span>
            <span className="text-[11px] text-neutral-400">
              {event.cinema_partner || 'Bioskop Partner'}
            </span>
          </div>

          <h3 className="font-display text-base font-extrabold tracking-tight text-white sm:text-xl">
            Penjualan Tiket Dibuka Dalam:
          </h3>

          <p className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>
              Dibuka: <strong className="text-neutral-200">{formattedTargetDate} WIB</strong>
            </span>
          </p>
        </div>

        {/* Center: Live Digits Ticker */}
        <div className="flex items-center gap-2 self-center sm:gap-3 lg:self-auto">
          {/* Days */}
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/30 bg-neutral-900/90 shadow-inner sm:h-16 sm:w-16">
              <span className="font-mono text-xl font-black tabular-nums text-amber-400 sm:text-2xl">
                {pad(days)}
              </span>
            </div>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-400 sm:text-[10px]">
              Hari
            </span>
          </div>

          <span className="-mt-4 text-xl font-bold text-amber-500/60 sm:text-2xl">:</span>

          {/* Hours */}
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/30 bg-neutral-900/90 shadow-inner sm:h-16 sm:w-16">
              <span className="font-mono text-xl font-black tabular-nums text-amber-400 sm:text-2xl">
                {pad(hours)}
              </span>
            </div>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-400 sm:text-[10px]">
              Jam
            </span>
          </div>

          <span className="-mt-4 text-xl font-bold text-amber-500/60 sm:text-2xl">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/30 bg-neutral-900/90 shadow-inner sm:h-16 sm:w-16">
              <span className="font-mono text-xl font-black tabular-nums text-amber-400 sm:text-2xl">
                {pad(minutes)}
              </span>
            </div>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-400 sm:text-[10px]">
              Menit
            </span>
          </div>

          <span className="-mt-4 text-xl font-bold text-amber-500/60 sm:text-2xl">:</span>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/30 bg-neutral-900/90 shadow-inner sm:h-16 sm:w-16">
              <span className="font-mono text-xl font-black tabular-nums text-amber-400 sm:text-2xl">
                {pad(seconds)}
              </span>
            </div>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-400 sm:text-[10px]">
              Detik
            </span>
          </div>
        </div>

        {/* Right: Add to Calendar CTA */}
        <div className="flex flex-col items-center justify-end gap-2 self-stretch sm:flex-row lg:self-auto">
          <AddToCalendarDropdown
            event={event}
            variant="hero"
            label="Ingatkan di Google Calendar"
            className="w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
};
