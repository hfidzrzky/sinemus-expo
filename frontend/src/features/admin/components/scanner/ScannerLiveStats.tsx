import React from 'react';
import { Calendar, MapPin, ChevronDown } from 'lucide-react';

export interface ScheduleOption {
  id: number;
  eventTitle: string;
  studioName?: string;
  venueName?: string;
  showTime?: string;
  checkedInCount: number;
  totalCapacity: number;
}

export interface ScannerLiveStatsProps {
  eventTitle: string;
  checkedInCount: number;
  totalCapacity: number;
  studioName?: string;
  venueName?: string;
  showTime?: string;
  scheduleOptions?: ScheduleOption[];
  selectedScheduleId?: number;
  onSelectSchedule?: (id: number) => void;
}

export function ScannerLiveStats({
  eventTitle,
  checkedInCount,
  totalCapacity,
  studioName = 'Studio Utama',
  venueName,
  showTime,
  scheduleOptions = [],
  selectedScheduleId,
  onSelectSchedule,
}: ScannerLiveStatsProps): React.JSX.Element {
  const percentage =
    totalCapacity > 0 ? Math.min(100, Math.round((checkedInCount / totalCapacity) * 100)) : 0;

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      {/* Session Selector (If multiple active regular screening schedules exist) */}
      {scheduleOptions.length > 1 && onSelectSchedule ? (
        <div className="mb-3">
          <label
            htmlFor="schedule-select"
            className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-neutral-400"
          >
            Pilih Sesi Screening Reguler
          </label>
          <div className="relative">
            <select
              id="schedule-select"
              value={selectedScheduleId ?? scheduleOptions[0]?.id}
              onChange={(e) => onSelectSchedule(Number(e.target.value))}
              aria-label="Pilih Sesi Screening Reguler"
              className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 pr-8 text-xs font-medium text-white transition focus:border-neutral-700 focus:outline-none"
            >
              {scheduleOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-neutral-900 text-white">
                  {opt.eventTitle} ({opt.studioName || 'Studio'}){' '}
                  {opt.showTime
                    ? `• ${new Date(opt.showTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                    : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
      ) : null}

      {/* Main Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="rounded border border-neutral-800 bg-neutral-950 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neutral-400">
              Reguler
            </span>
            <span className="truncate text-xs font-semibold text-white">{eventTitle}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-400">
            {venueName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-neutral-400" />
                <span className="truncate">{venueName}</span>
              </span>
            )}
            <span>{studioName}</span>
            {showTime && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-neutral-400">
                <Calendar className="h-3 w-3" />
                {new Date(showTime).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="font-mono text-xs font-semibold text-white">{percentage}%</span>
          <span className="block text-[10px] text-neutral-400">Masuk</span>
        </div>
      </div>

      {/* Minimalist Progress Bar */}
      <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-neutral-200 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Counter Summary */}
      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-neutral-400">
        <span>
          <strong className="font-semibold text-white">{checkedInCount}</strong> penonton check-in
        </span>
        <span>Kapasitas {totalCapacity}</span>
      </div>
    </div>
  );
}
