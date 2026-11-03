import React from 'react';
import { Ticket, ShieldCheck, QrCode, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventDetail, EventVenueItem } from '../types';
import { AddToCalendarDropdown } from './AddToCalendarDropdown';

export interface PresaleNoticeCardProps {
  event: EventDetail;
  activeVenue?: EventVenueItem | null;
  isUpcomingPresale?: boolean;
  className?: string;
}

export const PresaleNoticeCard: React.FC<PresaleNoticeCardProps> = ({
  event,
  activeVenue,
  isUpcomingPresale = false,
  className,
}) => {
  // Hanya tampil untuk event bertipe presale cinema
  if (event.event_type !== 'presale_cinema') {
    return null;
  }

  const currentVenueName = activeVenue?.venue_name || event.venue_name;
  const cinemaPartnerName =
    activeVenue?.cinema_partner || event.cinema_partner || 'Jaringan Bioskop Mitra';

  return (
    <div
      className={cn(
        'rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 shadow-sm backdrop-blur-sm sm:p-5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Ticket className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white sm:text-sm">
              Ketentuan E-Pass Presale Bioskop
            </h4>
            <p className="text-[10px] text-neutral-400 sm:text-[11px]">
              Alokasi Resmi • {cinemaPartnerName}
            </p>
          </div>
        </div>

        <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
          Presale
        </span>
      </div>

      {/* Deskripsi & Poin Ketentuan */}
      <div className="mt-3.5 space-y-3 text-xs leading-relaxed text-neutral-300">
        <p className="text-[11px] text-neutral-400 sm:text-xs">
          Pemesanan melalui Sinemus Screen mengamankan alokasi kursi resmi Anda di{' '}
          <strong className="font-semibold text-white">{currentVenueName}</strong>.
        </p>

        <ul className="space-y-2.5">
          <li className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
            <span className="text-[11px] text-neutral-300 sm:text-xs">
              Karcis resmi bioskop partner (
              <strong className="text-neutral-100">{cinemaPartnerName}</strong>) akan terbit
              langsung di menu <em className="text-neutral-200">Tiket Saya</em> menjelang tanggal
              penayangan.
            </span>
          </li>

          <li className="flex items-start gap-2.5">
            <QrCode className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
            <span className="text-[11px] text-neutral-300 sm:text-xs">
              Anda akan mendapatkan{' '}
              <strong className="text-neutral-100">Booking Code & Passcode</strong> resmi untuk
              cetak fisik di mesin Kiosk Bioskop atau pemindaian E-Pass di pintu studio.
            </span>
          </li>

          <li className="flex items-start gap-2.5">
            <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span className="text-[11px] text-neutral-300 sm:text-xs">
              Tiket yang sudah dipesan tidak dapat dibatalkan atau dikembalikan (
              <em className="text-neutral-200">Non-refundable</em>).
            </span>
          </li>
        </ul>

        {/* Action Box: Pasang Pengingat Kalender Presale jika Presale Segera Dibuka */}
        {isUpcomingPresale && event.presale_start_at && (
          <div className="mt-3.5 flex flex-col gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-neutral-200">Pengingat Pembukaan Presale</p>
              <p className="text-[10px] text-neutral-400 sm:text-[11px]">
                Pasang notifikasi 30 menit sebelum kuota dibuka.
              </p>
            </div>
            <AddToCalendarDropdown event={event} variant="outline" label="Pasang Alarm Kalender" />
          </div>
        )}
      </div>
    </div>
  );
};
