import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, RefreshCw, Lock, Play } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useMovieDetailQuery, MovieWatchPlayer, MovieRentalModal } from '@/features/movies';
import { SinemusCinemaPlayer } from '@/components/common';

export interface WatchPageProps {
  slug: string;
  onNavigate?: (path: string) => void;
}

export const WatchPage: React.FC<WatchPageProps> = ({ slug, onNavigate }) => {
  const { isAuthenticated, openAuthModal, currentUser } = useAuth();
  const { data: movie, isLoading, isError, error, refetch } = useMovieDetailQuery(slug);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState<boolean>(false);

  const isTrailerMode =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('mode') === 'trailer' ||
      new URLSearchParams(window.location.search).get('trailer') === 'true');

  const isFreeAccess = movie?.access_model === 'free';
  const hasAccess = isFreeAccess || movie?.access_status === 'active';

  // 1. Loading State (Cinematic Intermission)
  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-6 text-center text-white">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <h2 className="mt-4 font-display text-lg font-bold sm:text-xl">
          Menyiapkan Ruang Putar Sinema...
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          Memuat metadata film dan memverifikasi sertifikat enkripsi streaming
        </p>
      </div>
    );
  }

  // 2. Error / Not Found State
  if (isError || !movie) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-6 text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-red-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-6 font-display text-xl font-bold tracking-tight sm:text-2xl">
          Film Tidak Ditemukan
        </h2>
        <p className="mt-2 max-w-md text-xs text-neutral-400 sm:text-sm">
          {error instanceof Error ? error.message : 'Film yang Anda tuju tidak tersedia.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-700"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('/movies')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Katalog
          </button>
        </div>
      </div>
    );
  }

  // 3. Trailer Mode (Public Preview via Shaka Player Engine)
  if (isTrailerMode) {
    if (!movie.cloudflare_trailer_uid) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-6 text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-amber-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-6 font-display text-xl font-bold tracking-tight sm:text-2xl">
            Trailer Belum Tersedia
          </h2>
          <p className="mt-2 max-w-md text-xs text-neutral-400 sm:text-sm">
            Trailer resmi untuk film <strong>{movie.title}</strong> belum diunggah oleh studio.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.(`/film/${movie.slug}`)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Detail Film
            </button>
          </div>
        </div>
      );
    }

    const trailerTopRightBadge = hasAccess ? (
      <button
        type="button"
        onClick={() => onNavigate?.(`/watch/${movie.slug}`)}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-blue-500 active:bg-blue-700"
      >
        <Play className="h-3.5 w-3.5 fill-white" />
        <span>{isFreeAccess ? 'Tonton Film Gratis' : 'Tonton Film Penuh'}</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            openAuthModal();
          } else {
            setIsRentalModalOpen(true);
          }
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-blue-500 active:bg-blue-700"
      >
        <Play className="h-3.5 w-3.5 fill-white" />
        <span>Sewa Film Penuh</span>
      </button>
    );

    return (
      <div className="relative h-screen min-h-[100dvh] w-full overflow-hidden bg-black">
        <SinemusCinemaPlayer
          manifestUrl={`https://videodelivery.net/${encodeURIComponent(movie.cloudflare_trailer_uid)}/manifest/video.m3u8`}
          videoUid={movie.cloudflare_trailer_uid}
          title={`Trailer: ${movie.title}`}
          autoplay={true}
          onBack={() => onNavigate?.(`/film/${movie.slug}`)}
          isVoD={true}
          watermarkText={currentUser?.email || 'SINEMUS-TRAILER'}
          topRightBadge={trailerTopRightBadge}
          className="h-full w-full"
        />

        <MovieRentalModal
          isOpen={isRentalModalOpen}
          onClose={() => setIsRentalModalOpen(false)}
          movie={movie}
          onRentalSuccess={() => {
            setIsRentalModalOpen(false);
            refetch();
            onNavigate?.(`/watch/${movie.slug}`);
          }}
        />
      </div>
    );
  }

  // 4. Unauthenticated State (Prompt Login - Wajib Masuk Google untuk Memutar Film Penuh)
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-6 text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-blue-400">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="mt-6 font-display text-xl font-bold tracking-tight sm:text-2xl">
          Masuk untuk Menonton
        </h2>
        <p className="mt-2 max-w-md text-xs text-neutral-400 sm:text-sm">
          Silakan masuk dengan akun Google Anda untuk mengakses pemutaran film{' '}
          <strong>{movie.title}</strong>.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={openAuthModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            Masuk dengan Google
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.(`/film/${movie.slug}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Detail Film
          </button>
        </div>
      </div>
    );
  }

  // 4. No Access / Expired State (Prompt Rental)
  if (!hasAccess) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-6 text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-amber-400">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="mt-6 font-display text-xl font-bold tracking-tight sm:text-2xl">
          {movie.access_status === 'expired'
            ? 'Masa Sewa Film Telah Berakhir'
            : 'Akses Nonton Belum Aktif'}
        </h2>
        <p className="mt-2 max-w-md text-xs text-neutral-400 sm:text-sm">
          {movie.access_status === 'expired'
            ? `Masa sewa untuk film ${movie.title} telah habis. Anda dapat menyewa ulang untuk melanjutkan menonton.`
            : `Anda belum menyewa film ${movie.title}. Sewa sekarang untuk mendapatkan akses streaming 48 jam.`}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsRentalModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            {movie.access_status === 'expired' ? 'Sewa Ulang Film' : 'Sewa Film Sekarang'}
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Periksa Ulang Status
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.(`/film/${movie.slug}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Detail Film
          </button>
        </div>

        <MovieRentalModal
          isOpen={isRentalModalOpen}
          onClose={() => setIsRentalModalOpen(false)}
          movie={movie}
          onRentalSuccess={() => {
            setIsRentalModalOpen(false);
            refetch();
          }}
        />
      </div>
    );
  }

  // 5. Active Cinema Mode (Full Viewport Theater Experience)
  return (
    <div className="relative h-screen min-h-[100dvh] w-full overflow-hidden bg-black">
      <MovieWatchPlayer
        movie={movie}
        autoPlay={true}
        onBack={() => onNavigate?.(`/film/${movie.slug}`)}
        onReRentClick={() => setIsRentalModalOpen(true)}
        className="h-full w-full"
      />

      <MovieRentalModal
        isOpen={isRentalModalOpen}
        onClose={() => setIsRentalModalOpen(false)}
        movie={movie}
        onRentalSuccess={() => {
          setIsRentalModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default WatchPage;
