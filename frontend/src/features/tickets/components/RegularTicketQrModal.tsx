import React from 'react';
import { X, QrCode, CheckCircle2, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatDateIndonesia } from '@/lib/utils';
import { UI_COPY } from '@/constants/ui-copy';
import type { TicketItem } from '../types';

export interface RegularTicketQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketItem;
}

export const RegularTicketQrModal: React.FC<RegularTicketQrModalProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  if (!isOpen) return null;

  const isCheckedIn = ticket.checkin_status === 'checked_in';
  const isUpcoming = ticket.is_upcoming;
  const isExpired = !isCheckedIn && !isUpcoming;
  const qrPayload = ticket.qr_hash || ticket.ticket_code || ticket.order_id;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm duration-200"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 relative w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-white shadow-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">E-Tiket Screening</h3>
            <p className="text-xs text-neutral-400">{ticket.venue_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Title, Schedule & Seats */}
        <div className="space-y-1.5 pt-3 text-center">
          <p className="line-clamp-1 text-base font-bold text-white">{ticket.event_title}</p>
          <p className="text-xs text-neutral-400">{formatDateIndonesia(ticket.show_time)}</p>
          {ticket.seat_codes && ticket.seat_codes.length > 0 ? (
            <p className="font-mono text-xs text-neutral-300">
              Kursi:{' '}
              <span className="font-semibold text-white">{ticket.seat_codes.join(', ')}</span>
            </p>
          ) : (
            <div className="pt-0.5">
              <span className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-950/80 px-2.5 py-0.5 text-[11px] font-medium text-neutral-400">
                General Admission • Bebas Pilih Kursi
              </span>
            </div>
          )}
        </div>

        {/* Crisp QR Code Area (White Pass Card) / Checked-In & Expired State (Dark Muted Card) */}
        {isCheckedIn ? (
          <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950/70 p-6 text-center">
            <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white">{UI_COPY.TICKETS.CHECKED_IN_MODAL_TITLE}</p>
            <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-neutral-400">
              {UI_COPY.TICKETS.CHECKED_IN_MODAL_DESC}
            </p>
            <div className="mt-3 text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {ticket.ticket_code || ticket.order_id}
              </span>
            </div>
          </div>
        ) : isExpired ? (
          <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950/70 p-6 text-center">
            <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800/60 text-neutral-400">
              <Clock className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm font-bold text-white">{UI_COPY.TICKETS.EXPIRED_MODAL_TITLE}</p>
            <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-neutral-400">
              {UI_COPY.TICKETS.EXPIRED_MODAL_DESC}
            </p>
            <div className="mt-3 text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {ticket.ticket_code || ticket.order_id}
              </span>
            </div>
          </div>
        ) : (
          <div className="my-4 flex flex-col items-center justify-center rounded-xl bg-white p-5 text-black shadow-lg">
            {qrPayload ? (
              <QRCodeSVG
                value={qrPayload}
                size={192}
                level="H"
                includeMargin={true}
                className="h-48 w-48"
              />
            ) : (
              <div className="flex h-48 w-48 flex-col items-center justify-center text-neutral-400">
                <QrCode className="h-16 w-16 text-neutral-400" />
                <p className="mt-2 text-xs text-neutral-500">QR Code</p>
              </div>
            )}

            <div className="mt-3 text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                {ticket.ticket_code || ticket.order_id}
              </span>
            </div>
          </div>
        )}

        {/* Footer Instruction */}
        <p className="text-center text-xs text-neutral-400">
          {isCheckedIn
            ? 'Tiket ini sudah tidak berlaku untuk check-in ulang di pintu masuk.'
            : isExpired
              ? UI_COPY.TICKETS.EXPIRED_MODAL_NOTICE
              : 'Tunjukkan QR Code ini kepada petugas gerbang venue saat masuk.'}
        </p>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-neutral-800 py-2.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-neutral-700 hover:text-white"
        >
          {UI_COPY.COMMON.BUTTON_CLOSE}
        </button>
      </div>
    </div>
  );
};
