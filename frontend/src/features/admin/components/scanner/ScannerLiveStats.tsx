import React from 'react';
import { Calendar, MapPin, Clock, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import type { ScannerGateStatus } from '../../types';

export interface ScannerLiveStatsProps {
  eventTitle: string;
  checkedInCount: number;
  ticketsSold: number;
  totalCapacity: number;
  studioName?: string;
  venueName?: string;
  showTime?: string;
  gateStatus?: ScannerGateStatus;
  isStrictGate?: boolean;
  onOpenSessionPicker: () => void;
}

const formatWibDateTime = (isoString?: string): { time: string; date: string } => {
  if (!isoString) return { time: '', date: '' };
  try {
    const d = new Date(isoString);
    const time =
      d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';
    const date = d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return { time, date };
  } catch {
    return { time: isoString, date: '' };
  }
};

export function ScannerLiveStats({
  eventTitle,
  checkedInCount,
  ticketsSold,
  totalCapacity,
  studioName = 'Studio Utama',
  venueName,
  showTime,
  gateStatus = 'open_now',
  isStrictGate = true,
  onOpenSessionPicker,
}: ScannerLiveStatsProps): React.JSX.Element {
  const percentage =
    ticketsSold > 0 ? Math.min(100, Math.round((checkedInCount / ticketsSold) * 100)) : 0;
  const pendingCount = Math.max(0, ticketsSold - checkedInCount);
  const { time: timeStr, date: dateStr } = formatWibDateTime(showTime);

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 transition-all">
      {/* Active Session Header Bar */}
      <div className="flex items-start justify-between gap-2 border-b border-neutral-800/80 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isStrictGate && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[#0040C1] bg-[#0066FF]/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-blue-400">
                <ShieldCheck className="h-2.5 w-2.5" />
                <span>Strict Gate</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-md border border-neutral-800 bg-[#0D111A] px-1.5 py-0.5 font-mono text-[9px] font-medium text-neutral-300">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  gateStatus === 'open_now'
                    ? 'animate-pulse bg-emerald-400'
                    : gateStatus === 'closing_soon'
                      ? 'bg-amber-400'
                      : 'bg-neutral-400'
                }`}
              />
              <span className="uppercase">
                {gateStatus === 'open_now'
                  ? 'LIVE'
                  : gateStatus === 'closing_soon'
                    ? 'TUTUP SEGERA'
                    : 'SEGERA'}
              </span>
            </span>
            <span className="truncate text-xs font-bold text-white">{eventTitle}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-400">
            {venueName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
                <span className="truncate">{venueName}</span>
              </span>
            )}
            <span className="font-medium text-neutral-300">{studioName}</span>
          </div>

          {showTime && (
            <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-neutral-400">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Clock className="h-3 w-3 text-neutral-400" />
                <span>{timeStr}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-neutral-400">
                <Calendar className="h-3 w-3 text-neutral-400" />
                <span>{dateStr}</span>
              </span>
            </div>
          )}
        </div>

        {/* Change Session Button */}
        <button
          type="button"
          onClick={onOpenSessionPicker}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 transition hover:border-neutral-700 hover:bg-[#131926] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-95"
          title="Ganti Sesi Screening Yang Dijaga"
        >
          <ArrowRightLeft className="h-3 w-3 text-neutral-400" />
          <span>Ganti</span>
        </button>
      </div>

      {/* Real-time Progress & Attendance Stats */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-neutral-400">Kehadiran Penonton</span>
          <span className="font-mono text-xs font-bold tabular-nums text-white">{percentage}%</span>
        </div>

        {/* Minimalist Progress Bar */}
        <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-[#0D111A]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentage >= 100 ? 'bg-emerald-500' : 'bg-[#0066FF]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Counter Summary (3-Metrik SSOT) */}
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] tabular-nums text-neutral-400">
          <span>
            <strong className="font-bold text-white">{checkedInCount}</strong>
            <span className="text-neutral-500">/{ticketsSold}</span> masuk
          </span>
          <span>
            <strong className="text-amber-400">{pendingCount}</strong> belum hadir
          </span>
          <span className="text-[10px] text-neutral-500">Kapasitas {totalCapacity}</span>
        </div>
      </div>
    </div>
  );
}
