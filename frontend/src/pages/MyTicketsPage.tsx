import React, { useState } from 'react';
import { Ticket, Film, AlertCircle, ArrowRight, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UI_COPY } from '@/constants/ui-copy';
import { useAuth } from '@/features/auth';
import { tokenStorage } from '@/lib/token-storage';
import {
  useMyTicketsQuery,
  useMyFilmsQuery,
  TicketCard,
  FilmRentalCard,
  PendingPaymentBanner,
  type TicketFilterStatus,
} from '@/features/tickets';
import { usePublicSettingsQuery } from '@/features/admin';

export interface MyTicketsPageProps {
  onNavigate?: (path: string) => void;
}

type MainTab = 'tickets' | 'films';

export const MyTicketsPage: React.FC<MyTicketsPageProps> = ({ onNavigate }) => {
  const { currentUser, isAuthenticated, isLoading, openAuthModal } = useAuth();
  const { data: publicSettings } = usePublicSettingsQuery();
  const vodRentalHours = publicSettings?.business_policies.vod_rental_duration_hours ?? 48;
  const [activeTab, setActiveTab] = useState<MainTab>('tickets');
  const [ticketFilter, setTicketFilter] = useState<TicketFilterStatus>('all');

  const {
    data: tickets = [],
    isLoading: isLoadingTickets,
    isError: isErrorTickets,
    refetch: refetchTickets,
  } = useMyTicketsQuery(ticketFilter, Boolean(isAuthenticated && currentUser));

  // Mengambil daftar transaksi pending aktif pengguna (memiliki sisa waktu kunci kursi)
  const { data: pendingTickets = [], refetch: refetchPending } = useMyTicketsQuery(
    'pending',
    Boolean(isAuthenticated && currentUser)
  );
  const hasPendingTickets = pendingTickets.length > 0;

  // Mengambil jumlah tiket aktif mendatang secara global (tersinkron cache TanStack Query)
  const { data: upcomingTickets = [] } = useMyTicketsQuery(
    'upcoming',
    Boolean(isAuthenticated && currentUser)
  );
  const activeUpcomingCount = upcomingTickets.length;

  const {
    data: films = [],
    isLoading: isLoadingFilms,
    isError: isErrorFilms,
    refetch: refetchFilms,
  } = useMyFilmsQuery(Boolean(isAuthenticated && currentUser));

  const activeTicketCount = activeUpcomingCount;
  const activeFilmCount = films.filter((f) => !f.is_expired && f.remaining_seconds > 0).length;

  // Sesi sedang di-load ulang (re-hydrating) dari token storage: jangan tampilkan unauthenticated view
  if (isLoading && tokenStorage.hasToken()) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-800/60" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-neutral-800/40" />
          <div className="mt-8 space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-36 w-full animate-pulse rounded-2xl border border-neutral-800/60 bg-neutral-900/40"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-[#0066FF] shadow-lg">
          <Ticket className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white">
          Masuk untuk Melihat Tiket & Film
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          Silakan masuk dengan akun Google Anda untuk mengakses seluruh e-tiket dan film digital
          sewa aktif milik Anda.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={openAuthModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-md transition-all hover:bg-neutral-200 active:scale-95"
          >
            <LogIn className="h-4 w-4" />
            <span>Masuk Akun</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition-all hover:bg-neutral-800 hover:text-white"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* 1. Clean Header */}
      <div className="pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Tickets & Films
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Akses e-tiket screening dan film streaming aktif Anda.
        </p>
      </div>

      {/* Pending Payment Alert Banners (Seluruh Pesanan Aktif Menunggu Penyelesaian Pembayaran) */}
      {hasPendingTickets && (
        <div className="mb-6 space-y-4">
          {pendingTickets.map((pendingTicket) => (
            <PendingPaymentBanner
              key={pendingTicket.order_id}
              ticket={pendingTicket}
              onPaymentSuccess={() => {
                refetchTickets();
                refetchPending();
              }}
            />
          ))}
        </div>
      )}

      {/* 2. Main Tabs Navigation (Minimalist Underline) */}
      <div className="flex border-b border-neutral-800/80">
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={cn(
            'relative flex items-center gap-2 pb-3.5 pt-1 text-sm font-medium transition-colors',
            activeTab === 'tickets' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          )}
        >
          <Ticket className="h-4 w-4" />
          <span>Screening Tickets</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
              activeTab === 'tickets'
                ? 'bg-neutral-800 text-white'
                : 'bg-neutral-900 text-neutral-400'
            )}
          >
            {activeTicketCount}
          </span>
          {activeTab === 'tickets' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0066FF]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('films')}
          className={cn(
            'relative ml-6 flex items-center gap-2 pb-3.5 pt-1 text-sm font-medium transition-colors',
            activeTab === 'films' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          )}
        >
          <Film className="h-4 w-4" />
          <span>My Movies</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
              activeTab === 'films'
                ? 'bg-neutral-800 text-white'
                : 'bg-neutral-900 text-neutral-400'
            )}
          >
            {activeFilmCount}
          </span>
          {activeTab === 'films' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0066FF]" />
          )}
        </button>
      </div>

      {/* 3. Sub-filter & Content */}
      <div className="pt-6">
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {/* Minimal Segmented Filter */}
            <div className="inline-flex rounded-lg border border-neutral-800/80 bg-neutral-950 p-1 text-xs">
              <button
                type="button"
                onClick={() => setTicketFilter('all')}
                className={cn(
                  'rounded-md px-3 py-1 font-medium transition-colors',
                  ticketFilter === 'all'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTicketFilter('upcoming')}
                className={cn(
                  'rounded-md px-3 py-1 font-medium transition-colors',
                  ticketFilter === 'upcoming'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setTicketFilter('past')}
                className={cn(
                  'rounded-md px-3 py-1 font-medium transition-colors',
                  ticketFilter === 'past'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                Past
              </button>
            </div>

            {/* Loading */}
            {isLoadingTickets && (
              <div className="space-y-3 pt-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-32 w-full animate-pulse rounded-xl border border-neutral-800/60 bg-neutral-900/30"
                  />
                ))}
              </div>
            )}

            {/* Error */}
            {isErrorTickets && !isLoadingTickets && (
              <div className="space-y-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 text-center">
                <AlertCircle className="mx-auto h-5 w-5 text-rose-400" />
                <p className="text-xs text-neutral-300">
                  Gagal memuat tiket. Silakan periksa koneksi dan coba lagi.
                </p>
                <button
                  type="button"
                  onClick={() => refetchTickets()}
                  className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Contextual Empty State */}
            {!isLoadingTickets &&
              !isErrorTickets &&
              tickets.length === 0 &&
              (() => {
                const emptyState = (() => {
                  if (hasPendingTickets && ticketFilter !== 'past') {
                    return {
                      title: 'Pesanan Menunggu Pembayaran',
                      description:
                        pendingTickets.length > 1
                          ? `Anda memiliki ${pendingTickets.length} transaksi yang sedang menunggu pembayaran di atas. Selesaikan pembayaran sebelum batas waktu berakhir agar e-tiket Anda diterbitkan di sini.`
                          : 'Anda memiliki transaksi yang sedang menunggu pembayaran di banner atas. Selesaikan pembayaran sebelum batas waktu penguncian berakhir agar e-tiket Anda diterbitkan di sini.',
                      buttonLabel: 'Lihat Tagihan di Atas',
                      onAction: () => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      },
                    };
                  }

                  if (ticketFilter === 'past') {
                    return {
                      title: UI_COPY.TICKETS.EMPTY_STATE_PAST_TITLE,
                      description:
                        activeUpcomingCount > 0
                          ? UI_COPY.TICKETS.EMPTY_STATE_PAST_DESC_ACTIVE
                          : UI_COPY.TICKETS.EMPTY_STATE_PAST_DESC_EMPTY,
                      buttonLabel:
                        activeUpcomingCount > 0
                          ? `${UI_COPY.TICKETS.EMPTY_STATE_BTN_VIEW_UPCOMING} (${activeUpcomingCount})`
                          : UI_COPY.TICKETS.EMPTY_STATE_BTN_EXPLORE,
                      onAction:
                        activeUpcomingCount > 0
                          ? () => setTicketFilter('upcoming')
                          : () => onNavigate?.('/events'),
                    };
                  }

                  if (ticketFilter === 'upcoming') {
                    return {
                      title: UI_COPY.TICKETS.EMPTY_STATE_UPCOMING_TITLE,
                      description: UI_COPY.TICKETS.EMPTY_STATE_UPCOMING_DESC,
                      buttonLabel: UI_COPY.TICKETS.EMPTY_STATE_BTN_EXPLORE,
                      onAction: () => onNavigate?.('/events'),
                    };
                  }

                  // Default 'all'
                  return {
                    title: UI_COPY.TICKETS.EMPTY_STATE_ALL_TITLE,
                    description: UI_COPY.TICKETS.EMPTY_STATE_ALL_DESC,
                    buttonLabel: UI_COPY.TICKETS.EMPTY_STATE_BTN_EXPLORE,
                    onAction: () => onNavigate?.('/events'),
                  };
                })();

                return (
                  <div className="space-y-3 rounded-xl border border-dashed border-neutral-800/80 p-8 text-center">
                    <p className="text-sm font-semibold text-neutral-200">{emptyState.title}</p>
                    <p className="mx-auto max-w-sm text-xs leading-relaxed text-neutral-400">
                      {emptyState.description}
                    </p>
                    <button
                      type="button"
                      onClick={emptyState.onAction}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0052D4]"
                    >
                      <span>{emptyState.buttonLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })()}

            {/* Ticket Cards List */}
            {!isLoadingTickets && !isErrorTickets && tickets.length > 0 && (
              <div className="space-y-3 pt-1">
                {tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'films' && (
          <div className="space-y-4">
            {/* Loading */}
            {isLoadingFilms && (
              <div className="space-y-3 pt-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-28 w-full animate-pulse rounded-xl border border-neutral-800/60 bg-neutral-900/30"
                  />
                ))}
              </div>
            )}

            {/* Error */}
            {isErrorFilms && !isLoadingFilms && (
              <div className="space-y-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 text-center">
                <AlertCircle className="mx-auto h-5 w-5 text-rose-400" />
                <p className="text-xs text-neutral-300">
                  Gagal memuat film sewa. Silakan coba lagi.
                </p>
                <button
                  type="button"
                  onClick={() => refetchFilms()}
                  className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingFilms && !isErrorFilms && films.length === 0 && (
              <div className="space-y-3 rounded-xl border border-dashed border-neutral-800/80 p-8 text-center">
                <p className="text-sm font-medium text-neutral-300">
                  Belum ada film di daftar streaming Anda
                </p>
                <p className="mx-auto max-w-xs text-xs text-neutral-500">
                  Nikmati koleksi film indie pilihan dengan masa akses streaming {vodRentalHours}{' '}
                  jam.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/movies')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0066FF] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0052D4]"
                >
                  <span>Katalog Film</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Film Cards List */}
            {!isLoadingFilms && !isErrorFilms && films.length > 0 && (
              <div className="space-y-3 pt-1">
                {films.map((film) => (
                  <FilmRentalCard
                    key={film.movie_id}
                    film={film}
                    onWatch={(slug) => onNavigate?.(`/watch/${slug}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
