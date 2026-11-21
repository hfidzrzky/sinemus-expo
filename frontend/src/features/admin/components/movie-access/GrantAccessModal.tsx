import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, KeyRound, Clock, Info, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { cn } from '@/lib/utils';
import { useDebouncedSearch } from '@/hooks';
import {
  useGrantMovieAccessMutation,
  useAdminMoviesQuery,
  useAdminUsersQuery,
  usePublicSettingsQuery,
  type AdminUserListItem,
} from '@/features/admin';

export interface GrantAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GrantAccessModal({
  isOpen,
  onClose,
}: GrantAccessModalProps): React.JSX.Element | null {
  const { data: publicSettings } = usePublicSettingsQuery();
  const defaultRentalDuration = publicSettings?.business_policies.vod_rental_duration_hours ?? 48;

  // Headless Debounced Search Hook (300ms, min 2 chars, anti-OOM)
  const {
    inputValue: searchQuery,
    debouncedQuery,
    isDebouncing,
    setInputValue: setSearchQuery,
    clearSearch,
  } = useDebouncedSearch({ delay: 300, minChars: 2 });

  // Query backend dengan filter pencarian ter-debounce saat modal terbuka (hanya ambil 8 record)
  const { data: usersData, isFetching: isFetchingUsers } = useAdminUsersQuery(
    {
      search: debouncedQuery,
      per_page: 8,
    },
    isOpen
  );

  const users = useMemo(() => usersData?.users || [], [usersData]);

  // Selected User State (Combobox Architecture)
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedMovieId, setSelectedMovieId] = useState<number | ''>('');
  const [customDurationHours, setCustomDurationHours] = useState<number | null>(null);
  const durationHours = customDurationHours ?? defaultRentalDuration;
  const [adminNotes, setAdminNotes] = useState<string>('Pemberian Hak Tonton Promo');

  const { data: movies = [] } = useAdminMoviesQuery();
  const grantMutation = useGrantMovieAccessMutation();

  // Hanya tampilkan film berbayar (rental/sewa) karena film gratis dapat ditonton langsung oleh publik
  const rentableMovies = useMemo(
    () => movies.filter((m) => m.access_model === 'rental' && Number(m.rental_price || 0) > 0),
    [movies]
  );

  const effectiveMovieId = selectedMovieId !== '' ? selectedMovieId : (rentableMovies[0]?.id ?? '');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleModalClose = () => {
    setSelectedUser(null);
    setSelectedMovieId('');
    setCustomDurationHours(null);
    clearSearch();
    setIsDropdownOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error('Silakan cari dan pilih pengguna penonton penerima hak akses.');
      return;
    }

    if (!effectiveMovieId || rentableMovies.length === 0) {
      toast.error('Silakan pilih film berbayar yang valid.');
      return;
    }

    try {
      await grantMutation.mutateAsync({
        user_id: selectedUser.id,
        movie_id: Number(effectiveMovieId),
        duration_hours: durationHours,
        admin_notes: adminNotes,
      });

      toast.success(`Hak akses tonton film berhasil diberikan kepada ${selectedUser.name}.`);
      handleModalClose();
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Gagal memberikan akses film.');
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Full Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={handleModalClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-white">
                Beri Hak Akses Tonton Film Manual
              </h3>
              <p className="text-[11px] text-neutral-400">
                Pemberian entitlement streaming langsung ke akun penonton tanpa tagihan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* User Combobox / Searchable Autocomplete */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-300">
                Pilih Pengguna Penonton <span className="text-red-400">*</span>
              </label>
              {!selectedUser && (
                <span className="text-[10px] text-neutral-500">Ketik min. 2 karakter</span>
              )}
            </div>

            {selectedUser ? (
              /* Selected User Card (Clean & Focused) */
              <div className="mt-1.5 flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs font-bold uppercase text-blue-400">
                    {selectedUser.name.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-bold text-white">
                        {selectedUser.name}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                          selectedUser.role === 'super_admin'
                            ? 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
                            : 'border border-blue-500/30 bg-blue-500/10 text-blue-400'
                        )}
                      >
                        {selectedUser.role === 'super_admin' ? 'Admin' : 'Penonton'}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-neutral-400">{selectedUser.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setIsDropdownOpen(true);
                  }}
                  className="ml-3 shrink-0 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-300 transition-all hover:bg-neutral-800 hover:text-white active:scale-95"
                >
                  Ganti
                </button>
              </div>
            ) : (
              /* Searchable Input + Popover List */
              <div ref={dropdownRef} className="relative mt-1.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Cari nama atau email penonton..."
                    className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-9 pr-8 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                  {isFetchingUsers || isDebouncing ? (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-blue-500" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => clearSearch()}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Dropdown Options */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-neutral-800 bg-[#0D111A] p-1.5 shadow-2xl backdrop-blur-lg">
                    {users.length === 0 ? (
                      <div className="py-4 text-center text-xs text-neutral-500">
                        {isFetchingUsers
                          ? 'Mencari pengguna...'
                          : searchQuery.trim().length >= 2
                            ? 'Tidak ada penonton yang cocok.'
                            : 'Ketik nama atau email penonton untuk mencari.'}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {users.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDropdownOpen(false);
                              clearSearch();
                            }}
                            className="flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-neutral-800/80 active:scale-[0.99]"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-[10px] font-bold uppercase text-neutral-300">
                                {user.name.charAt(0) || 'U'}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-white">
                                  {user.name}
                                </p>
                                <p className="truncate text-[10px] text-neutral-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <span
                              className={cn(
                                'ml-2 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                                user.role === 'super_admin'
                                  ? 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
                                  : 'border border-neutral-700 bg-neutral-800 text-neutral-300'
                              )}
                            >
                              {user.role === 'super_admin' ? 'Admin' : 'Penonton'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Movie Select */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-300">
                Pilih Film VoD Sewa <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] text-neutral-500">Khusus Film Berbayar</span>
            </div>
            <select
              disabled={rentableMovies.length === 0}
              value={effectiveMovieId}
              onChange={(e) => setSelectedMovieId(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rentableMovies.length === 0 ? (
                <option value="">Tidak ada film sewa berbayar di katalog</option>
              ) : (
                rentableMovies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title} ({movie.release_year}) - {movie.formatted_rental_price}
                  </option>
                ))
              )}
            </select>
            <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-2 text-[10px] text-neutral-400">
              <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-sky-400" />
              <span>
                Film berstatus <strong>Akses Gratis</strong> tidak memerlukan pemberian hak akses
                karena dapat langsung ditonton bebas oleh seluruh pengguna tanpa batas waktu.
              </span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300">
              Masa Berlaku Akses (Jam) <span className="text-red-400">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                type="number"
                min="1"
                max="720"
                required
                value={durationHours}
                onChange={(e) => setCustomDurationHours(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-9 pr-3.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <Clock className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            </div>
            <span className="mt-1 block text-[10px] text-neutral-500">
              Contoh: {defaultRentalDuration} Jam (Standar Platform), 168 Jam (1 Minggu), 720 Jam
              (30 Hari)
            </span>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300">
              Catatan Alasan Admin
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Contoh: Media Reviewer, Giveaway Pemenang IG, Juri Festival"
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-neutral-800/80 pt-4">
            <button
              type="button"
              onClick={handleModalClose}
              className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={grantMutation.isPending || !selectedUser || rentableMovies.length === 0}
              className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {grantMutation.isPending ? 'Memberikan Akses...' : 'Berikan Akses Tonton'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
