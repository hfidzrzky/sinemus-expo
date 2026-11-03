import { useEffect, useRef, useState, useCallback } from 'react';
import shaka from 'shaka-player';
import type { ResolutionTrack } from '../types';

export interface UseShakaPlayerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  manifestUrl?: string | null;
  videoUid?: string | null;
  signedToken?: string | null;
  autoplay?: boolean;
  onError?: (error: Error) => void;
}

export function useShakaPlayer({
  videoRef,
  manifestUrl,
  videoUid,
  signedToken,
  autoplay = true,
  onError,
}: UseShakaPlayerOptions) {
  const playerRef = useRef<shaka.Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tracks, setTracks] = useState<ResolutionTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | 'auto'>('auto');

  // Resolusi sumber manifest HLS Cloudflare Stream
  const resolveManifestUrl = useCallback((): string | null => {
    // 1. Jika ada signed token resmi dari backend, ini prioritas nomor 1
    if (signedToken && signedToken.trim()) {
      return `https://videodelivery.net/${signedToken.trim()}/manifest/video.m3u8`;
    }

    // 2. Jika manifestUrl sudah disediakan langsung
    if (manifestUrl && manifestUrl.trim()) {
      return manifestUrl.trim();
    }

    // 3. Fallback ke raw video UID jika tidak memerlukan token
    if (videoUid && videoUid.trim()) {
      return `https://videodelivery.net/${videoUid.trim()}/manifest/video.m3u8`;
    }

    return null;
  }, [manifestUrl, videoUid, signedToken]);

  // Update daftar track resolusi dari Shaka Player
  const updateTracks = useCallback((player: shaka.Player) => {
    try {
      const variantTracks = player.getVariantTracks();
      const uniqueHeights = new Map<number, shaka.extern.Track>();

      for (const t of variantTracks) {
        if (
          t.height &&
          (!uniqueHeights.has(t.height) ||
            (t.bandwidth || 0) > (uniqueHeights.get(t.height)?.bandwidth || 0))
        ) {
          uniqueHeights.set(t.height, t);
        }
      }

      const formatted: ResolutionTrack[] = Array.from(uniqueHeights.values())
        .sort((a, b) => (b.height || 0) - (a.height || 0))
        .map((t) => ({
          id: t.id,
          height: t.height || 0,
          width: t.width || 0,
          bandwidth: t.bandwidth || 0,
          label: `${t.height}p`,
          active: t.active,
        }));

      setTracks(formatted);
    } catch {
      // Ignore track extraction errors silently
    }
  }, []);

  // Ubah resolusi video (manual atau ABR Auto)
  const changeResolution = useCallback(
    (trackId: number | 'auto') => {
      const player = playerRef.current;
      if (!player) return;

      if (trackId === 'auto') {
        player.configure({ abr: { enabled: true } });
        setSelectedTrackId('auto');
      } else {
        player.configure({ abr: { enabled: false } });
        const allTracks = player.getVariantTracks();
        const selected = allTracks.find((t: shaka.extern.Track) => t.id === trackId);
        if (selected) {
          player.selectVariantTrack(selected, true);
          setSelectedTrackId(trackId);
        }
      }
      updateTracks(player);
    },
    [updateTracks]
  );

  useEffect(() => {
    let isCancelled = false;

    // 1. Install polyfill Shaka Player untuk kompatibilitas MSE & EME
    shaka.polyfill.installAll();

    const videoElement = videoRef.current;
    if (!videoElement) return;

    const player = new shaka.Player();
    playerRef.current = player;

    // 2. Konfigurasi performa streaming, ABR, dan toleransi retry
    player.configure({
      streaming: {
        bufferingGoal: 30,
        rebufferingGoal: 2,
        bufferBehind: 15,
        retryParameters: {
          maxAttempts: 3,
          baseDelay: 1000,
          backoffFactor: 2,
          fuzzFactor: 0.5,
          timeout: 10000,
        },
      },
      abr: {
        enabled: true,
      },
    });

    const onBuffering = (event: Event) => {
      const isBuf = Boolean((event as unknown as { buffering?: boolean }).buffering);
      setIsBuffering(isBuf);
    };

    const onAdaptation = () => {
      updateTracks(player);
    };

    const onTracksChanged = () => {
      updateTracks(player);
    };

    const onPlayerError = (event: Event) => {
      const shakaErr = (event as unknown as { detail?: { code?: number; message?: string } })
        ?.detail;
      console.error('[SinemusCinemaPlayer] Shaka runtime event error:', shakaErr);
      const err = new Error(shakaErr?.message || 'Terjadi kendala pemutaran streaming');
      setErrorMessage(err.message);
      onError?.(err);
    };

    player.addEventListener('buffering', onBuffering);
    player.addEventListener('adaptation', onAdaptation);
    player.addEventListener('trackschanged', onTracksChanged);
    player.addEventListener('error', onPlayerError);

    // 3. Asynchronous Initialization: WAJIB await player.attach SEBELUM player.load
    async function initAndLoadPlayer() {
      try {
        if (!shaka.Player.isBrowserSupported()) {
          throw new Error('Browser tidak mendukung HTML5 Shaka Player streaming');
        }

        const activeVideo = videoRef.current;
        if (!activeVideo) return;

        await player.attach(activeVideo);
        if (isCancelled) return;

        const targetUrl = resolveManifestUrl();
        console.log('[SinemusCinemaPlayer] Successfully attached. Loading manifest:', targetUrl);

        if (!targetUrl) {
          throw new Error('URL manifest video tidak ditemukan');
        }

        await player.load(targetUrl);
        if (isCancelled) return;

        setIsReady(true);
        setErrorMessage(null);
        updateTracks(player);

        if (autoplay) {
          try {
            await activeVideo.play();
          } catch {
            // Autoplay policy fallback: mulai dalam kondisi bisu jika audio dicegah
            activeVideo.muted = true;
            await activeVideo.play().catch(() => {});
          }
        }
      } catch (error: unknown) {
        if (isCancelled) return;
        console.error('[SinemusCinemaPlayer] Player initialization/load error:', error);

        const shakaErr = error as { code?: number; category?: number; message?: string };
        const displayMsg =
          shakaErr?.message ||
          (error instanceof Error ? error.message : 'Gagal memuat manifest video Cloudflare');

        setErrorMessage(displayMsg);
        onError?.(error instanceof Error ? error : new Error(displayMsg));
      }
    }

    initAndLoadPlayer();

    return () => {
      isCancelled = true;
      player.removeEventListener('buffering', onBuffering);
      player.removeEventListener('adaptation', onAdaptation);
      player.removeEventListener('trackschanged', onTracksChanged);
      player.removeEventListener('error', onPlayerError);
      player.destroy().catch(() => {});
      playerRef.current = null;
    };
  }, [videoRef, resolveManifestUrl, autoplay, onError, updateTracks]);

  return {
    isReady,
    isBuffering,
    errorMessage,
    tracks,
    selectedTrackId,
    changeResolution,
  };
}
