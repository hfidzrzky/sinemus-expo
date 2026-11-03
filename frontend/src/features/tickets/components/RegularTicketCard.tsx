import React, { useState } from 'react';
import { QrCode, Download, CheckCircle2, Clock } from 'lucide-react';
import { formatDateIndonesia } from '@/lib/utils';
import { UI_COPY } from '@/constants/ui-copy';
import type { TicketItem } from '../types';

import { RegularTicketQrModal } from './RegularTicketQrModal';
import { useDownloadTicketPdf } from '../hooks/useDownloadTicketPdf';

export interface RegularTicketCardProps {
  ticket: TicketItem;
}

export const RegularTicketCard: React.FC<RegularTicketCardProps> = ({ ticket }) => {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const { downloadTicketPdf, isDownloading } = useDownloadTicketPdf();

  const isCheckedIn = ticket.checkin_status === 'checked_in';
  const isUpcoming = ticket.is_upcoming;
  const isExpired = !isCheckedIn && !isUpcoming;

  const handleDownloadPdf = () => {
    downloadTicketPdf(ticket.order_id);
  };

  return (
    <>
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 transition-colors hover:border-neutral-700/80 sm:p-5">
        {/* Main Content Row */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3.5">
            {/* Poster Event */}
            <img
              src={ticket.poster_url}
              alt={ticket.event_title}
              className="h-20 w-14 shrink-0 rounded-lg border border-neutral-800 bg-neutral-950 object-cover sm:h-24 sm:w-16"
            />

            {/* Info Event, Venue, & Jadwal */}
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">{ticket.event_title}</h3>

              <p className="text-xs text-neutral-400">
                {ticket.venue_name}, {ticket.city}
              </p>

              <p className="text-xs text-neutral-400">{formatDateIndonesia(ticket.show_time)}</p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {ticket.seat_codes && ticket.seat_codes.length > 0 ? (
                  <span className="font-medium text-neutral-200">
                    Kursi:{' '}
                    <span className="font-mono text-white">{ticket.seat_codes.join(', ')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-neutral-800/90 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
                    General Admission (Free Seating)
                  </span>
                )}
                <span className="font-mono text-[11px] text-neutral-500">
                  &bull; {ticket.ticket_code || ticket.order_id}
                </span>
              </div>
            </div>
          </div>

          {/* Status Single Pill (Whispering Emerald — Gaya Apple) */}
          <div className="self-start sm:self-start">
            {isCheckedIn ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800/80 bg-neutral-900/80 px-2.5 py-0.5 text-neutral-400 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-500" />
                <span className="text-[11px] font-medium tracking-wide">
                  {UI_COPY.TICKETS.STATUS_CHECKED_IN}
                </span>
              </div>
            ) : isUpcoming ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800/80 bg-neutral-900/80 px-2.5 py-0.5 text-neutral-200 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium tracking-wide">
                  {UI_COPY.TICKETS.STATUS_ACTIVE}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800/80 bg-neutral-900/80 px-2.5 py-0.5 text-neutral-500 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-600" />
                <span className="text-[11px] font-medium tracking-wide">
                  {UI_COPY.TICKETS.STATUS_EXPIRED}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Strip: QR Scan Button & PDF Link */}
        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-neutral-800/60 pt-3.5 text-xs text-neutral-400 sm:flex-row sm:items-center">
          {isCheckedIn ? (
            <p className="flex items-center gap-1.5 font-medium text-emerald-400/90">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>{UI_COPY.TICKETS.GATE_NOTICE_CHECKED_IN}</span>
            </p>
          ) : isExpired ? (
            <p className="flex items-center gap-1.5 font-medium text-neutral-500">
              <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
              <span>{UI_COPY.TICKETS.GATE_NOTICE_EXPIRED}</span>
            </p>
          ) : (
            <p>{UI_COPY.TICKETS.GATE_NOTICE_ACTIVE}</p>
          )}

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {isUpcoming && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700/80 bg-neutral-900/90 px-3.5 py-2 text-xs font-medium text-neutral-200 shadow-sm transition-all hover:border-neutral-600 hover:bg-neutral-800 hover:text-white active:scale-[0.98] disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5 text-neutral-300" />
                <span>{isDownloading ? 'Mengunduh...' : 'Unduh Tiket (PDF)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className={
                isUpcoming
                  ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 active:bg-blue-700'
                  : 'inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700/80 bg-neutral-800/90 px-4 py-2 text-xs font-medium text-neutral-200 shadow-sm transition-colors hover:bg-neutral-700 hover:text-white active:scale-[0.98]'
              }
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>
                {isUpcoming ? UI_COPY.TICKETS.BTN_VIEW_QR : UI_COPY.TICKETS.BTN_VIEW_PASS}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up QR Modal */}
      <RegularTicketQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        ticket={ticket}
      />
    </>
  );
};
