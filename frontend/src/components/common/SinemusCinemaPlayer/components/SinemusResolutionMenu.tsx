import React from 'react';
import { Check } from 'lucide-react';
import type { ResolutionTrack } from '../types';

export interface SinemusResolutionMenuProps {
  tracks: ResolutionTrack[];
  selectedTrackId: number | 'auto';
  onSelect: (trackId: number | 'auto') => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SinemusResolutionMenu: React.FC<SinemusResolutionMenuProps> = ({
  tracks,
  selectedTrackId,
  onSelect,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop penutup klik luar */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute bottom-16 right-4 z-50 w-44 overflow-hidden rounded-xl border border-neutral-800 bg-[#0B0E14]/95 p-1.5 shadow-2xl backdrop-blur-xl md:right-8">
        <div className="border-b border-neutral-800/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Kualitas Video
        </div>

        <div className="mt-1 flex flex-col gap-0.5">
          {/* Opsi Auto (ABR) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect('auto');
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              selectedTrackId === 'auto'
                ? 'bg-blue-600/15 font-semibold text-blue-400'
                : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
            }`}
          >
            <span>Otomatis (Auto)</span>
            {selectedTrackId === 'auto' && <Check className="h-3.5 w-3.5 text-blue-400" />}
          </button>

          {/* Opsi Varian Resolusi dari Stream */}
          {tracks.map((track) => {
            const isSelected = selectedTrackId === track.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(track.id);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600/15 font-semibold text-blue-400'
                    : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
                }`}
              >
                <span>{track.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-blue-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
