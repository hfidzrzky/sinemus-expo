import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UI_COPY } from '@/constants/ui-copy';
import type { TicketItem } from '../types';

interface CinemaQrDisplayProps {
  qrImageUrl: string;
  onRetry: () => void;
}

const CinemaQrDisplay: React.FC<CinemaQrDisplayProps> = ({ qrImageUrl, onRetry }) => {
  const [isLoaded, setIsLoaded] = useState(() => {
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.src = qrImageUrl;
      return img.complete && img.naturalWidth !== 0;
    }
    return false;
  });
  const [isBroken, setIsBroken] = useState(false);

  return (
    <div className="relative flex h-52 w-52 items-center justify-center overflow-hidden rounded-lg">
      {/* Skeleton Shimmer Loading State: Mencegah kotak kosong saat gambar sedang di-fetch */}
      {!isLoaded && !isBroken && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg border border-neutral-200/80 bg-white/95 p-4 text-center backdrop-blur-sm">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#0066FF]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <p className="mt-2.5 text-xs font-semibold text-neutral-800">
            Menyiapkan barcode kiosk...
          </p>
          <p className="mt-1 text-[11px] text-neutral-500">Memverifikasi berkas e-pass resmi</p>
        </div>
      )}

      {/* Error Rescue State: 100% Aman tanpa menampilkan QR palsu yang tidak bisa di-scan */}
      {isBroken ? (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 p-4 text-center">
          <AlertCircle className="h-7 w-7 text-rose-500" />
          <p className="mt-1.5 text-xs font-semibold text-rose-900">Gagal Memuat Gambar Barcode</p>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
            Gunakan <span className="font-semibold text-neutral-900">Booking Code</span> &{' '}
            <span className="font-semibold text-neutral-900">PIN</span> di bawah pada mesin kiosk
            bioskop.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1 rounded-md bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-black active:scale-95"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Coba Muat Ulang</span>
          </button>
        </div>
      ) : (
        <img
          src={qrImageUrl}
          alt="Barcode Tiket Bioskop Resmi"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsBroken(true)}
          className={cn(
            'h-52 w-52 object-contain mix-blend-multiply transition-opacity duration-200',
            !isLoaded ? 'opacity-0' : 'opacity-100'
          )}
        />
      )}
    </div>
  );
};

export interface TicketHighBrightnessModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketItem;
}

export const TicketHighBrightnessModal: React.FC<TicketHighBrightnessModalProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  const [copiedField, setCopiedField] = useState<'booking' | 'passcode' | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  if (!isOpen) return null;

  const isPast = !ticket.is_upcoming;
  const cinemaTicket = ticket.cinema_ticket;
  const bookingCode = cinemaTicket?.booking_code || '-';
  const passcode = cinemaTicket?.passcode || '-';
  const qrImageUrl = cinemaTicket?.qr_image_url;
  const qrPayload =
    bookingCode !== '-' && passcode !== '-'
      ? `${bookingCode}-${passcode}`
      : ticket.qr_hash || ticket.ticket_code || ticket.order_id;

  const handleCopy = (text: string, field: 'booking' | 'passcode') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field === 'booking' ? 'Booking Code' : 'Passcode PIN'} disalin`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

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
            <h3 className="text-sm font-semibold text-white">
              {isPast ? 'Riwayat E-Pass Bioskop' : 'E-Pass Kiosk Bioskop'}
            </h3>
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

        {/* Title & Seats */}
        <div className="pt-3 text-center">
          <p className="line-clamp-1 text-base font-bold text-white">{ticket.event_title}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            Kursi: <span className="font-semibold text-white">{ticket.seat_codes.join(', ')}</span>
          </p>
        </div>

        {/* Crisp QR Code Area (White Pass Card) / Past Finished State (Dark Muted Card) */}
        {isPast ? (
          <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950/70 p-6 text-center">
            <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800/60 text-neutral-300">
              <CheckCircle2 className="h-6 w-6 text-neutral-300" />
            </div>
            <p className="text-sm font-bold text-white">{UI_COPY.PRESALE.PAST_MODAL_TITLE}</p>
            <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-neutral-400">
              {UI_COPY.PRESALE.PAST_MODAL_DESC}
            </p>
            <div className="mt-3 text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {ticket.ticket_code || ticket.order_id}
              </span>
            </div>
          </div>
        ) : (
          <div className="my-4 flex flex-col items-center justify-center rounded-xl bg-white p-5 text-black shadow-lg">
            {qrImageUrl ? (
              <CinemaQrDisplay
                key={`${qrImageUrl}-${retryCount}`}
                qrImageUrl={qrImageUrl}
                onRetry={() => setRetryCount((prev) => prev + 1)}
              />
            ) : qrPayload ? (
              <QRCodeSVG
                value={qrPayload}
                size={208}
                level="H"
                includeMargin={true}
                className="h-52 w-52"
              />
            ) : (
              <div className="flex h-52 w-52 flex-col items-center justify-center text-neutral-400">
                <QrCode className="h-16 w-16 text-neutral-400" />
                <p className="mt-2 text-xs text-neutral-500">QR Code Tiket Bioskop</p>
              </div>
            )}

            <p className="mt-2 text-[11px] font-medium text-neutral-500">
              Arahkan layar ponsel ke scanner mesin kiosk
            </p>

            <div className="mt-1 text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                {ticket.ticket_code || ticket.order_id}
              </span>
            </div>
          </div>
        )}

        {/* Monospace Code Row (Booking Code & Passcode) */}
        <div
          className={cn(
            'grid grid-cols-2 gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3',
            isPast && 'opacity-60'
          )}
        >
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Booking Code
            </span>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="font-mono text-sm font-bold tracking-wider text-white">
                {bookingCode}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(bookingCode, 'booking')}
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
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

          <div className="border-l border-neutral-800 pl-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Passcode PIN
            </span>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="font-mono text-sm font-bold tracking-wider text-white">
                {passcode}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(passcode, 'passcode')}
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
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

        {/* Footer Notice */}
        <p className="mt-3 text-center text-xs text-neutral-400">
          {isPast
            ? UI_COPY.PRESALE.PAST_MODAL_NOTICE
            : 'Tunjukkan barcode atau ketik kode di atas ke mesin kiosk bioskop.'}
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
