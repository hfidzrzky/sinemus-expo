import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Armchair,
  User,
  Ticket,
  ShieldAlert,
} from 'lucide-react';
import type { ScannerScanResult } from '../../types';

export interface ScannerResultCardProps {
  result: ScannerScanResult | null;
  onReset: () => void;
  autoDismissMs?: number; // default 2500ms
}

const formatWibTime = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return (
      d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB'
    );
  } catch {
    return isoString;
  }
};

export function ScannerResultCard({
  result,
  onReset,
  autoDismissMs = 2500,
}: ScannerResultCardProps): React.JSX.Element | null {
  // Auto-dismiss countdown timer untuk status SUCCESS agar antrean berjalan cepat
  useEffect(() => {
    if (!result || result.status !== 'success') return;

    const timer = setTimeout(() => {
      onReset();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [result, onReset, autoDismissMs]);

  if (!result || result.status === 'idle') return null;

  // 1. Status SUCCESS (Valid Check-in)
  if (result.status === 'success' && result.ticket) {
    const t = result.ticket;
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onReset}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onReset();
        }}
        className="mx-auto w-full max-w-sm cursor-pointer select-none rounded-2xl border border-emerald-500/40 bg-[#0B0E14]/95 p-4 shadow-2xl backdrop-blur-md transition-all active:scale-[0.99]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Check-in Berhasil
            </span>
          </div>
          <span className="font-mono text-[10px] text-neutral-400">
            {formatWibTime(t.scanned_at)}
          </span>
        </div>

        {/* Content Body */}
        <div className="mt-3 space-y-3 text-xs">
          <div>
            <span className="block truncate text-[11px] text-neutral-400">{t.event_title}</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <User className="h-4 w-4 text-neutral-400" />
              <span className="text-base font-bold tracking-tight text-white">{t.buyer_name}</span>
            </div>
            {(t.studio_name || t.show_time) && (
              <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-400">
                {t.studio_name && (
                  <span className="font-medium text-neutral-300">{t.studio_name}</span>
                )}
                {t.show_time && <span>· {formatWibTime(t.show_time)}</span>}
              </div>
            )}
          </div>

          {/* Seats Box */}
          <div className="rounded-xl border border-neutral-800 bg-[#0D111A] p-2.5 text-center">
            <span className="mb-1.5 block font-mono text-[10px] uppercase text-neutral-400">
              {t.seat_codes && t.seat_codes.length > 0
                ? `${t.ticket_quantity} Kursi Terpilih`
                : `${t.ticket_quantity} Pax (General Admission)`}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {t.seat_codes && t.seat_codes.length > 0 ? (
                t.seat_codes.map((seat) => (
                  <span
                    key={seat}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-300"
                  >
                    <Armchair className="h-3 w-3 text-emerald-400" />
                    <span>{seat}</span>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-200">
                  <Ticket className="h-3 w-3 text-neutral-400" />
                  <span>Free Seating ({t.ticket_quantity} Pax)</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-neutral-400">
            <span>{t.ticket_code}</span>
            <span className="font-sans font-semibold text-emerald-400">Silakan Masuk ➔</span>
          </div>

          {/* Auto-ready Progress Countdown Bar (Hardware-Accelerated CSS Animation) */}
          <div className="pt-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                key={result.timestamp}
                className="h-full origin-left bg-emerald-500"
                style={{
                  animation: `scanner-countdown ${autoDismissMs}ms linear forwards`,
                }}
              />
            </div>
            <p className="mt-1 text-center text-[10px] text-neutral-400">
              Otomatis siap pindai berikutnya ·{' '}
              <strong className="text-white">Tap untuk lewati</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Status WRONG_SESSION (Strict Gate Violation)
  if (result.status === 'wrong_session') {
    const ws = result.wrongSessionInfo;
    return (
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-amber-500/40 bg-[#0B0E14]/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Sesi Tiket Berbeda
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-3 text-xs">
          <p className="text-[11px] leading-relaxed text-neutral-300">{result.message}</p>

          {/* Comparison Card Box */}
          {ws?.actual_schedule && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-left">
              <span className="block font-mono text-[10px] font-semibold uppercase text-amber-400">
                Sesi Sebenarnya Pada Tiket Penonton:
              </span>
              <div className="mt-1 text-xs font-bold text-white">
                {ws.actual_schedule.event_title}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-300">
                <span className="font-semibold text-amber-300">
                  {ws.actual_schedule.studio_name}
                </span>
                {ws.actual_schedule.formatted_show_time && (
                  <span>· {ws.actual_schedule.formatted_show_time}</span>
                )}
              </div>
              <p className="mt-2 text-[10px] text-neutral-400">
                ➔ Arahkan penonton ke pintu masuk {ws.actual_schedule.studio_name}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#131926]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Pindai Tiket Berikutnya</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Status DUPLICATE (Double Check-in)
  if (result.status === 'duplicate') {
    const dup = result.duplicateInfo;
    return (
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-rose-500/40 bg-[#0B0E14]/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
              <XCircle className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Tiket Sudah Digunakan
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-3 text-xs">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
            <p className="text-[11px] font-medium leading-relaxed text-rose-200">
              {result.message}
            </p>
            {dup?.buyerName && (
              <div className="mt-2 border-t border-rose-500/20 pt-2 text-[11px] text-neutral-300">
                <span>Pemilik Terdaftar: </span>
                <strong className="text-white">{dup.buyerName}</strong>
                {dup.seatCodes && dup.seatCodes.length > 0 && (
                  <span className="ml-1 font-mono text-[10px] text-neutral-400">
                    ({dup.seatCodes.join(', ')})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#131926]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset & Pindai Ulang</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Status INVALID, UNPAID, or EXPIRED
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#0B0E14]/95 p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            Validasi Gagal
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-3 text-xs">
        <div className="rounded-xl border border-neutral-800 bg-[#0D111A] p-3">
          <p className="text-[11px] leading-relaxed text-neutral-300">
            {result.message || 'Kode QR tidak dikenali atau bukan tiket screening reguler Sinemus.'}
          </p>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] px-4 py-2 text-xs font-medium text-neutral-300 transition hover:bg-[#131926] hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Pindai Ulang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
