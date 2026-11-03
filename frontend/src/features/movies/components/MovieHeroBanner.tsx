import React, { useState } from 'react';
import { Play, AlertTriangle, Clock, Film } from 'lucide-react';
import { usePublicSettingsQuery } from '@/features/admin';
import { cn } from '@/lib/utils';
import { formatMovieDuration } from '../utils/formatters';
import type { MovieDetail } from '../types';

export interface MovieHeroBannerProps {
  movie: MovieDetail;
  onOpenRentalModal: () => void;
  onTrailerClick?: () => void;
  onOpenTrailerModal?: () => void;
  onWatchClick?: () => void;
  className?: string;
}

export const MovieHeroBanner: React.FC<MovieHeroBannerProps> = ({
  movie,
  onOpenRentalModal,
  onTrailerClick,
  onOpenTrailerModal,
  onWatchClick,
  className = '',
}) => {
  const { data: publicSettings } = usePublicSettingsQuery();
  const [failedBackdropUrl, setFailedBackdropUrl] = useState<string | null>(null);

  // Derived state: fallback ke poster_url jika backdrop_url gagal dimuat
  const hasBackdropError = Boolean(movie.backdrop_url && failedBackdropUrl === movie.backdrop_url);
  const heroImage = (!hasBackdropError && movie.backdrop_url) || movie.poster_url;

  // 1. Emergency Freeze VoD Guard
  const isVodFrozen = Boolean(publicSettings?.emergency_controls?.freeze_vod_rentals);

  // 2. Format harga sewa sesuai standar Sinemus
  const formattedPrice =
    movie.formatted_price ||
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(movie.price);

  const handleTrailer = onTrailerClick || onOpenTrailerModal;

  return (
    <div className={cn('relative w-full bg-black text-white', className)}>
      {/* 1. Hero Landscape Frame (Rasio Sinematik Terbingkai & Proporsional — Lebih Luas & Megah) */}
      <div className="relative h-[70vh] max-h-[820px] min-h-[560px] w-full overflow-hidden bg-neutral-950 sm:h-[75vh] lg:h-[80vh] xl:max-h-[880px]">
        {heroImage ? (
          <img
            src={heroImage}
            alt={`${movie.title} Backdrop`}
            onError={() => {
              if (movie.backdrop_url) {
                setFailedBackdropUrl(movie.backdrop_url);
              }
            }}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-black opacity-80" />
        )}

        {/* Gradien Atas (Integrasi Navbar Transparan) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/85 via-black/35 to-transparent sm:h-32" />

        {/* Gradien Kiri Sinematik Terarah (Melindungi teks judul & aksi tanpa menutupi visual tengah/kanan) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-full bg-gradient-to-r from-black/95 via-black/60 to-transparent sm:w-3/4 md:w-3/5 lg:w-1/2" />

        {/* Gradien Bawah Lembut (Transisi Menyatu dengan Konten Sinopsis) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-black via-black/75 to-transparent sm:h-52" />

        {/* Ambient Overlay Halus */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-black/10" />

        {/* Hero Detail Content — Poster di kiri, Judul + Badges + Button berada di tengah vertikal poster */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end px-4 pb-5 sm:px-8 sm:pb-8 lg:px-12 lg:pb-10 xl:px-16">
          <div className="flex max-w-4xl flex-row items-center gap-3.5 sm:gap-5 md:gap-6 lg:gap-8">
            {/* Poster Film (Sisi Kiri) */}
            {movie.poster_url ? (
              <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-neutral-900 shadow-2xl sm:w-36 sm:rounded-xl md:w-40 lg:w-44 xl:w-48">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="relative flex aspect-[2/3] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-2xl sm:w-36 sm:rounded-xl md:w-40 lg:w-44 xl:w-48">
                <Film className="h-8 w-8 text-neutral-600" />
              </div>
            )}

            {/* Konten Kanan: Judul, Badges, Harga & Tombol Aksi (Tengah Vertikal Poster) */}
            <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2 lg:space-y-2.5">
              {/* Judul Film (Ukuran disesuaikan lebih pas & proporsional) */}
              <h1 className="line-clamp-2 font-display text-base font-extrabold tracking-tight text-white drop-shadow-md sm:text-xl md:text-2xl lg:text-3xl">
                {movie.title}
              </h1>

              {/* Baris Metadata Badges (Genre, Durasi, Tahun, Usia Sensor) */}
              <div className="flex flex-wrap items-center gap-1 text-[10px] text-neutral-300 sm:gap-1.5 sm:text-[11px]">
                {/* Genre */}
                {movie.genre && (
                  <span className="rounded-md border border-neutral-800 bg-neutral-900/90 px-2 py-0.5 font-medium shadow-sm backdrop-blur-sm">
                    {movie.genre}
                  </span>
                )}

                {/* Durasi */}
                {formatMovieDuration(movie.duration_minutes) && (
                  <span className="flex items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900/90 px-2 py-0.5 font-medium shadow-sm backdrop-blur-sm">
                    <Clock className="h-3 w-3 text-neutral-400 sm:h-3.5 sm:w-3.5" />
                    {formatMovieDuration(movie.duration_minutes)}
                  </span>
                )}

                {/* Tahun Rilis */}
                {movie.release_year && (
                  <span className="rounded-md border border-neutral-800 bg-neutral-900/90 px-2 py-0.5 font-medium shadow-sm backdrop-blur-sm">
                    {movie.release_year}
                  </span>
                )}

                {/* Klasifikasi Usia */}
                {movie.age_rating && (
                  <span className="rounded-md border border-neutral-800 bg-neutral-900/90 px-2 py-0.5 font-bold text-neutral-200 shadow-sm backdrop-blur-sm">
                    {movie.age_rating}
                  </span>
                )}
              </div>

              {/* Penempatan Harga di Bawah Badge Drama/Genre (Hanya tampil jika user BELUM membeli & mendukung harga coret) */}
              {movie.access_model !== 'free' && movie.access_status !== 'active' && (
                <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5">
                  <span className="font-display text-sm font-bold tracking-tight text-white drop-shadow-md sm:text-base md:text-lg">
                    {formattedPrice}
                  </span>

                  {/* Dukungan diskon harga coret jika ada diskon / original_price */}
                  {Boolean(movie.original_price && movie.original_price > movie.price) && (
                    <span className="text-[11px] font-semibold text-neutral-500 line-through sm:text-xs">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(movie.original_price!)}
                    </span>
                  )}
                </div>
              )}

              {/* Baris Tombol Aksi (Tombol Biru Sinemus Bersih & Tombol Trailer Serasi) */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5 sm:gap-2.5">
                {movie.access_status === 'active' ? (
                  <button
                    type="button"
                    onClick={onWatchClick}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-700 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs md:text-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-white sm:h-4 sm:w-4" />
                    <span>Nonton Sekarang</span>
                  </button>
                ) : movie.access_status === 'expired' ? (
                  <button
                    type="button"
                    onClick={onOpenRentalModal}
                    disabled={isVodFrozen}
                    className={cn(
                      'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs md:text-sm',
                      isVodFrozen
                        ? 'cursor-not-allowed bg-neutral-800 text-neutral-500'
                        : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                    )}
                  >
                    <Play className="h-3.5 w-3.5 fill-white sm:h-4 sm:w-4" />
                    <span>Sewa Ulang Film</span>
                  </button>
                ) : movie.access_model === 'free' ? (
                  <button
                    type="button"
                    onClick={onWatchClick}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-700 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs md:text-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-white sm:h-4 sm:w-4" />
                    <span>Tonton Gratis</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenRentalModal}
                    disabled={isVodFrozen}
                    className={cn(
                      'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs md:text-sm',
                      isVodFrozen
                        ? 'cursor-not-allowed bg-neutral-800 text-neutral-500'
                        : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                    )}
                  >
                    <Play className="h-3.5 w-3.5 fill-white sm:h-4 sm:w-4" />
                    <span>Sewa Film Sekarang</span>
                  </button>
                )}

                {/* Button Trailer */}
                {movie.cloudflare_trailer_uid && handleTrailer && (
                  <button
                    type="button"
                    onClick={handleTrailer}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 active:scale-[0.98] sm:rounded-xl sm:px-3.5 sm:py-2 sm:text-xs md:text-sm"
                  >
                    <Film className="h-3.5 w-3.5 text-white/90 sm:h-4 sm:w-4" />
                    <span>Trailer</span>
                  </button>
                )}
              </div>

              {/* Emergency Freeze Notice Banner */}
              {isVodFrozen && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300 sm:p-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Pemberitahuan:</strong> Penyewaan film digital sementara waktu
                    ditangguhkan oleh administrator.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sinopsis Section — Diletakkan langsung di bawah transisi banner dengan estetika rapi & nyaman dibaca */}
      <div className="relative z-20 w-full px-4 pt-6 sm:px-8 sm:pt-8 lg:px-12 xl:px-16">
        <div className="max-w-3xl space-y-2 border-b border-neutral-800/80 pb-6 sm:pb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Sinopsis
          </h2>
          <p className="whitespace-pre-line text-xs leading-relaxed text-neutral-300 drop-shadow-sm sm:text-sm md:text-base">
            {movie.synopsis || 'Sinopsis belum tersedia untuk film ini.'}
          </p>
        </div>
      </div>
    </div>
  );
};
