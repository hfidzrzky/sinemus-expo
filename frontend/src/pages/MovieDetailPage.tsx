import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/features/auth';
import {
  useMovieDetailQuery,
  MovieHeroBanner,
  MovieHighlightsSection,
  MovieCastCrewSection,
  MovieRentalModal,
} from '@/features/movies';

export interface MovieDetailPageProps {
  slug: string;
  onNavigate?: (path: string) => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ slug, onNavigate }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { data: movie, isLoading, isError, error, refetch } = useMovieDetailQuery(slug);

  const [isRentalModalOpen, setIsRentalModalOpen] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Auto-forward ke rute sinema pemutar (/watch/:slug) jika URL membawa query `?watch=true`
  useEffect(() => {
    const isWatchQueryParam =
      typeof window !== 'undefined' && window.location.search.includes('watch=true');
    if (isWatchQueryParam && movie?.slug) {
      onNavigate?.(`/watch/${movie.slug}`);
    }
  }, [movie?.slug, onNavigate]);

  const handleWatchClick = () => {
    if (!isAuthenticated && movie?.access_model !== 'free') {
      openAuthModal();
      return;
    }
    if (movie?.slug) {
      onNavigate?.(`/watch/${movie.slug}`);
    }
  };

  const handleTrailerClick = () => {
    if (movie?.slug) {
      onNavigate?.(`/watch/${movie.slug}?mode=trailer`);
    }
  };

  // 1. Loading Skeleton State (Sinkron 1:1 dengan Tata Letak Hero Banner Proporsional Sinemus, Sinopsis, Looks Film, dan Aktor & Kru)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Backdrop Skeleton dengan Edge Vignettes */}
        <div className="relative h-[70vh] max-h-[820px] min-h-[560px] w-full animate-pulse overflow-hidden bg-neutral-900/60 sm:h-[75vh] lg:h-[80vh] xl:max-h-[880px]">
          {/* Edge Vignette Overlays */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black via-black/80 to-transparent sm:w-3/4 md:w-3/5 lg:w-1/2" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black via-black/60 to-transparent sm:h-32" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black via-black/85 to-transparent sm:h-52" />

          {/* Hero Content Skeleton (Poster di Kiri, Judul/Metadata/Tombol di Kanan di Tengah Vertikal) */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end px-4 pb-5 sm:px-8 sm:pb-8 lg:px-12 lg:pb-10 xl:px-16">
            <div className="flex max-w-4xl flex-row items-center gap-3.5 sm:gap-5 md:gap-6 lg:gap-8">
              {/* Poster Skeleton */}
              <div className="aspect-[2/3] w-24 shrink-0 animate-pulse rounded-lg border border-white/5 bg-neutral-800/80 shadow-2xl sm:w-36 sm:rounded-xl md:w-40 lg:w-44 xl:w-48" />

              {/* Konten Kanan Skeleton */}
              <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2 lg:space-y-2.5">
                {/* Judul Skeleton */}
                <div className="h-5 w-3/4 max-w-xs animate-pulse rounded-lg bg-neutral-800/80 sm:h-6 md:h-7 lg:h-8" />

                {/* Metadata Pills Skeleton */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5 sm:gap-1.5">
                  <div className="h-4 w-14 animate-pulse rounded-md bg-neutral-800/80 sm:h-5 sm:w-16" />
                  <div className="h-4 w-16 animate-pulse rounded-md bg-neutral-800/80 sm:h-5 sm:w-20" />
                  <div className="h-4 w-12 animate-pulse rounded-md bg-neutral-800/80 sm:h-5 sm:w-14" />
                  <div className="h-4 w-10 animate-pulse rounded-md bg-neutral-800/80 sm:h-5 sm:w-12" />
                </div>

                {/* Tombol Aksi Skeleton */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5 sm:gap-2.5">
                  <div className="h-7 w-28 animate-pulse rounded-lg border border-blue-800/30 bg-blue-900/40 sm:h-8 sm:w-32 sm:rounded-xl" />
                  <div className="h-7 w-16 animate-pulse rounded-lg border border-white/10 bg-white/10 sm:h-8 sm:w-20 sm:rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sinopsis Skeleton Below Banner */}
        <div className="w-full px-4 pt-6 sm:px-8 sm:pt-8 lg:px-12 xl:px-16">
          <div className="max-w-3xl space-y-2 border-b border-neutral-800/80 pb-6 sm:pb-8">
            <div className="h-3.5 w-20 animate-pulse rounded bg-neutral-800/60" />
            <div className="h-4 w-full animate-pulse rounded bg-neutral-800/60" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-800/60" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800/60" />
          </div>
        </div>

        {/* Content Below Skeleton (Looks Film & Aktor & Kru) */}
        <div className="relative z-10 w-full space-y-12 bg-black px-4 pb-16 pt-6 sm:px-8 sm:pt-8 lg:px-12 xl:px-16">
          <div className="space-y-4">
            <div className="h-6 w-28 animate-pulse rounded-md bg-neutral-800/80" />
            <div className="w-48 space-y-2 sm:w-56 md:w-64">
              <div className="aspect-[16/9] w-full animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/70" />
              <div className="h-3.5 w-28 animate-pulse rounded bg-neutral-800/60" />
              <div className="h-2.5 w-36 animate-pulse rounded bg-neutral-800/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error / 404 Not Found State
  if (isError || !movie) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-red-400 shadow-xl">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Film Tidak Ditemukan
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-neutral-400 sm:text-sm">
          {error instanceof Error
            ? error.message
            : 'Film yang Anda cari tidak tersedia, belum dipublikasikan, atau URL tautan salah.'}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-700 sm:text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('/movies')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Katalog Film
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Visual Hero Banner Sinemus dengan Metadata & CTAs */}
      <MovieHeroBanner
        movie={movie}
        onOpenRentalModal={() => setIsRentalModalOpen(true)}
        onTrailerClick={handleTrailerClick}
        onWatchClick={handleWatchClick}
      />

      {/* Main Content Layout */}
      <div className="relative z-10 w-full space-y-12 bg-black px-4 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-12 xl:px-16">
        <div className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-black via-black/85 to-transparent sm:-top-20 sm:h-20" />

        {/* Seksi 1: Looks Film (Galeri Foto Adegan — Pure Images) */}
        <MovieHighlightsSection
          movie={movie}
          onSelectImage={(imageUrl) => setPreviewImage(imageUrl)}
        />

        {/* Seksi 2: Aktor & Kru (Pemeran Film) */}
        <MovieCastCrewSection movie={movie} />
      </div>

      {/* Pop-up Modal Sewa Film (Midtrans Snap Checkout) */}
      <MovieRentalModal
        isOpen={isRentalModalOpen}
        onClose={() => setIsRentalModalOpen(false)}
        movie={movie}
        onRentalSuccess={(_orderId) => {
          setIsRentalModalOpen(false);
          refetch();
          if (movie.slug) {
            onNavigate?.(`/watch/${movie.slug}`);
          }
        }}
      />

      {/* Lightbox Look Film Preview Modal */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 p-2 text-white backdrop-blur-md transition hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImage}
              alt="Preview Look Film"
              className="max-h-[85vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetailPage;
