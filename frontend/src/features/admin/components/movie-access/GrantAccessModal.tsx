import React, { useState, useMemo } from 'react';
import { X, KeyRound, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGrantMovieAccessMutation,
  useAdminMoviesQuery,
  useAdminUsersQuery,
  usePublicSettingsQuery,
} from '@/features/admin';

export interface GrantAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GrantAccessModal({
  isOpen,
  onClose,
}: GrantAccessModalProps): React.JSX.Element | null {
  const { data: usersData } = useAdminUsersQuery();
  const { data: publicSettings } = usePublicSettingsQuery();
  const defaultRentalDuration = publicSettings?.business_policies.vod_rental_duration_hours ?? 48;
  const users = useMemo(() => usersData?.users || [], [usersData]);

  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedMovieId, setSelectedMovieId] = useState<number | ''>('');
  const [customDurationHours, setCustomDurationHours] = useState<number | null>(null);
  const durationHours = customDurationHours ?? defaultRentalDuration;
  const [adminNotes, setAdminNotes] = useState<string>('Pemberian Hak Tonton Promo');

  const { data: movies = [] } = useAdminMoviesQuery();
  const grantMutation = useGrantMovieAccessMutation();

  const effectiveUserId = selectedUserId !== '' ? selectedUserId : (users[0]?.id ?? '');
  const effectiveMovieId = selectedMovieId !== '' ? selectedMovieId : (movies[0]?.id ?? '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveUserId || !effectiveMovieId) {
      toast.error('Silakan pilih pengguna dan film.');
      return;
    }

    try {
      await grantMutation.mutateAsync({
        user_id: Number(effectiveUserId),
        movie_id: Number(effectiveMovieId),
        duration_hours: durationHours,
        admin_notes: adminNotes,
      });

      toast.success('Hak akses tonton film berhasil diberikan kepada penonton.');
      onClose();
    } catch {
      toast.error('Gagal memberikan akses film.');
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14]">
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
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* User Select */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300">
              Pilih Pengguna Penonton <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={effectiveUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              {users.length === 0 ? (
                <option value="">Tidak ada pengguna terdaftar</option>
              ) : (
                users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - Role: {user.role}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Movie Select */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300">
              Pilih Film VoD <span className="text-red-400">*</span>
            </label>
            <select
              value={effectiveMovieId}
              onChange={(e) => setSelectedMovieId(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              {movies.map((movie) => (
                <option key={movie.id} value={movie.id}>
                  {movie.title} ({movie.release_year}) - {movie.formatted_rental_price}
                </option>
              ))}
            </select>
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
              onClick={onClose}
              className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={grantMutation.isPending}
              className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-50"
            >
              {grantMutation.isPending ? 'Memberikan Akses...' : 'Berikan Akses Tonton'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
