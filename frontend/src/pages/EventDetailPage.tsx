import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Info,
  Ticket,
  X,
  ArrowRight,
  AlertCircle,
  Loader2,
  Armchair,
  Clock,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useEventDetailQuery,
  useScheduleSeatsQuery,
  ScheduleSelector,
  SeatGrid,
  GeneralAdmissionSelector,
  EventDetailDrawer,
  useEventSalesStatus,
  formatMovieDuration,
  SCHEDULE_SEATS_QUERY_KEY,
  EVENT_DETAIL_QUERY_KEY,
  type ScheduleItem,
  type SeatItem,
  type EventVenueItem,
} from '@/features/events';
import { useAuth } from '@/features/auth';
import { EventCheckoutModal } from '@/features/checkout';
import { usePublicSettingsQuery } from '@/features/admin';
import { SinemusCinemaPlayer } from '@/components/common';

interface EventDetailPageProps {
  slug: string;
  onNavigate?: (path: string) => void;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({ slug, onNavigate }) => {
  const { data: event, isLoading: isEventLoading, isError } = useEventDetailQuery(slug);
  const { data: publicSettings } = usePublicSettingsQuery();

  const maxTicketsPerOrder = publicSettings?.business_policies?.max_tickets_per_order ?? 8;
  const isTicketSalesFrozen =
    publicSettings?.emergency_controls?.freeze_cinema_ticket_sales ?? false;

  // Multi-venue & Schedule selection state machine
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  // Consolidated Venues list (SSOT)
  const venues = useMemo<EventVenueItem[]>(() => {
    if (!event) return [];
    if (event.venues && event.venues.length > 0) return event.venues;
    const map = new Map<number, EventVenueItem>();
    event.schedules.forEach((s) => {
      if (s.venue && !map.has(s.venue.id)) {
        map.set(s.venue.id, s.venue);
      }
    });
    return Array.from(map.values());
  }, [event]);

  // Derived effective venue
  const effectiveVenue = useMemo<EventVenueItem | null>(() => {
    if (!event) return null;
    if (selectedVenueId) {
      const found = venues.find((v) => v.id === selectedVenueId);
      if (found) return found;
    }
    return venues[0] || null;
  }, [event, venues, selectedVenueId]);

  // Derived effective schedule without cascading renders
  const selectedSchedule = useMemo<ScheduleItem | null>(() => {
    if (!event?.schedules || event.schedules.length === 0) return null;
    if (selectedScheduleId) {
      const found = event.schedules.find((s) => s.id === selectedScheduleId);
      if (found) return found;
    }
    // Match against current venue if available
    if (effectiveVenue) {
      const venueMatched = event.schedules.find(
        (s) => s.event_venue_id === effectiveVenue.id || s.venue?.id === effectiveVenue.id
      );
      if (venueMatched) return venueMatched;
    }
    return event.schedules[0];
  }, [event, selectedScheduleId, effectiveVenue]);

  // Assigned seating state: selected seats
  const [selectedSeats, setSelectedSeats] = useState<SeatItem[]>([]);

  // General admission state: ticket quantity
  const [gaQuantity, setGaQuantity] = useState<number>(1);

  // Modals & Drawers state
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isTeaserModalOpen, setIsTeaserModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { isAuthenticated, openAuthModal, openPhoneCompletionModal, currentUser } = useAuth();

  // Reset selected seats when switching schedule
  const handleScheduleChange = (schedule: ScheduleItem) => {
    setSelectedScheduleId(schedule.id);
    setSelectedSeats([]);
    setGaQuantity(1);
  };

  // Fetch seat map for assigned seating
  const isAssignedSeating = event?.seating_type === 'assigned_seating';
  const { data: seatMap, isLoading: isSeatsLoading } = useScheduleSeatsQuery(
    selectedSchedule?.id,
    Boolean(isAssignedSeating && selectedSchedule?.id)
  );

  // Toggle seat selection
  const handleToggleSeat = (seat: SeatItem) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  // Remove individual seat from selection bar
  const handleRemoveSeat = (seatId: number) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  // Calculate totals (Dynamic Pricing: Reguler vs VIP per-seat)
  const ticketCount = isAssignedSeating ? selectedSeats.length : gaQuantity;

  const vipSeatsCount = useMemo(() => {
    return isAssignedSeating ? selectedSeats.filter((s) => s.seat_type === 'vip').length : 0;
  }, [isAssignedSeating, selectedSeats]);

  const regularSeatsCount = isAssignedSeating ? ticketCount - vipSeatsCount : ticketCount;

  const totalPrice = useMemo(() => {
    if (!isAssignedSeating) {
      return gaQuantity * (selectedSchedule?.ticket_price || 0);
    }
    return selectedSeats.reduce((acc, seat) => {
      const seatPrice =
        seat.seat_type === 'vip' &&
        selectedSchedule?.vip_ticket_price !== null &&
        selectedSchedule?.vip_ticket_price !== undefined
          ? selectedSchedule.vip_ticket_price
          : selectedSchedule?.ticket_price || 0;
      return acc + seatPrice;
    }, 0);
  }, [isAssignedSeating, gaQuantity, selectedSchedule, selectedSeats]);

  // Real-time sales status gatekeeper (SSOT for Sales Window & Auto-Draft)
  const concludesAt = event?.event_concludes_at;
  const salesStatus = useEventSalesStatus(event?.sales_start_at, event?.sales_end_at, concludesAt);
  const isSalesClosed = salesStatus ? !salesStatus.canBook : false;
  const isSalesUpcoming = salesStatus?.phase === 'upcoming';
  const isSalesEnded = isSalesClosed && !isSalesUpcoming;

  const formatDateShort = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  const handleProceedBooking = () => {
    if (salesStatus && !salesStatus.canBook) {
      toast.warning(salesStatus.label);
      return;
    }

    if (isAssignedSeating && selectedSeats.length === 0) {
      toast.warning('Silakan pilih minimal 1 kursi terlebih dahulu.');
      return;
    }

    if (ticketCount <= 0) {
      toast.warning('Pilih minimal 1 tiket untuk melanjutkan.');
      return;
    }

    if (!isAuthenticated) {
      toast.info('Silakan masuk dengan akun Google terlebih dahulu.');
      openAuthModal();
      return;
    }

    if (!currentUser?.phone_number || !currentUser.is_profile_completed) {
      toast.info('Harap lengkapi nomor WhatsApp Anda untuk verifikasi identitas tiket.');
      openPhoneCompletionModal();
      return;
    }

    setIsCheckoutModalOpen(true);
  };

  if (isEventLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
        <p className="text-sm text-neutral-400">Memuat data screening & denah studio...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-20 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-red-900/50 bg-red-950/40 text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Screening Tidak Ditemukan</h2>
        <p className="text-xs text-neutral-400">
          Jadwal pemutaran yang Anda cari mungkin telah berakhir atau belum dipublikasikan.
        </p>
        <button
          type="button"
          onClick={() => onNavigate?.('/events')}
          className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#0052D4]"
        >
          ← Kembali ke Jadwal Screening
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 sm:pb-32">
      {/* 1. EVENT HEADER SECTION (Compact & Unified on Mobile & Desktop) */}
      <div className="border-b border-neutral-900 bg-neutral-950/80 py-4 sm:py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Poster (Aspect 2:3, scaled to tightly match adjacent metadata height) */}
            <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg sm:w-32 md:w-36">
              <img
                src={event.poster_url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Metadata & Actions (Natural compact flow, eliminating excessive gaps) */}
            <div className="flex min-w-0 flex-1 flex-col justify-start space-y-2.5">
              <div className="space-y-1">
                {event.cinema_partner && (
                  <span className="text-[11px] font-medium text-neutral-400">
                    Partner: <strong className="text-neutral-200">{event.cinema_partner}</strong>
                  </span>
                )}

                <h1 className="line-clamp-2 font-display text-base font-bold tracking-tight text-white drop-shadow-md sm:text-2xl lg:text-3xl">
                  {event.title}
                </h1>

                {/* Film Specifications Row: [13+] • 2024 • 2j 5m (125m) • Drama, Romansa */}
                {(event.release_year ||
                  event.duration_minutes ||
                  (event.genre && event.genre.length > 0) ||
                  event.age_rating) && (
                  <div className="flex flex-wrap items-center gap-2 py-0.5 text-xs text-neutral-300">
                    {event.age_rating && (
                      <span className="rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm">
                        {event.age_rating}
                      </span>
                    )}
                    {event.release_year && (
                      <>
                        {event.age_rating && <span className="text-neutral-600">•</span>}
                        <span className="font-semibold text-neutral-200">{event.release_year}</span>
                      </>
                    )}
                    {event.duration_minutes ? (
                      <>
                        {(event.age_rating || event.release_year) && (
                          <span className="text-neutral-600">•</span>
                        )}
                        <span className="flex items-center gap-1 font-medium text-neutral-300">
                          <Clock className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="font-semibold text-white">
                            {formatMovieDuration(event.duration_minutes)}
                          </span>
                          <span className="text-[11px] text-neutral-400">
                            ({event.duration_minutes}m)
                          </span>
                        </span>
                      </>
                    ) : null}
                    {event.genre && event.genre.length > 0 && (
                      <>
                        {(event.age_rating || event.release_year || event.duration_minutes) && (
                          <span className="text-neutral-600">•</span>
                        )}
                        <span className="font-medium text-blue-400">
                          {Array.isArray(event.genre) ? event.genre.join(', ') : event.genre}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Sales Status Badge (Clean, minimalist, integrated below specs) */}
                {salesStatus && (
                  <div className="pt-0.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide shadow-sm',
                        salesStatus.badgeStyle
                      )}
                    >
                      {salesStatus.phase === 'live' && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </span>
                      )}
                      {salesStatus.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons (Teaser & Detail Rules) */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {event.cloudflare_teaser_uid && (
                  <button
                    type="button"
                    onClick={() => setIsTeaserModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
                  >
                    <Play className="h-3 w-3 fill-white text-white" />
                    <span>Teaser</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDetailDrawerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
                >
                  <Info className="h-3 w-3 text-blue-400" />
                  <span>Detail Informasi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOOKING STUDIO */}
      <div className="mx-auto mt-4 max-w-7xl px-4 sm:mt-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-8">
          {/* LEFT PANEL (40%): Schedule Picker */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-2xl border-0 bg-transparent p-0 sm:border sm:border-neutral-800 sm:bg-neutral-950 sm:p-5">
              <ScheduleSelector
                venues={venues}
                schedules={event.schedules}
                selectedVenueId={selectedVenueId}
                onSelectVenue={(vId) => {
                  setSelectedVenueId(vId);
                  setSelectedSeats([]);
                  setGaQuantity(1);
                }}
                selectedDate={selectedDate}
                onSelectDate={(dStr) => {
                  setSelectedDate(dStr);
                  setSelectedSeats([]);
                  setGaQuantity(1);
                }}
                selectedScheduleId={selectedSchedule?.id}
                onSelectSchedule={handleScheduleChange}
              />
            </div>
          </div>

          {/* RIGHT PANEL (60%): Interactive Seat Grid OR General Admission Stepper */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950/80 p-3 sm:border-neutral-800 sm:p-6">
              {/* Informative Banner: Ticket Sales Closed */}
              {isSalesEnded && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Periode Pemesanan Tiket Telah Ditutup</span>
                    <p className="text-[11px] leading-relaxed text-neutral-300">
                      Penjualan tiket untuk screening ini telah berakhir pada{' '}
                      <strong className="text-white">
                        {event?.sales_end_at
                          ? formatDateShort(event.sales_end_at)
                          : 'waktu yang ditentukan'}{' '}
                        WIB
                      </strong>
                      . Anda tetap dapat melihat informasi sesi tayang dan tata letak denah studio
                      di bawah ini.
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-center justify-between border-b border-neutral-900 pb-3 sm:mb-6 sm:pb-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-white sm:text-base">
                    {isAssignedSeating ? 'Pilih Kursi Bioskop' : 'Pilih Jumlah Tiket'}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-neutral-400 sm:text-xs">
                    {selectedSchedule
                      ? `Sesi: ${new Date(selectedSchedule.show_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')} WIB • ${selectedSchedule.studio_name || 'Studio 1'} • ${effectiveVenue?.venue_name || event.venue_name}`
                      : 'Pilih jadwal di panel kiri'}
                  </p>
                </div>

                {isAssignedSeating && (
                  <span className="font-mono text-xs text-neutral-400">
                    Terpilih: <strong className="text-white">{selectedSeats.length}</strong>/
                    {maxTicketsPerOrder}
                  </span>
                )}
              </div>

              {/* Mode 1: Assigned Seating Grid */}
              {isAssignedSeating ? (
                isSeatsLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-3 py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                    <p className="text-xs text-neutral-400">Mengambil denah kursi studio...</p>
                  </div>
                ) : seatMap && seatMap.seats && seatMap.seats.length > 0 ? (
                  <SeatGrid
                    seatMap={seatMap}
                    selectedSeats={selectedSeats}
                    onToggleSeat={handleToggleSeat}
                    maxSeats={maxTicketsPerOrder}
                    previewMode={isSalesClosed}
                    previewMessage={
                      isSalesUpcoming
                        ? 'Mode Pratinjau Denah Studio • Pemilihan kursi resmi dibuka saat periode penjualan dimulai.'
                        : 'Penjualan Tiket Ditutup • Pemesanan tiket telah berakhir. Denah studio ditampilkan dalam mode pratinjau.'
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-neutral-500">
                      <Armchair className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Denah Kursi Belum Tersedia</h4>
                      <p className="max-w-xs text-xs text-neutral-400">
                        Denah kursi fisik untuk sesi ini belum dikonfigurasi oleh pengelola venue.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                /* Mode 2: General Admission Stepper */
                selectedSchedule && (
                  <div className={cn(isSalesClosed && 'pointer-events-none opacity-50')}>
                    <GeneralAdmissionSelector
                      schedule={selectedSchedule}
                      quantity={gaQuantity}
                      onQuantityChange={setGaQuantity}
                      maxTickets={maxTicketsPerOrder}
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. STICKY BOTTOM SUMMARY BAR (Compact Single Row on Mobile, Rich on Desktop) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 shadow-2xl backdrop-blur-md sm:p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-6">
          {/* Left: Summary Info */}
          <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-6">
            {/* Selected Tickets Detail Chips (Desktop only) */}
            <div className="vercel-scrollbar hidden overflow-x-auto sm:flex sm:items-center sm:gap-3">
              <span className="shrink-0 text-xs font-semibold text-neutral-400">
                Kursi Dipilih:
              </span>
              {isAssignedSeating ? (
                selectedSeats.length > 0 ? (
                  <div className="flex flex-nowrap items-center gap-1.5">
                    {selectedSeats.map((seat) => (
                      <span
                        key={seat.id}
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-medium',
                          seat.seat_type === 'vip'
                            ? 'border border-amber-500/40 bg-amber-500/15 text-amber-300'
                            : 'border border-neutral-700 bg-neutral-800 text-neutral-200'
                        )}
                      >
                        <span>{seat.seat_code}</span>
                        {seat.seat_type === 'vip' && (
                          <span className="rounded bg-amber-500/25 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                            VIP
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSeat(seat.id)}
                          className="hover:text-white"
                          aria-label={`Hapus ${seat.seat_code}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs italic text-neutral-500">
                    Belum ada kursi yang dipilih
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                  <Ticket className="h-3.5 w-3.5 text-neutral-300" />
                  <span>{gaQuantity} Tiket Masuk</span>
                </span>
              )}
            </div>

            {/* Price & Mobile Seat summary */}
            {isSalesUpcoming ? (
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Penjualan Segera Dibuka
                </p>
                <p className="text-xs font-medium text-neutral-300">
                  Tiket belum dapat dipesan • Pelajari denah kursi dan jadwal
                </p>
              </div>
            ) : isSalesEnded ? (
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Pemesanan Tiket Ditutup
                </p>
                <p className="text-xs font-medium text-neutral-300">
                  Penjualan tiket berakhir • Penayangan s/d{' '}
                  {concludesAt ? formatDateShort(concludesAt) : 'selesai'} WIB
                </p>
              </div>
            ) : (
              <div className="text-left sm:text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  {ticketCount > 0
                    ? isAssignedSeating
                      ? `${selectedSchedule?.studio_name || 'Studio 1'} • Kursi: ${selectedSeats.map((s) => s.seat_code).join(', ')}`
                      : `${selectedSchedule?.studio_name || 'Studio 1'} • ${gaQuantity} Tiket`
                    : 'Total Tagihan'}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans text-base font-bold tabular-nums text-white sm:text-xl">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                  <span className="hidden text-[10px] text-neutral-400 sm:inline">
                    {ticketCount > 0
                      ? vipSeatsCount > 0
                        ? `(${regularSeatsCount} Reguler, ${vipSeatsCount} VIP)`
                        : `(${ticketCount} Kursi)`
                      : null}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: CTA Button */}
          {isSalesUpcoming ? (
            <button
              type="button"
              disabled
              className="inline-flex shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-400 sm:px-6 sm:py-3 sm:text-sm"
              title="Penjualan tiket belum dibuka"
            >
              <Clock className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Segera Dibuka</span>
            </button>
          ) : isSalesEnded ? (
            <button
              type="button"
              disabled
              className="inline-flex shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-neutral-500 sm:px-6 sm:py-3 sm:text-sm"
              title="Penjualan tiket untuk screening ini telah ditutup"
            >
              <Lock className="h-4 w-4 text-neutral-500" />
              <span>Tiket Ditutup</span>
            </button>
          ) : isTicketSalesFrozen ? (
            <button
              type="button"
              disabled
              className="inline-flex shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-xs font-semibold text-amber-400 sm:px-6 sm:py-3 sm:text-sm"
              title="Pemesanan tiket saat ini sedang dibekukan sementara oleh pengelola"
            >
              <Lock className="h-4 w-4" />
              <span>Penjualan Dibekukan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleProceedBooking}
              disabled={ticketCount === 0 || isSalesClosed}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-neutral-950 transition-all hover:bg-neutral-200 active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500 sm:px-6 sm:py-3 sm:text-sm"
            >
              <span>Beli Tiket</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4. MODALS & DRAWERS */}
      <EventDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        event={event}
        activeVenue={effectiveVenue}
        onSelectVenue={(venue) => {
          setSelectedVenueId(venue.id);
          setSelectedSeats([]);
          setGaQuantity(1);
        }}
      />

      {/* Checkout & Payment Modal (Fase 5) */}
      {selectedSchedule && isCheckoutModalOpen && (
        <EventCheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          event={event}
          schedule={selectedSchedule}
          selectedSeats={selectedSeats}
          gaQuantity={gaQuantity}
          onPaymentSuccess={() => {
            setSelectedSeats([]);
            queryClient.invalidateQueries({ queryKey: SCHEDULE_SEATS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: EVENT_DETAIL_QUERY_KEY });
          }}
        />
      )}

      {/* Cloudflare Teaser Modal */}
      {isTeaserModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-0 backdrop-blur-md sm:p-4 md:p-6"
          onClick={() => setIsTeaserModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-none border-0 bg-neutral-950 shadow-2xl sm:rounded-2xl sm:border sm:border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <SinemusCinemaPlayer
              key={event.cloudflare_teaser_token || event.cloudflare_teaser_uid}
              manifestUrl={event.cloudflare_teaser_playback_url}
              videoUid={event.cloudflare_teaser_uid}
              signedToken={event.cloudflare_teaser_token}
              title={`Teaser Trailer: ${event.title}`}
              autoplay={true}
              onBack={() => setIsTeaserModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
