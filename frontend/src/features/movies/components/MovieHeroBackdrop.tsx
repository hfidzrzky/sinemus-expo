import React, { useState } from 'react';
import { Play, Film, AlertTriangle, Clock } from 'lucide-react';
import { usePublicSettingsQuery } from '@/features/admin';
import { cn } from '@/lib/utils';
import { formatMovieDuration } from '../utils/formatters';
import type { MovieDetail } from '../types';

export interface MovieHeroBackdropProps {
  movie: MovieDetail;
  onOpenRentalModal: () => void;
  onOpenTrailerModal?: () => void;
  onWatchClick?: () => void;
  className?: string;
}

export const MovieHeroBackdrop: React.FC<MovieHeroBackdropProps> = ({
  movie,
  onOpenRentalModal,
  onOpenTrailerModal,
  onWatchClick,
  className = '',
}) => {
  const { data: publicSettings } = usePublicSettingsQuery();
  const [failedBackdropUrl, setFailedBackdropUrl] = useState<string | null>(null);

  // Derived state: error hanya aktif jika URL yang gagal cocok dengan URL backdrop aktif saat ini
  const hasBackdropError = Boolean(movie.backdrop_url && failedBackdropUrl === movie.backdrop_url);

  // 1. Durasi sewa dinamis dengan fallback ke pengaturan publik platform (default 48 jam)
  const rentalDurationHours =
    movie.rental_duration_hours ||
    publicSettings?.business_policies?.vod_rental_duration_hours ||
    48;

  // 2. Emergency Freeze VoD Guard
  const isVodFrozen = Boolean(publicSettings?.emergency_controls?.freeze_vod_rentals);

  // 3. Format harga sewa film
  const formattedPrice =
    movie.formatted_price ||
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(movie.price);

  return (
    <div className={cn('relative w-full overflow-hidden bg-black text-white', className)}>
      {/* Visual Backdrop 16:9 dengan overlay gradien sinematik */}
      <div className="relative aspect-[16/9] max-h-[520px] w-full overflow-hidden sm:aspect-[21/9]">
        {movie.backdrop_url && !hasBackdropError ? (
          <img
            src={movie.backdrop_url}
            alt={`${movie.title} Backdrop`}
            onError={() => {
              if (movie.backdrop_url) {
                setFailedBackdropUrl(movie.backdrop_url);
              }
            }}
            className="h-full w-full object-cover object-center opacity-40 transition-transform duration-700 hover:scale-105"
          />
        ) : movie.poster_url ? (
          <div className="relative h-full w-full overflow-hidden bg-neutral-950">
            <img
              src={movie.poster_url}
              alt={`${movie.title} Backdrop Fallback`}
              className="h-full w-full scale-110 object-cover object-center opacity-30 blur-2xl transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          </div>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-neutral-900 to-neutral-950 opacity-60" />
        )}

        {/* Gradien Vercel-Dark multi-layer untuk kontras teks */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      </div>

      {/* Konten Hero Tumpang Tindih (Poster + Metadata + CTAs) */}
      <div className="relative mx-auto -mt-36 max-w-7xl px-4 pb-10 sm:-mt-48 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
          {/* Poster Portrait 2:3 */}
          <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl sm:w-48 md:w-56">
            {movie.poster_url ? (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-neutral-600">
                <Film className="h-10 w-10" />
              </div>
            )}

            {/* Age Rating Badge */}
            {movie.age_rating && (
              <div className="absolute left-2.5 top-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                {movie.age_rating}
              </div>
            )}
          </div>

          {/* Kolom Informasi & Aksi */}
          <div className="flex flex-1 flex-col justify-end space-y-4">
            {/* Judul Utama */}
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              {movie.title}
            </h1>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
              {movie.genre && (
                <span className="rounded-md border border-neutral-800 bg-neutral-900/90 px-2.5 py-1 font-medium">
                  {movie.genre}
                </span>
              )}
              {formatMovieDuration(movie.duration_minutes) && (
                <span className="flex items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900/90 px-2.5 py-1 font-medium">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  {formatMovieDuration(movie.duration_minutes)}
                </span>
              )}
              {movie.release_year && (
                <span className="rounded-md border border-neutral-800 bg-neutral-900/90 px-2.5 py-1 font-medium">
                  {movie.release_year}
                </span>
              )}
              {movie.age_rating && (
                <span className="rounded-md border border-neutral-800 bg-neutral-900/90 px-2.5 py-1 font-bold text-neutral-200">
                  {movie.age_rating}
                </span>
              )}
            </div>

            {/* Emergency Freeze Notice Banner */}
            {isVodFrozen && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 sm:text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Pemberitahuan:</strong> Penyewaan film digital sementara waktu
                  ditangguhkan oleh administrator.
                </span>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* CTA 1: Sewa / Nonton / Sewa Ulang */}
              {movie.access_model === 'free' ? (
                <button
                  type="button"
                  onClick={onWatchClick}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-700"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Tonton Gratis
                </button>
              ) : movie.access_status === 'active' ? (
                <button
                  type="button"
                  onClick={onWatchClick}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-700"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Nonton Sekarang
                </button>
              ) : movie.access_status === 'expired' ? (
                <button
                  type="button"
                  onClick={onOpenRentalModal}
                  disabled={isVodFrozen}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isVodFrozen
                      ? 'cursor-not-allowed bg-neutral-800 text-neutral-500'
                      : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                  )}
                >
                  <Play className="h-4 w-4 fill-white" />
                  Sewa Ulang ({rentalDurationHours} Jam) — {formattedPrice}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenRentalModal}
                  disabled={isVodFrozen}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isVodFrozen
                      ? 'cursor-not-allowed bg-neutral-800 text-neutral-500'
                      : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                  )}
                >
                  <Play className="h-4 w-4 fill-white" />
                  Sewa Film ({rentalDurationHours} Jam) — {formattedPrice}
                </button>
              )}

              {/* CTA 2: Tonton Trailer (jika ada uid trailer Cloudflare) */}
              {movie.cloudflare_trailer_uid && onOpenTrailerModal && (
                <button
                  type="button"
                  onClick={onOpenTrailerModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/80 px-5 py-3 text-sm font-semibold text-neutral-200 backdrop-blur transition-all hover:border-neutral-500 hover:bg-neutral-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <Film className="h-4 w-4 text-neutral-400" />
                  Tonton Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
