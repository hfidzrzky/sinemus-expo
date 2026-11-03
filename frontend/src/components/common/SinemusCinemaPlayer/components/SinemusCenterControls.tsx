import React from 'react';
import { Play, Pause } from 'lucide-react';

export interface SinemusCenterControlsProps {
  isPlaying: boolean;
  showControls: boolean;
  onTogglePlay: () => void;
  onSeekRelative: (seconds: number) => void;
  onInteraction: () => void;
}

export const SinemusCenterControls: React.FC<SinemusCenterControlsProps> = ({
  isPlaying,
  showControls,
  onTogglePlay,
  onSeekRelative,
  onInteraction,
}) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center transition-all duration-300 ${
        showControls ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}
    >
      <div className="flex items-center gap-8 sm:gap-12 md:gap-16 lg:gap-20">
        {/* Tombol Mundur 10 Detik */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInteraction();
            onSeekRelative(-10);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          className={`${
            showControls ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
          } flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/60 text-neutral-200 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-black/80 hover:text-white active:scale-95 sm:h-14 sm:w-14 md:h-16 md:w-16`}
          aria-label="Mundur 10 detik"
          title="Mundur 10 detik"
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-neutral-200 transition-colors group-hover:text-white sm:h-7 sm:w-7 md:h-8 md:w-8"
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

        {/* Tombol Utama Play / Pause (Besar di Tengah Layar) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInteraction();
            onTogglePlay();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          className={`${
            showControls ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
          } md:h-22 md:w-22 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-500 active:scale-95 sm:h-20 sm:w-20`}
          aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
          title={isPlaying ? 'Jeda' : 'Putar'}
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 fill-white text-white sm:h-10 sm:w-10 md:h-11 md:w-11" />
          ) : (
            <Play className="h-8 w-8 translate-x-0.5 fill-white text-white sm:h-10 sm:w-10 md:h-11 md:w-11" />
          )}
        </button>

        {/* Tombol Maju 10 Detik */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInteraction();
            onSeekRelative(10);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          className={`${
            showControls ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
          } flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/60 text-neutral-200 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-black/80 hover:text-white active:scale-95 sm:h-14 sm:w-14 md:h-16 md:w-16`}
          aria-label="Maju 10 detik"
          title="Maju 10 detik"
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-neutral-200 transition-colors group-hover:text-white sm:h-7 sm:w-7 md:h-8 md:w-8"
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
      </div>
    </div>
  );
};
