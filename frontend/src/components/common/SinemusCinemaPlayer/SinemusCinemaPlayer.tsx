import React, { useRef, useState, useCallback } from 'react';
import { useShakaPlayer } from './hooks/useShakaPlayer';
import { usePlayerControls } from './hooks/usePlayerControls';
import { SinemusPlayerHeader } from './components/SinemusPlayerHeader';
import { SinemusCenterControls } from './components/SinemusCenterControls';
import { SinemusSeekIndicator } from './components/SinemusSeekIndicator';
import { SinemusPlayerControls } from './components/SinemusPlayerControls';
import { SinemusPlayerOverlay } from './components/SinemusPlayerOverlay';
import type { SinemusCinemaPlayerProps } from './types';

export const SinemusCinemaPlayer: React.FC<SinemusCinemaPlayerProps> = ({
  manifestUrl,
  videoUid,
  signedToken,
  title,
  autoplay = true,
  onBack,
  onError,
  className = '',
  isVoD = false,
  watermarkText,
  topRightBadge,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // 1. Shaka Player Engine Hook
  const { isBuffering, errorMessage, tracks, selectedTrackId, changeResolution } = useShakaPlayer({
    videoRef,
    manifestUrl,
    videoUid,
    signedToken,
    autoplay,
    onError,
  });

  // 2. Player Controls Interaction Hook (Desktop 3.5s timer & Mobile YouTube-Style Tap)
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    showControls,
    togglePlay,
    seekRelative,
    seekTo,
    toggleMute,
    changeVolume,
    toggleFullscreen,
    resetHideTimer,
    handleScreenTap,
    seekFeedback,
  } = usePlayerControls({
    videoRef,
    containerRef,
  });

  const handleRetry = useCallback(() => {
    setRetryKey((prev) => prev + 1);
  }, []);

  return (
    <div
      key={retryKey}
      ref={containerRef}
      onMouseMove={resetHideTimer}
      className={`group relative flex w-full select-none items-center justify-center overflow-hidden bg-black ${className} ${
        isFullscreen || isVoD
          ? '!aspect-auto h-full w-full rounded-none'
          : 'aspect-video rounded-xl'
      }`}
    >
      {/* Native HTML5 Video Element dikendalikan oleh Shaka Player */}
      <video ref={videoRef} className="h-full w-full cursor-pointer object-contain" playsInline />

      {/* Layer Tap Layar (YouTube Mobile UX: Tap sekali tampil lengkap, tap lagi langsung hilang) */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleScreenTap}
        aria-hidden="true"
      />

      {/* Pojok Kiri Atas: Back Button + Border Left Biru + Judul Film */}
      <SinemusPlayerHeader title={title} onBack={onBack} showControls={showControls} />

      {/* Pojok Kanan Atas: Badge (misal Countdown Sisa Waktu Sewa) */}
      {topRightBadge && (
        <div
          className={`pointer-events-auto absolute right-4 top-4 z-30 transition-opacity duration-300 md:right-6 md:top-6 ${
            showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {topRightBadge}
        </div>
      )}

      {/* Watermark Anti-Piracy Dinamis */}
      {watermarkText && (
        <div className="backdrop-blur-xs pointer-events-none absolute bottom-14 right-4 z-20 select-none font-mono text-[10px] font-bold uppercase tracking-widest text-white/20 sm:text-xs">
          {watermarkText} • SINEMUS ID
        </div>
      )}

      {/* Kontrol Cepat di Tengah Layar (YouTube/Netflix Style) */}
      <SinemusCenterControls
        isPlaying={isPlaying}
        showControls={showControls}
        onTogglePlay={togglePlay}
        onSeekRelative={seekRelative}
        onInteraction={resetHideTimer}
      />

      {/* Indikator Animasi Bayangan Maju / Mundur 10 Detik (YouTube Ripple Feedback) */}
      <SinemusSeekIndicator seekFeedback={seekFeedback} />

      {/* Status Buffering & Error Overlay */}
      <SinemusPlayerOverlay
        isBuffering={isBuffering}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />

      {/* Bottom Controls Bar (Netflix-Style dengan Aksen Biru Sinemus) */}
      <SinemusPlayerControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        showControls={showControls}
        tracks={tracks}
        selectedTrackId={selectedTrackId}
        onTogglePlay={togglePlay}
        onSeekRelative={seekRelative}
        onSeekTo={seekTo}
        onToggleMute={toggleMute}
        onChangeVolume={changeVolume}
        onToggleFullscreen={toggleFullscreen}
        onChangeResolution={changeResolution}
        onInteraction={resetHideTimer}
      />
    </div>
  );
};
