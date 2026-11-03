import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface SinemusPlayerHeaderProps {
  title: string;
  onBack?: () => void;
  showControls: boolean;
}

export const SinemusPlayerHeader: React.FC<SinemusPlayerHeaderProps> = ({
  title,
  onBack,
  showControls,
}) => {
  return (
    <div
      className={`pointer-events-auto absolute left-4 top-4 z-30 flex items-center gap-3 transition-opacity duration-300 md:left-6 md:top-6 ${
        showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {/* Tombol Back */}
      {onBack && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700/50 bg-black/60 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-neutral-800 active:scale-95"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      {/* Border Left Biru & Judul Film */}
      <div className="border-l-4 border-blue-500 py-0.5 pl-3 md:pl-3.5">
        <h3 className="line-clamp-1 select-none font-display text-sm font-bold tracking-wide text-white md:text-base">
          {title}
        </h3>
      </div>
    </div>
  );
};
