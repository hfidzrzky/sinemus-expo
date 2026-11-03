import React, { useState } from 'react';
import { Plus, Search, Clock, CheckCircle2, XCircle, Film, User } from 'lucide-react';
import {
  useAdminMovieAccessQuery,
  GrantAccessModal,
  RevokeAccessModal,
  type AdminMovieAccessItem,
} from '@/features/admin';

export interface AdminMovieAccessPageProps {
  onNavigate: (path: string) => void;
}

export function AdminMovieAccessPage(_props: AdminMovieAccessPageProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'revoked' | 'expired'>(
    'all'
  );
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [revokingItem, setRevokingItem] = useState<AdminMovieAccessItem | null>(null);

  const { data: entitlements = [], isLoading, isError, refetch } = useAdminMovieAccessQuery();

  const filteredItems = (entitlements || []).filter((item) => {
    if (!item) return false;
    const matchesSearch =
      (item.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.movie_title || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || item.access_status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const [currentTime] = useState(() => Date.now());

  const getStatusBadge = (
    status: AdminMovieAccessItem['access_status'],
    expiresAt: string,
    now: number
  ) => {
    const isExpired = new Date(expiresAt).getTime() < now;

    if (status === 'revoked') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
          <XCircle className="h-3 w-3" />
          Dicabut (Revoked)
        </span>
      );
    }

    if (status === 'expired' || isExpired) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
          <Clock className="h-3 w-3" />
          Kedaluwarsa
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Aktif (Tonton)
      </span>
    );
  };

  const formatRemainingTime = (expiresAt: string, now: number) => {
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return 'Telah Berakhir';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} Hari ${hours % 24} Jam`;
    return `${hours} Jam`;
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
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Beri Akses Manual
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari email pengguna, nama, atau judul film..."
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
          className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-neutral-300 focus:border-blue-500 focus:outline-none sm:w-auto"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="revoked">Dicabut</option>
          <option value="expired">Kedaluwarsa</option>
        </select>
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
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                    Memuat data entitlement...
                  </td>
                </tr>
              )}

              {isError && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-rose-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-xs font-semibold">
                        Gagal memuat data hak akses film
                      </span>
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

              {!isLoading && !isError && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                    Tidak ada catatan entitlement hak akses film yang cocok.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                filteredItems.map((item) => (
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
                        {formatRemainingTime(item.rental_expires_at, currentTime)}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-neutral-500">
                        Kedaluwarsa: {new Date(item.rental_expires_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="max-w-[200px] truncate px-4 py-4 text-neutral-400">
                      {item.admin_notes || '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {getStatusBadge(item.access_status, item.rental_expires_at, currentTime)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {item.access_status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => setRevokingItem(item)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-bold text-red-300 transition-colors hover:bg-red-500/20"
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
      </div>

      {/* Grant Access Modal */}
      <GrantAccessModal isOpen={isGrantModalOpen} onClose={() => setIsGrantModalOpen(false)} />

      {/* Revoke Access Modal */}
      <RevokeAccessModal accessItem={revokingItem} onClose={() => setRevokingItem(null)} />
    </div>
  );
}
