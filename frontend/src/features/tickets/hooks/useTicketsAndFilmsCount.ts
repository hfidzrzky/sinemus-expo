import { useMemo } from 'react';
import { useMyTicketsQuery } from '../api/useMyTicketsQuery';
import { useMyFilmsQuery } from '../api/useMyFilmsQuery';

export interface TicketsAndFilmsCount {
  activeTicketsCount: number;
  activeFilmsCount: number;
  totalActiveCount: number;
  hasActiveItems: boolean;
  isLoading: boolean;
}

/**
 * Headless Hook untuk menghitung akumulasi tiket screening aktif dan film sewa aktif murni.
 * Mematuhi Server Time sebagai SSOT: item yang sudah menjadi riwayat (lewat jadwal tayang,
 * sudah check-in, atau sewa kedaluwarsa) otomatis dieksklusi dari counter.
 *
 * @param enabled Menentukan apakah kueri TanStack Query aktif (biasanya isAuthenticated && currentUser)
 */
export function useTicketsAndFilmsCount(enabled = true): TicketsAndFilmsCount {
  const { data: upcomingTickets = [], isLoading: isLoadingTickets } = useMyTicketsQuery(
    'upcoming',
    enabled
  );
  const { data: films = [], isLoading: isLoadingFilms } = useMyFilmsQuery(enabled);

  const { activeTicketsCount, activeFilmsCount, totalActiveCount, hasActiveItems } = useMemo(() => {
    if (!enabled) {
      return {
        activeTicketsCount: 0,
        activeFilmsCount: 0,
        totalActiveCount: 0,
        hasActiveItems: false,
      };
    }

    // 1. Filter tiket bioskop aktif murni (bukan riwayat / past / checked-in)
    const validActiveTickets = upcomingTickets.filter((ticket) => {
      return (
        ticket.payment_status === 'paid' &&
        ticket.checkin_status !== 'checked_in' &&
        Boolean(ticket.is_upcoming)
      );
    });

    // 2. Filter sewa film VoD aktif murni (bukan riwayat sewa yang sudah kedaluwarsa)
    const validActiveFilms = films.filter((film) => {
      return !film.is_expired && film.remaining_seconds > 0;
    });

    const ticketsCount = validActiveTickets.length;
    const filmsCount = validActiveFilms.length;
    const totalCount = ticketsCount + filmsCount;

    return {
      activeTicketsCount: ticketsCount,
      activeFilmsCount: filmsCount,
      totalActiveCount: totalCount,
      hasActiveItems: totalCount > 0,
    };
  }, [enabled, upcomingTickets, films]);

  return {
    activeTicketsCount,
    activeFilmsCount,
    totalActiveCount,
    hasActiveItems,
    isLoading: enabled && (isLoadingTickets || isLoadingFilms),
  };
}
