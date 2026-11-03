import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  CircleDashed,
} from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { ApiError } from '@/lib/api-client';
import {
  useAdminMoviesQuery,
  useDeleteMovieMutation,
  AdminStreamTestModal,
  type AdminMovieItem,
} from '@/features/admin';
import { formatMovieDuration } from '@/features/movies';

export interface AdminMoviesPageProps {
  onNavigate: (path: string) => void;
}

export function AdminMoviesPage({ onNavigate }: AdminMoviesPageProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [deletingMovieId, setDeletingMovieId] = useState<number | null>(null);
  const [activeTestMovie, setActiveTestMovie] = useState<AdminMovieItem | null>(null);

  const { data: movies = [], isLoading, isError, refetch } = useAdminMoviesQuery();
  const deleteMutation = useDeleteMovieMutation();

  const filteredMovies = (movies || []).filter((movie) => {
    if (!movie) return false;
    const matchesSearch =
      (movie.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movie.director || '').toLowerCase().includes(searchTerm.toLowerCase());
    const movieGenres = Array.isArray(movie.genre) ? movie.genre : [];
    const matchesGenre = selectedGenre === 'all' || movieGenres.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  const handleDeleteConfirm = async () => {
    if (!deletingMovieId) return;

    try {
      await deleteMutation.mutateAsync(deletingMovieId);
      toast.success(`Film #${deletingMovieId} berhasil dihapus dari katalog.`);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else if (isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Gagal menghapus film.');
      }
    } finally {
      setDeletingMovieId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Manajemen Katalog Film (VoD)
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Katalog film digital sewa streaming yang dilindungi Cloudflare Stream HLS Signed Token.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/admin/movies/new')}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Film Baru
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
            placeholder="Cari judul film atau sutradara..."
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Genre Filter */}
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-neutral-300 focus:border-blue-500 focus:outline-none sm:w-auto"
        >
          <option value="all">Semua Genre</option>
          <option value="Drama">Drama</option>
          <option value="Horor">Horor</option>
          <option value="Dokumenter">Dokumenter</option>
          <option value="Misteri">Misteri</option>
          <option value="Komedi">Komedi</option>
        </select>
      </div>

      {/* Movies Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-neutral-800 bg-[#0D111A] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Poster & Judul Film</th>
                <th className="px-4 py-4">Genre & Tahun</th>
                <th className="px-4 py-4">Tarif Sewa</th>
                <th className="px-4 py-4">Penyewa Aktif</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                    Memuat inventaris film VoD...
                  </td>
                </tr>
              )}

              {isError && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-rose-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6" />
                      <span className="text-xs font-semibold">Gagal memuat katalog film</span>
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

              {!isLoading && !isError && filteredMovies.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                    Tidak ada film yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                filteredMovies.map((movie) => (
                  <tr key={movie.id} className="transition-colors hover:bg-neutral-900/40">
                    {/* Poster & Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="h-14 w-10 flex-shrink-0 rounded-lg border border-neutral-800 object-cover"
                        />
                        <div>
                          <h4 className="font-display text-sm font-extrabold text-white">
                            {movie.title}
                          </h4>
                          <p className="mt-0.5 text-[11px] text-neutral-400">
                            Sutradara: {movie.director}
                          </p>
                          <span className="font-mono text-[10px] text-blue-400">
                            /movie/{movie.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Genre & Year */}
                    <td className="px-4 py-4">
                      <span className="font-medium text-white">
                        {Array.isArray(movie.genre) ? movie.genre.join(', ') : (movie.genre ?? '')}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-neutral-400">
                        {movie.release_year} • {formatMovieDuration(movie.duration_minutes)} •{' '}
                        {movie.age_rating}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-4">
                      <span className="font-bold text-white">{movie.formatted_rental_price}</span>
                      <span className="mt-0.5 block text-[10px] text-neutral-400">
                        {movie.access_model === 'rental'
                          ? movie.active_rental_duration_hours
                            ? `Sewa ${movie.active_rental_duration_hours} Jam`
                            : 'Sewa Berbayar'
                          : 'Akses Gratis'}
                      </span>
                    </td>

                    {/* Penyewa Aktif */}
                    <td className="px-4 py-4">
                      {movie.access_model === 'free' || Number(movie.rental_price || 0) === 0 ? (
                        <span
                          className="font-mono text-xs text-neutral-500"
                          title="Film gratis tidak memiliki penyewa"
                        >
                          -
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-400">
                          <strong className="text-white">{movie.active_rentals_count || 0}</strong>{' '}
                          Penyewa Aktif
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {movie.is_published ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-0.5 text-[10px] font-bold text-neutral-400">
                            <CircleDashed className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {movie.cloudflare_video_uid && (
                          <button
                            type="button"
                            onClick={() => setActiveTestMovie(movie)}
                            className="rounded-lg border border-neutral-800 bg-[#0D111A] p-2 text-neutral-300 transition-colors hover:border-neutral-700 hover:text-white"
                            title="Uji Putar Stream HLS"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigate(`/admin/movies/${movie.id}/edit`)}
                          className="rounded-lg border border-neutral-800 bg-[#0D111A] p-2 text-neutral-300 transition-colors hover:border-neutral-700 hover:text-white"
                          title="Edit Film"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingMovieId(movie.id)}
                          className="rounded-lg border border-neutral-800 bg-[#0D111A] p-2 text-neutral-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                          title="Hapus Film"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingMovieId && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#0B0E14] p-6">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-display text-sm font-bold text-white">Hapus Film VoD?</h3>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Tindakan ini akan menghapus entri film dari katalog. Pengguna yang sedang menyewa
              tidak akan dapat mengakses streaming.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingMovieId(null)}
                className="rounded-xl border border-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Test Modal */}
      {activeTestMovie && (
        <AdminStreamTestModal
          isOpen={Boolean(activeTestMovie)}
          onClose={() => setActiveTestMovie(null)}
          title={activeTestMovie.title}
          streamUid={activeTestMovie.cloudflare_video_uid}
        />
      )}
    </div>
  );
}
