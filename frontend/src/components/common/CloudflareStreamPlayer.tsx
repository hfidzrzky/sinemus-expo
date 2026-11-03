import React, { useState } from 'react';
import { Play, AlertCircle, RefreshCw, Film } from 'lucide-react';

export interface CloudflareStreamPlayerProps {
  /** 32-karakter Cloudflare Stream UID */
  videoUid?: string | null;
  /** RS256 JWT Signed Token resmi (jika video berbayar / privat) */
  signedToken?: string | null;
  /** URL iframe lengkap (opsional, jika sudah disediakan backend) */
  iframeUrl?: string | null;
  /** Judul video untuk aksesibilitas dan header */
  title?: string;
  /** URL poster / thumbnail latar sebelum diputar (hanya aktif jika autoplay=false) */
  posterUrl?: string | null;
  /** Mulai putar otomatis saat komponen dibuka */
  autoplay?: boolean;
  /** Tampilkan kontrol playback bawaan */
  controls?: boolean;
  /** Class styling tambahan untuk container */
  className?: string;
  /** Apakah video berstatus privat / berbayar */
  isPrivate?: boolean;
}

export const CloudflareStreamPlayer: React.FC<CloudflareStreamPlayerProps> = ({
  videoUid,
  signedToken,
  iframeUrl,
  title = 'Video Stream',
  posterUrl,
  autoplay = true,
  controls = true,
  className = '',
  isPrivate = false,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(autoplay);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Tentukan URL pemutaran target (Prioritas: iframeUrl -> signedToken -> raw videoUid)
  const resolveTargetUrl = (): string | null => {
    const rawUrl =
      iframeUrl ||
      (() => {
        const tokenOrUid = signedToken || videoUid;
        if (!tokenOrUid) return null;
        const clean = tokenOrUid.trim();
        if (!clean) return null;
        return `https://iframe.videodelivery.net/${clean}`;
      })();

    if (!rawUrl) return null;

    try {
      const url = new URL(rawUrl);
      if (autoplay || isPlaying) {
        url.searchParams.set('autoplay', 'true');
      }
      if (controls) {
        url.searchParams.set('controls', 'true');
      }
      return url.toString();
    } catch {
      const sep = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${sep}autoplay=true&controls=true`;
    }
  };

  const targetUrl = resolveTargetUrl();

  const handleRetry = () => {
    setHasError(false);
    setIsIframeLoaded(false);
    setIsPlaying(true);
  };

  // State: Video belum tersedia
  if (!targetUrl && !videoUid && !signedToken) {
    return (
      <div
        className={`flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/90 p-6 text-center ${className}`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-neutral-500">
          <Film className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-neutral-300">Video Belum Tersedia</p>
        <p className="mt-1 text-xs text-neutral-500">
          Materi video sedang diproses oleh kurator atau belum diunggah ke katalog.
        </p>
      </div>
    );
  }

  // State: Error saat memuat
  if (hasError) {
    return (
      <div
        className={`flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-red-900/30 bg-neutral-950 p-6 text-center ${className}`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-red-800/40 bg-red-950/50 text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-white">Gagal Memuat Video</p>
        <p className="mt-1 max-w-sm text-xs text-neutral-400">
          {isPrivate
            ? 'Izin akses pemutaran video tidak valid atau masa berlaku sesi streaming telah berakhir.'
            : 'Terjadi kendala jaringan saat menghubungkan ke CDN Cloudflare Stream.'}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-neutral-700 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Coba Muat Ulang</span>
        </button>
      </div>
    );
  }

  const shouldRenderPlayer = autoplay || isPlaying;

  return (
    <div
      className={`group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black ${className}`}
    >
      {/* Play button overlay jika autoplay dimatikan dan belum di-play */}
      {!shouldRenderPlayer && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 transition-opacity">
          {posterUrl && (
            <img
              src={posterUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="z-10 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/40 transition-all hover:scale-110 hover:bg-blue-500 active:scale-95"
            aria-label={`Putar ${title}`}
          >
            <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />
          </button>
        </div>
      )}

      {/* Frame Pemutar Cloudflare Stream */}
      {shouldRenderPlayer && targetUrl && (
        <>
          {/* Skeleton Spinner saat iframe mengunduh manifest pertama */}
          {!isIframeLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950">
              <div className="flex flex-col items-center gap-2.5">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="font-mono text-[11px] text-neutral-400">
                  Memuat Pemutar Video...
                </span>
              </div>
            </div>
          )}

          <iframe
            src={targetUrl}
            className="h-full w-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            title={title}
            onLoad={() => setIsIframeLoaded(true)}
            onError={() => setHasError(true)}
          />
        </>
      )}
    </div>
  );
};
