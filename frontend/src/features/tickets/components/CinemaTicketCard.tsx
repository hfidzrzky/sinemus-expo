import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  QrCode,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateIndonesia } from '@/lib/utils';
import { UI_COPY } from '@/constants/ui-copy';
import type { TicketItem } from '../types';

import { TicketHighBrightnessModal } from './TicketHighBrightnessModal';
import { useDownloadTicketPdf } from '../hooks/useDownloadTicketPdf';

export interface CinemaTicketCardProps {
  ticket: TicketItem;
}

export const CinemaTicketCard: React.FC<CinemaTicketCardProps> = ({ ticket }) => {
  const [isBrightnessModalOpen, setIsBrightnessModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<'booking' | 'passcode' | null>(null);

  const { downloadTicketPdf, isDownloading } = useDownloadTicketPdf();

  const isAwaiting = ticket.fulfillment_status === 'awaiting_cinema_ticket';
  const isFulfilled = ticket.fulfillment_status === 'fulfilled';
  const isUpcoming = ticket.is_upcoming;
  const isPast = !isUpcoming;
  const cinemaTicket = ticket.cinema_ticket;

  // Eager Background Preloading: Simpan berkas barcode resmi di cache browser
  // saat tiket terdeteksi, agar saat modal dibuka gambar langsung tampil seketika (0ms)
  useEffect(() => {
    const qrUrl = cinemaTicket?.qr_image_url;
    if (qrUrl && typeof window !== 'undefined') {
      const preloadImg = new Image();
      preloadImg.src = qrUrl;
    }
  }, [cinemaTicket?.qr_image_url]);

  const handlePreloadQr = () => {
    const qrUrl = cinemaTicket?.qr_image_url;
    if (qrUrl && typeof window !== 'undefined') {
      const preloadImg = new Image();
      preloadImg.src = qrUrl;
    }
  };

  const handleCopy = (text: string, field: 'booking' | 'passcode') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field === 'booking' ? 'Booking Code' : 'Passcode PIN'} disalin`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleDownloadPdf = () => {
    downloadTicketPdf(ticket.order_id);
  };

  return (
    <>
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 transition-colors hover:border-neutral-700/80 sm:p-5">
        {/* Main Content Row */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3.5">
            {/* Poster Film */}
            <img
              src={ticket.poster_url}
              alt={ticket.event_title}
              className="h-20 w-14 shrink-0 rounded-lg border border-neutral-800 bg-neutral-950 object-cover sm:h-24 sm:w-16"
            />

            {/* Info Film, Venue, & Jadwal */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-white">{ticket.event_title}</h3>
              </div>

              <p className="text-xs text-neutral-400">{ticket.venue_name}</p>

              <p className="text-xs text-neutral-400">{formatDateIndonesia(ticket.show_time)}</p>

              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="font-medium text-neutral-200">
                  Kursi:{' '}
                  <span className="font-mono text-white">{ticket.seat_codes.join(', ')}</span>
                </span>
                <span className="font-mono text-[11px] text-neutral-500">{ticket.order_id}</span>
              </div>
            </div>
          </div>

          {/* Status Single Pill (Whispering Emerald — Gaya Apple) */}
          <div className="self-start sm:self-start">
            {isPast ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800/80 bg-neutral-900/80 px-2.5 py-0.5 text-neutral-400 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-500" />
                <span className="text-[11px] font-medium tracking-wide">
                  {UI_COPY.PRESALE.PAST_BADGE}
                </span>
              </div>
            ) : isAwaiting ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800/80 bg-neutral-900/80 px-2.5 py-0.5 text-neutral-200 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium tracking-wide">
                  {UI_COPY.PRESALE.AWAITING_BADGE}
                </span>
              </div>
            ) : isFulfilled ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800/80 bg-neutral-900/80 px-2.5 py-0.5 text-neutral-200 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium tracking-wide">
                  {UI_COPY.PRESALE.FULFILLED_BADGE}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* ========================================================
            KONDISI A: Menunggu Penerbitan Tiket (Hanya saat masih upcoming)
            ======================================================== */}
        {isAwaiting && isUpcoming && (
          <div className="mt-4 flex flex-col justify-between gap-4 border-t border-neutral-800/60 pt-3.5 text-xs text-neutral-400 sm:flex-row sm:items-center">
            <p className="max-w-md leading-relaxed text-neutral-300 lg:max-w-lg">
              {UI_COPY.PRESALE.AWAITING_DESCRIPTION}
            </p>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-neutral-700/80 bg-neutral-900/90 px-3.5 py-2 text-xs font-medium text-neutral-200 shadow-sm transition-all hover:border-neutral-600 hover:bg-neutral-800 hover:text-white active:scale-[0.98] disabled:opacity-50 sm:self-auto"
            >
              <Download className="h-3.5 w-3.5 text-neutral-300" />
              <span>{isDownloading ? 'Mengunduh...' : 'Unduh Bukti (PDF)'}</span>
            </button>
          </div>
        )}

        {/* ========================================================
            KONDISI B & C: Tiket Bioskop Terbit (Upcoming / Past)
            ======================================================== */}
        {isFulfilled && cinemaTicket && (
          <div className="mt-4 space-y-3 border-t border-neutral-800/60 pt-3.5">
            {/* Box Kode Kiosk Minimalis Serasi (Dimmed jika sudah lewat tayang) */}
            <div
              className={
                isPast
                  ? 'rounded-lg border border-neutral-800/60 bg-neutral-950/50 px-4 py-3 opacity-80'
                  : 'rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3'
              }
            >
              <div className="flex items-center gap-6 divide-x divide-neutral-800">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    Booking Code
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="font-mono text-base font-bold tracking-wider text-white">
                      {cinemaTicket.booking_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(cinemaTicket.booking_code, 'booking')}
                      className="p-0.5 text-neutral-400 transition-colors hover:text-white"
                      title="Salin Booking Code"
                    >
                      {copiedField === 'booking' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pl-6">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    Passcode / PIN
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="font-mono text-base font-bold tracking-wider text-white">
                      {cinemaTicket.passcode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(cinemaTicket.passcode, 'passcode')}
                      className="p-0.5 text-neutral-400 transition-colors hover:text-white"
                      title="Salin Passcode PIN"
                    >
                      {copiedField === 'passcode' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Strip */}
            <div className="flex flex-col justify-between gap-3 pt-1 text-xs text-neutral-400 sm:flex-row sm:items-center">
              {/* Sisi Kiri: Trigger Panduan atau Keterangan Selesai */}
              {isPast ? (
                <p className="flex items-center gap-1.5 font-medium text-emerald-400/90">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span>{UI_COPY.PRESALE.PAST_DESCRIPTION}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(!isGuideOpen)}
                  className="inline-flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-neutral-200"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Panduan Cetak di Mesin Kiosk</span>
                  {isGuideOpen ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}

              {/* Sisi Kanan: Action Buttons */}
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
                  onClick={() => setIsBrightnessModalOpen(true)}
                  onMouseEnter={handlePreloadQr}
                  onFocus={handlePreloadQr}
                  className={
                    isPast
                      ? 'inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700/80 bg-neutral-800/90 px-4 py-2 text-xs font-medium text-neutral-200 shadow-sm transition-colors hover:bg-neutral-700 hover:text-white active:scale-[0.98]'
                      : 'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 active:bg-blue-700'
                  }
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>{isPast ? UI_COPY.PRESALE.BTN_VIEW_ARCHIVE : 'Buka QR Kiosk'}</span>
                </button>
              </div>
            </div>

            {/* Panduan Kiosk Collapsible (Hanya muncul jika isUpcoming) */}
            {isUpcoming && isGuideOpen && (
              <div className="animate-in fade-in space-y-1.5 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 text-xs text-neutral-400 duration-150">
                <ol className="list-decimal space-y-1 pl-4 leading-relaxed text-neutral-300">
                  {UI_COPY.PRESALE.KIOSK_GUIDE_STEPS.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Kiosk Brightness */}
      <TicketHighBrightnessModal
        isOpen={isBrightnessModalOpen}
        onClose={() => setIsBrightnessModalOpen(false)}
        ticket={ticket}
      />
    </>
  );
};
