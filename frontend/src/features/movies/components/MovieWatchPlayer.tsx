import React, { useState } from 'react';
import { AlertCircle, Loader2, Lock, RefreshCw, RotateCcw, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { SinemusCinemaPlayer } from '@/components/common';
import { cn } from '@/lib/utils';
import { useMovieStreamQuery } from '../api/useMovieStreamQuery';
import { useMovieRentalCountdown } from '../hooks/useMovieRentalCountdown';
import type { MovieDetail } from '../types';

export interface MovieWatchPlayerProps {
  movie: MovieDetail;
  onBack?: () => void;
  onReRentClick?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export const MovieWatchPlayer: React.FC<MovieWatchPlayerProps> = ({
  movie,
  onBack,
  onReRentClick,
  className = '',
  autoPlay = true,
}) => {
  const { currentUser } = useAuth();
  const [isManuallyExpired, setIsManuallyExpired] = useState<boolean>(false);

  const isFreeAccess = movie.access_model === 'free';

  // 1. Ambil Token Sesi Streaming & Manifest HLS dari Backend
  const {
    data: streamData,
    isLoading: isStreamLoading,
    error: streamError,
    refetch: refetchStream,
  } = useMovieStreamQuery(movie.id, !isManuallyExpired);

  // 2. Countdown Sisa Waktu Sewa (SSOT Server Time)
  const effectiveExpiresAt = streamData?.rental_expires_at || movie.rental_expires_at;

  const {
    formattedTime,
    isExpired: isCountdownExpired,
    isWarning,
    isCritical,
  } = useMovieRentalCountdown({
    rentalExpiresAt: effectiveExpiresAt,
    serverTime: streamData?.server_time,
    isFreeAccess: isFreeAccess,
    onExpire: () => {
      if (!isFreeAccess) {
        setIsManuallyExpired(true);
      }
    },
  });

  // HANYA expired jika:
  // - Bukan film gratis
  // - Loading stream selesai
  // - Masa sewa efektif memang ada dan telah berakhir
  const hasRentalExpired =
    !isFreeAccess &&
    !isStreamLoading &&
    Boolean(effectiveExpiresAt) &&
    (isManuallyExpired || isCountdownExpired);

  const watermarkText =
    currentUser?.email || (currentUser?.id ? `USER-${currentUser.id}` : 'SINEMUS-SECURE-STREAM');

  const countdownBadge = !isFreeAccess ? (
    <span
      className={cn(
        'select-none font-mono text-xs font-semibold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]',
        isCritical
          ? 'animate-pulse text-red-400'
          : isWarning
            ? 'text-amber-400'
            : 'text-neutral-200'
      )}
    >
      Sisa Sewa: {formattedTime}
    </span>
  ) : isFreeAccess ? (
    <span className="select-none rounded-md bg-blue-600/80 px-2.5 py-1 font-sans text-xs font-semibold tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
      Akses Gratis
    </span>
  ) : null;

  return (
    <div
      className={cn(
        'group relative w-full select-none overflow-hidden bg-black',
        className.includes('h-') ? '' : 'aspect-video rounded-2xl shadow-2xl',
        className
      )}
    >
      {/* 1. STATE: MASA SEWA HABIS (EXPIRED OVERLAY) */}
      {hasRentalExpired ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 p-6 text-center backdrop-blur">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-white sm:text-2xl">
            Masa Sewa Film Telah Berakhir
          </h3>
          <p className="mt-2 max-w-md text-xs text-neutral-400 sm:text-sm">
            Masa sewa untuk film <strong>{movie.title}</strong> telah habis. Anda dapat menyewa
            ulang untuk melanjutkan menonton.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {onReRentClick && (
              <button
                type="button"
                onClick={onReRentClick}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 sm:text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Sewa Ulang Film
              </button>
            )}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800 hover:text-white sm:text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Detail Film
              </button>
            )}
          </div>
        </div>
      ) : isStreamLoading ? (
        /* 2. STATE: MEMUAT STREAM SESSION */
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="mt-4 font-display text-sm font-semibold text-white sm:text-base">
            Menyiapkan Sesi Streaming Terenkripsi...
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {isFreeAccess
              ? 'Menyiapkan sesi pemutaran gratis & kunci dekripsi Cloudflare Stream'
              : 'Memverifikasi hak sewa & kunci dekripsi Cloudflare Stream'}
          </p>
        </div>
      ) : streamError || (!streamData?.playback_url && !streamData?.preview_iframe_url) ? (
        /* 3. STATE: ERROR AKSES STREAM */
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <h4 className="mt-3 font-display text-base font-bold text-white sm:text-lg">
            Gagal Memuat Video
          </h4>
          <p className="mt-1 max-w-md text-xs text-neutral-400 sm:text-sm">
            {streamError instanceof Error
              ? streamError.message
              : 'Tidak dapat menerbitkan token pemutaran film. Periksa hak sewa atau koneksi internet Anda.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {onReRentClick &&
              streamError instanceof Error &&
              (streamError.message.toLowerCase().includes('sewa') ||
                streamError.message.toLowerCase().includes('berakhir')) && (
                <button
                  type="button"
                  onClick={onReRentClick}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Sewa Film Sekarang
                </button>
              )}
            <button
              type="button"
              onClick={() => refetchStream()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Coba Lagi
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Kembali
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 4. STATE: CINEMA VIDEO PLAYER AKTIF (SHAKA PLAYER ENGINE) */
        <SinemusCinemaPlayer
          manifestUrl={streamData.playback_url}
          videoUid={movie.cloudflare_video_uid}
          signedToken={streamData.signed_token}
          title={movie.title}
          autoplay={autoPlay}
          onBack={onBack}
          isVoD={true}
          watermarkText={watermarkText}
          topRightBadge={countdownBadge}
          className="h-full w-full"
        />
      )}
    </div>
  );
};
