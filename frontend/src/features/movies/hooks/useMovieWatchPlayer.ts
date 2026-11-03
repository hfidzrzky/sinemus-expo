import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseMovieWatchPlayerOptions {
  src?: string | null;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTokenExpired?: () => Promise<string | null | void>;
}

export interface MovieWatchPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  isFullscreen: boolean;
  isBuffering: boolean;
  playbackRate: number;
  hasError: boolean;
  errorMessage: string | null;
  isRecoveringToken: boolean;
}

export interface MovieWatchPlayerControls {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (val: number) => void;
  seek: (seconds: number) => void;
  seekRelative: (deltaSeconds: number) => void;
  toggleFullscreen: () => Promise<void>;
  setPlaybackRate: (rate: number) => void;
  retryPlayback: () => Promise<void>;
}

export type UseMovieWatchPlayerReturn = MovieWatchPlayerState & MovieWatchPlayerControls;

/**
 * Headless Hook: Kontrol Pemutar Film Cloudflare Stream HLS & Token Recovery
 */
export function useMovieWatchPlayer({
  src,
  autoPlay = false,
  onEnded,
  onTokenExpired,
}: UseMovieWatchPlayerOptions = {}): UseMovieWatchPlayerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecoveringToken, setIsRecoveringToken] = useState(false);

  // Simpan posisi terakhir untuk token expired error recovery
  const lastPlaybackPositionRef = useRef<number>(0);

  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  const onTokenExpiredRef = useRef(onTokenExpired);
  useEffect(() => {
    onTokenExpiredRef.current = onTokenExpired;
  });

  // 1. Play & Pause
  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setHasError(true);
        setErrorMessage('Gagal memulai pemutaran film.');
      }
    }
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void play();
    } else {
      pause();
    }
  }, [play, pause]);

  // 2. Mute & Volume
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const setVolume = useCallback((val: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, val));
    video.volume = clamped;
    video.muted = clamped === 0;
    setVolumeState(clamped);
    setIsMuted(video.muted);
  }, []);

  // 3. Seeking
  const seek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video || !isFinite(video.duration)) return;
    const clamped = Math.max(0, Math.min(video.duration, seconds));
    video.currentTime = clamped;
    setCurrentTime(clamped);
    lastPlaybackPositionRef.current = clamped;
  }, []);

  const seekRelative = useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      seek(video.currentTime + deltaSeconds);
    },
    [seek]
  );

  // 4. Fullscreen
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current || videoRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        await container.requestFullscreen();
      } catch {
        // Fallback for Safari iOS webkitEnterFullscreen
        const video = videoRef.current;
        if (video && 'webkitEnterFullscreen' in video) {
          (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
        }
      }
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  // 5. Playback Rate
  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRateState(rate);
  }, []);

  // 6. Token Expiration Error Recovery
  const retryPlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const savedPosition = lastPlaybackPositionRef.current;
    setIsRecoveringToken(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      if (onTokenExpiredRef.current) {
        await onTokenExpiredRef.current();
      }

      // Restore position & resume
      video.load();
      video.currentTime = savedPosition;
      await video.play().catch(() => {});
    } catch (err: unknown) {
      setHasError(true);
      setErrorMessage(
        err instanceof Error ? err.message : 'Sesi sewa telah berakhir atau tidak dapat diperbarui.'
      );
    } finally {
      setIsRecoveringToken(false);
    }
  }, []);

  // 7. Video Element Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setHasError(false);
      setErrorMessage(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      lastPlaybackPositionRef.current = video.currentTime;

      // Calculate buffer percentage
      if (video.buffered.length > 0 && isFinite(video.duration) && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBufferedPercent(Math.min(100, (bufferedEnd / video.duration) * 100));
      }
    };

    const handleDurationChange = () => {
      if (isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handleVolumeChange = () => {
      setVolumeState(video.volume);
      setIsMuted(video.muted);
    };

    const handleRateChange = () => {
      setPlaybackRateState(video.playbackRate);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };

    const handleError = () => {
      setIsBuffering(false);
      setIsPlaying(false);

      // Check if token may be expired (Network or Source Error)
      const error = video.error;
      const isLikelyTokenExpired =
        error?.code === MediaError.MEDIA_ERR_NETWORK ||
        error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;

      if (isLikelyTokenExpired && onTokenExpiredRef.current) {
        void retryPlayback();
      } else {
        setHasError(true);
        setErrorMessage('Terjadi gangguan saat memutar video streaming. Silakan coba kembali.');
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [retryPlayback]);

  // 8. Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 9. Source change auto-play via native video element without synchronous setState in effect
  useEffect(() => {
    if (!src || !autoPlay) return;
    const video = videoRef.current;
    if (video) {
      void video.play().catch(() => {});
    }
  }, [src, autoPlay]);

  return {
    videoRef,
    containerRef,
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    bufferedPercent,
    isFullscreen,
    isBuffering,
    playbackRate,
    hasError,
    errorMessage,
    isRecoveringToken,
    play,
    pause,
    togglePlay,
    toggleMute,
    setVolume,
    seek,
    seekRelative,
    toggleFullscreen,
    setPlaybackRate,
    retryPlayback,
  };
}
