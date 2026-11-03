import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Volume1, Maximize, Minimize, Settings } from 'lucide-react';
import { SinemusResolutionMenu } from './SinemusResolutionMenu';
import type { ResolutionTrack } from '../types';

export interface SinemusPlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  tracks: ResolutionTrack[];
  selectedTrackId: number | 'auto';
  onTogglePlay: () => void;
  onSeekRelative: (seconds: number) => void;
  onSeekTo: (seconds: number) => void;
  onToggleMute: () => void;
  onChangeVolume: (volume: number) => void;
  onToggleFullscreen: () => void;
  onChangeResolution: (trackId: number | 'auto') => void;
  onInteraction: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const SinemusPlayerControls: React.FC<SinemusPlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  showControls,
  tracks,
  selectedTrackId,
  onTogglePlay,
  onSeekRelative,
  onSeekTo,
  onToggleMute,
  onChangeVolume,
  onToggleFullscreen,
  onChangeResolution,
  onInteraction,
}) => {
  const [isResolutionMenuOpen, setIsResolutionMenuOpen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onInteraction();
    const bar = progressBarRef.current;
    if (!bar || duration <= 0) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeekTo(ratio * duration);
  };

  const handleProgressBarTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onInteraction();
    const bar = progressBarRef.current;
    if (!bar || duration <= 0) return;

    const touch = e.touches[0];
    if (!touch) return;
    const rect = bar.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, touchX / rect.width));
    onSeekTo(ratio * duration);
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || duration <= 0) return;

    const rect = bar.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(ratio * duration);
    setHoverPosition(hoverX);
  };

  const currentResolutionLabel =
    selectedTrackId === 'auto'
      ? 'Auto'
      : tracks.find((t) => t.id === selectedTrackId)?.label || 'HD';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/60 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-14 transition-opacity duration-300 sm:px-4 sm:pb-4 sm:pt-16 md:px-6 md:pb-6 ${
        showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {/* 1. Scrubber / Progress Bar */}
      <div
        ref={progressBarRef}
        onClick={handleProgressBarClick}
        onTouchStart={handleProgressBarTouch}
        onTouchMove={handleProgressBarTouch}
        onMouseMove={handleProgressBarMouseMove}
        onMouseLeave={() => setHoverTime(null)}
        className="group relative mb-2.5 flex h-4 w-full cursor-pointer touch-none items-center sm:mb-3.5"
      >
        {/* Tooltip Waktu saat Hover */}
        {hoverTime !== null && (
          <div
            style={{ left: `${hoverPosition}px` }}
            className="pointer-events-none absolute bottom-5 -translate-x-1/2 rounded border border-neutral-700 bg-neutral-900/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shadow-lg"
          >
            {formatTime(hoverTime)}
          </div>
        )}

        {/* Track Latar */}
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-neutral-700/60 transition-all group-hover:h-2">
          {/* Progress Terisi (Gradasi Biru Sinemus) */}
          <div
            style={{ width: `${progressPercent}%` }}
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
          />
        </div>

        {/* Handle Knob Lingkaran */}
        <div
          style={{ left: `${progressPercent}%` }}
          className="absolute h-3 w-3 -translate-x-1/2 scale-0 rounded-full bg-blue-500 shadow-md transition-transform group-hover:scale-100 sm:h-3.5 sm:w-3.5"
        />
      </div>

      {/* 2. Control Buttons Bar */}
      <div className="flex items-center justify-between text-white">
        {/* Sisi Kiri: Play, Rewind 10s (Desktop), Forward 10s (Desktop), Volume (Desktop), Time */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 md:gap-4">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInteraction();
              onTogglePlay();
            }}
            className="shrink-0 touch-manipulation rounded-full p-1.5 text-white transition-transform hover:scale-110 active:scale-95"
            aria-label={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-white text-white sm:h-6 sm:w-6" />
            ) : (
              <Play className="h-5 w-5 translate-x-0.5 fill-white text-white sm:h-6 sm:w-6" />
            )}
          </button>

          {/* Mundur 10s - Sembunyikan di layar mobile karena sudah ada Center Controls & Double-Tap */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInteraction();
              onSeekRelative(-10);
            }}
            className="hidden shrink-0 rounded-full p-1.5 text-neutral-300 transition-colors hover:text-white sm:inline-flex"
            title="Mundur 10 Detik"
            aria-label="Mundur 10 Detik"
          >
            <svg
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M4 16a12 12 0 1 0 12-12c-4 0-7.5 1.8-9.8 4.6L4 11" />
              <polyline points="4 5 4 11 10 11" />
              <text
                x="16"
                y="16.5"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="8.5"
                fontWeight="800"
                fill="currentColor"
                stroke="none"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                10
              </text>
            </svg>
          </button>

          {/* Maju 10s - Sembunyikan di layar mobile */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInteraction();
              onSeekRelative(10);
            }}
            className="hidden shrink-0 rounded-full p-1.5 text-neutral-300 transition-colors hover:text-white sm:inline-flex"
            title="Maju 10 Detik"
            aria-label="Maju 10 Detik"
          >
            <svg
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M28 16a12 12 0 1 1-12-12c4 0 7.5 1.8 9.8 4.6L28 11" />
              <polyline points="28 5 28 11 22 11" />
              <text
                x="16"
                y="16.5"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="8.5"
                fontWeight="800"
                fill="currentColor"
                stroke="none"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                10
              </text>
            </svg>
          </button>

          {/* Volume Control - Sembunyikan di mobile smartphone karena user memakai tombol fisik perangkat */}
          <div className="group relative hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInteraction();
                onToggleMute();
              }}
              className="rounded-full p-1 text-neutral-300 transition-colors hover:text-white"
              title={isMuted ? 'Buka Suara' : 'Bisukan'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5 text-red-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>

            {/* Volume Slider Slider (Muncul saat hover di desktop) */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                e.stopPropagation();
                onInteraction();
                onChangeVolume(parseFloat(e.target.value));
              }}
              className="h-1 w-0 cursor-pointer accent-blue-500 opacity-0 transition-all duration-200 group-hover:w-16 group-hover:opacity-100 md:group-hover:w-20"
              aria-label="Volume suara"
            />
          </div>

          {/* Durasi & Waktu Berjalan */}
          <div className="shrink-0 select-none font-mono text-[11px] text-neutral-300 sm:text-xs">
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1 text-neutral-500">/</span>
            <span className="text-neutral-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Sisi Kanan: Resolusi & Fullscreen (shrink-0 mutlak agar tidak pernah terpotong) */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
          {/* Tombol Pemilih Resolusi */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInteraction();
                setIsResolutionMenuOpen((prev) => !prev);
              }}
              className="flex touch-manipulation items-center gap-1.5 rounded-lg border border-neutral-700/60 bg-black/40 px-2 py-1 text-xs font-semibold text-neutral-200 backdrop-blur-md transition-colors hover:border-neutral-500 hover:text-white sm:px-2.5"
              title="Pilih Kualitas Video"
              aria-label="Pilih Kualitas Video"
            >
              <Settings className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden font-mono text-[11px] sm:inline">
                {currentResolutionLabel}
              </span>
            </button>

            {/* Popover Menu Resolusi */}
            <SinemusResolutionMenu
              tracks={tracks}
              selectedTrackId={selectedTrackId}
              onSelect={onChangeResolution}
              isOpen={isResolutionMenuOpen}
              onClose={() => setIsResolutionMenuOpen(false)}
            />
          </div>

          {/* Tombol Fullscreen - Luas & Mudah di-tap di mobile */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInteraction();
              onToggleFullscreen();
            }}
            className="touch-manipulation rounded-full p-1.5 text-neutral-300 transition-colors hover:text-white active:scale-95 sm:p-2"
            title={isFullscreen ? 'Keluar Layar Penuh (F)' : 'Layar Penuh (F)'}
            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
