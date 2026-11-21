import React, { useState } from 'react';
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Film,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  KeyRound,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import {
  useAdminMovieAccessQuery,
  GrantAccessModal,
  RevokeAccessModal,
  type AdminMovieAccessItem,
} from '@/features/admin';

export interface AdminMovieAccessPageProps {
  onNavigate: (path: string) => void;
}

const expirationDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function getStatusBadge(
  status: AdminMovieAccessItem['access_status'],
  expiresAt: string,
  now: number
): React.JSX.Element {
  const isExpired = new Date(expiresAt).getTime() < now;

  if (status === 'revoked') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9px] font-semibold text-rose-400">
        <XCircle className="h-2.5 w-2.5 shrink-0" />
        Dicabut (Revoked)
      </span>
    );
  }

  if (status === 'expired' || isExpired) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-400">
        <Clock className="h-2.5 w-2.5 shrink-0" />
        Kedaluwarsa
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
      <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
      Aktif (Tonton)
    </span>
  );
}

function formatRemainingTime(expiresAt: string, now: number): string {
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return 'Telah Berakhir';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} Hari ${hours % 24} Jam`;
  return `${hours} Jam`;
}

export function AdminMovieAccessPage(_props: AdminMovieAccessPageProps): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const {
    inputValue: searchTerm,
    debouncedQuery,
    isDebouncing,
    setInputValue: setSearchTerm,
    clearSearch,
    hasQuery,
  } = useDebouncedSearch({ delay: 350, minChars: 2 });

  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'revoked' | 'expired'>(
    'all'
  );
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [revokingItem, setRevokingItem] = useState<AdminMovieAccessItem | null>(null);

  const { data, isLoading, isError, refetch } = useAdminMovieAccessQuery({
    search: debouncedQuery,
    status: selectedStatus,
    page: currentPage,
    per_page: perPage,
  });

  const entitlements = data?.items ?? [];
  const meta = data?.meta ?? {
    current_page: 1,
    from: 0,
    last_page: 1,
    per_page: perPage,
    to: 0,
    total: 0,
  };

  const summary = data?.meta?.summary ?? {
    total: meta.total,
    active: entitlements.filter((e) => e.access_status === 'active').length,
    expired: entitlements.filter((e) => e.access_status === 'expired').length,
    revoked: entitlements.filter((e) => e.access_status === 'revoked').length,
  };

  const [fallbackTime] = useState(() => Date.now());
  const serverTime = data?.server_time ? new Date(data.server_time).getTime() : fallbackTime;

  const handleStatusChange = (status: typeof selectedStatus) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    clearSearch();
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Entitlement Hak Tonton Film (Manual Grant)
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Pemberian hak akses sewa film digital khusus untuk media partner, kurasi, atau
            kompensasi pengguna.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsGrantModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-[0.98] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Beri Akses Manual
        </button>
      </div>

      {/* KPI Summary Cards (Executive Overview) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Entitlement */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">Total Entitlement</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
              <KeyRound className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-extrabold text-white sm:text-2xl">
              {summary.total}
            </span>
            <span className="text-[10px] text-neutral-500">Pemberian</span>
          </div>
        </div>

        {/* Akses Aktif */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">Akses Aktif</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-extrabold text-emerald-400 sm:text-2xl">
              {summary.active}
            </span>
            <span className="text-[10px] text-neutral-500">Dapat Streaming</span>
          </div>
        </div>

        {/* Kedaluwarsa */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">Kedaluwarsa</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-extrabold text-amber-400 sm:text-2xl">
              {summary.expired}
            </span>
            <span className="text-[10px] text-neutral-500">Selesai 48 Jam</span>
          </div>
        </div>

        {/* Dicabut */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">Dicabut (Revoked)</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <XCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-extrabold text-rose-400 sm:text-2xl">
              {summary.revoked}
            </span>
            <span className="text-[10px] text-neutral-500">Manual Admin</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari email pengguna, nama, atau judul film..."
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-9 pr-9 text-xs text-white placeholder-neutral-500 focus:border-[#0066FF] focus:outline-none"
          />
          {isDebouncing ? (
            <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-neutral-500" />
          ) : hasQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              title="Bersihkan pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value as typeof selectedStatus)}
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-neutral-300 focus:border-[#0066FF] focus:outline-none sm:w-auto"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif (Tonton)</option>
            <option value="expired">Kedaluwarsa</option>
            <option value="revoked">Dicabut (Revoked)</option>
          </select>
        </div>
      </div>

      {/* Entitlement Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-neutral-800 bg-[#0D111A] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Pengguna Penerima</th>
                <th className="px-4 py-4">Film Ditonton</th>
                <th className="px-4 py-4">Sisa Masa Aktif</th>
                <th className="px-4 py-4">Catatan Admin</th>
                <th className="whitespace-nowrap px-4 py-4">Status</th>
                <th className="whitespace-nowrap px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                      <span>Memuat data entitlement...</span>
                    </div>
                  </td>
                </tr>
              )}

              {isError && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-rose-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <AlertCircle className="h-4 w-4 text-rose-400" />
                        <span>Gagal memuat data hak akses film</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-1 rounded-lg bg-neutral-800 px-3 py-1 text-xs text-white hover:bg-neutral-700"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && entitlements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                    Tidak ada catatan entitlement hak akses film yang cocok.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                entitlements.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-neutral-900/40">
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-white">{item.user_name}</span>
                          <span className="block text-[11px] text-neutral-400">
                            {item.user_email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Movie */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Film className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                        <span className="font-semibold text-white">{item.movie_title}</span>
                      </div>
                    </td>

                    {/* Remaining Time */}
                    <td className="px-4 py-4">
                      <span className="font-bold text-neutral-200">
                        {formatRemainingTime(item.rental_expires_at, serverTime)}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-neutral-500">
                        Kedaluwarsa:{' '}
                        {expirationDateFormatter.format(new Date(item.rental_expires_at))}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="max-w-[200px] truncate px-4 py-4 text-neutral-400">
                      {item.admin_notes || '-'}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-4">
                      {getStatusBadge(item.access_status, item.rental_expires_at, serverTime)}
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {item.access_status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => setRevokingItem(item)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-bold text-red-300 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-95"
                        >
                          Cabut Akses
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer Meta */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-800 bg-[#0D111A] px-6 py-3.5 sm:flex-row">
          <div className="text-xs text-neutral-400">
            Menampilkan <strong className="font-semibold text-white">{meta.from || 0}</strong> -{' '}
            <strong className="font-semibold text-white">{meta.to || 0}</strong> dari{' '}
            <strong className="font-semibold text-white">{meta.total}</strong> entitlement
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page <= 1 || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-[#0B0E14] px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:bg-[#131926] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            <span className="px-2 text-xs font-bold text-neutral-300">
              Halaman {meta.current_page} dari {meta.last_page || 1}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page >= meta.last_page || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-[#0B0E14] px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:bg-[#131926] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Berikutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grant Access Modal */}
      <GrantAccessModal isOpen={isGrantModalOpen} onClose={() => setIsGrantModalOpen(false)} />

      {/* Revoke Access Modal */}
      <RevokeAccessModal accessItem={revokingItem} onClose={() => setRevokingItem(null)} />
    </div>
  );
}
