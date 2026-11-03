import { useState, useEffect, useCallback, useRef } from 'react';
import type { SeekFeedbackState } from '../types';

export interface UsePlayerControlsOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function usePlayerControls({ videoRef, containerRef }: UsePlayerControlsOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [seekFeedback, setSeekFeedback] = useState<SeekFeedbackState | null>(null);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedSecondsRef = useRef<number>(0);

  // Reset auto-hide timer (Desktop / Inactivity)
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    // Jika sedang diputar dan tidak sedang drag timeline, sembunyikan setelah 3.5 detik
    if (isPlaying && !isScrubbing) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying, isScrubbing]);

  // Mobile UX (seperti YouTube): Klik layar toggles UI langsung
  const handleScreenTap = useCallback(() => {
    setShowControls((prev) => {
      const next = !prev;
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (next && isPlaying) {
        hideTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 4000);
      }
      return next;
    });
  }, [isPlaying]);

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    resetHideTimer();
  }, [videoRef, resetHideTimer]);

  // Seek waktu (lompat detik)
  const seekRelative = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;

      const target = Math.min(Math.max(0, video.currentTime + seconds), video.duration || 0);
      video.currentTime = target;
      resetHideTimer();

      // Indikator Bayangan Animasi Maju / Mundur (YouTube Cinema Ripple)
      const direction: 'backward' | 'forward' = seconds < 0 ? 'backward' : 'forward';

      if (
        seekFeedbackTimerRef.current &&
        ((seconds < 0 && accumulatedSecondsRef.current < 0) ||
          (seconds > 0 && accumulatedSecondsRef.current > 0))
      ) {
        accumulatedSecondsRef.current += seconds;
      } else {
        accumulatedSecondsRef.current = seconds;
      }

      setSeekFeedback({
        direction,
        seconds: Math.abs(accumulatedSecondsRef.current),
        key: Date.now(),
      });

      if (seekFeedbackTimerRef.current) {
        clearTimeout(seekFeedbackTimerRef.current);
      }
      seekFeedbackTimerRef.current = setTimeout(() => {
        setSeekFeedback(null);
        accumulatedSecondsRef.current = 0;
        seekFeedbackTimerRef.current = null;
      }, 750);
    },
    [videoRef, resetHideTimer]
  );

  // Seek ke waktu absolut
  const seekTo = useCallback(
    (timeInSeconds: number) => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = Math.min(Math.max(0, timeInSeconds), video.duration || 0);
      setCurrentTime(video.currentTime);
    },
    [videoRef]
  );

  // Mute Toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (!video.muted && video.volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
    resetHideTimer();
  }, [videoRef, resetHideTimer]);

  // Set Volume
  const changeVolume = useCallback(
    (newVolume: number) => {
      const video = videoRef.current;
      if (!video) return;

      const clamped = Math.min(Math.max(0, newVolume), 1);
      video.volume = clamped;
      video.muted = clamped === 0;
      setVolume(clamped);
      setIsMuted(clamped === 0);
      resetHideTimer();
    },
    [videoRef, resetHideTimer]
  );

  // Fullscreen Toggle pada Container Wrapper
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    try {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (
          (container as unknown as { webkitRequestFullscreen?: () => Promise<void> })
            .webkitRequestFullscreen
        ) {
          await (
            container as unknown as { webkitRequestFullscreen: () => Promise<void> }
          ).webkitRequestFullscreen();
        } else if (
          video &&
          (video as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen
        ) {
          (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
        }

        // Kunci orientasi landscape untuk sensasi bioskop mobile (jika didukung)
        const screenObj = window.screen as unknown as {
          orientation?: { lock?: (orientation: string) => Promise<void> };
        };
        if (screenObj?.orientation?.lock) {
          try {
            await screenObj.orientation.lock('landscape');
          } catch {
            // Abaikan jika orientasi tidak diizinkan oleh peramban
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (
          (document as unknown as { webkitExitFullscreen?: () => Promise<void> })
            .webkitExitFullscreen
        ) {
          await (
            document as unknown as { webkitExitFullscreen: () => Promise<void> }
          ).webkitExitFullscreen();
        }

        const screenObj = window.screen as unknown as { orientation?: { unlock?: () => void } };
        if (screenObj?.orientation?.unlock) {
          try {
            screenObj.orientation.unlock();
          } catch {
            // Abaikan
          }
        }
      }
    } catch {
      // Ignore fullscreen refusal
    }
    resetHideTimer();
  }, [containerRef, videoRef, resetHideTimer]);

  // Event Listeners pada video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };
    const onTimeUpdate = () => {
      if (!isScrubbing) {
        setCurrentTime(video.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
    };
  }, [videoRef, isScrubbing]);

  // Fullscreen change listener (W3C standard & iOS Safari)
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ||
          (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
        )
      );
    };

    const video = videoRef.current;
    const onWebkitBeginFs = () => setIsFullscreen(true);
    const onWebkitEndFs = () => setIsFullscreen(false);

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    if (video) {
      video.addEventListener('webkitbeginfullscreen', onWebkitBeginFs);
      video.addEventListener('webkitendfullscreen', onWebkitEndFs);
    }

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      if (video) {
        video.removeEventListener('webkitbeginfullscreen', onWebkitBeginFs);
        video.removeEventListener('webkitendfullscreen', onWebkitEndFs);
      }
    };
  }, [videoRef]);

  // Listener orientasi fisik perangkat (UX Cinema saat HP diputar ke landscape)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientation = () => {
      resetHideTimer();
    };

    window.addEventListener('orientationchange', handleOrientation);
    const mql = window.matchMedia?.('(orientation: landscape)');
    mql?.addEventListener?.('change', handleOrientation);

    return () => {
      window.removeEventListener('orientationchange', handleOrientation);
      mql?.removeEventListener?.('change', handleOrientation);
    };
  }, [resetHideTimer]);

  // Keyboard Shortcuts (Desktop)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Jangan cegat input jika user sedang mengetik di input text
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        seekRelative(-10);
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        seekRelative(10);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [togglePlay, seekRelative, toggleFullscreen, toggleMute]);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    showControls,
    isScrubbing,
    setIsScrubbing,
    togglePlay,
    seekRelative,
    seekTo,
    toggleMute,
    changeVolume,
    toggleFullscreen,
    resetHideTimer,
    handleScreenTap,
    seekFeedback,
  };
}
