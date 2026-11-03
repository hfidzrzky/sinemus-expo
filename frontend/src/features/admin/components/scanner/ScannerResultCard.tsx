import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Armchair,
  User,
  Ticket,
} from 'lucide-react';
import type { ScannerScanResult } from '../../types';

export interface ScannerResultCardProps {
  result: ScannerScanResult | null;
  onReset: () => void;
}

export function ScannerResultCard({
  result,
  onReset,
}: ScannerResultCardProps): React.JSX.Element | null {
  if (!result || result.status === 'idle') return null;

  if (result.status === 'success' && result.ticket) {
    const t = result.ticket;
    return (
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-neutral-900/80 p-4 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Check-in Berhasil
            </span>
          </div>
          <span className="font-mono text-[10px] text-neutral-400">
            {new Date(t.scanned_at).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>

        {/* Content */}
        <div className="mt-3 space-y-3 text-xs">
          <div>
            <span className="block truncate text-[11px] text-neutral-400">{t.event_title}</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-sm font-semibold text-white">{t.buyer_name}</span>
            </div>
          </div>

          {/* Seats Box */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-center">
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
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-0.5 font-mono text-xs font-medium text-white"
                  >
                    <Armchair className="h-3 w-3 text-neutral-400" />
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
            <span className="font-sans font-medium text-emerald-400">Silakan Masuk ➔</span>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'duplicate') {
    return (
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-red-500/30 bg-neutral-900/80 p-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
              Tiket Sudah Digunakan
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-3 text-xs">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-[11px] leading-relaxed text-neutral-300">
              {result.message || 'Tiket dengan kode QR ini telah tercatat check-in sebelumnya.'}
            </p>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Scan</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or Presale or Wrong Session
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
            Validasi Gagal
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-3 text-xs">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
          <p className="text-[11px] leading-relaxed text-neutral-300">
            {result.message || 'Kode QR tidak dikenali atau bukan tiket screening reguler Sinemus.'}
          </p>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Pindai Ulang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
