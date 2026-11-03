import React from 'react';
import { CalendarDays, Film, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyEventsStateProps {
  title?: string;
  description?: string;
  showSectionHeader?: boolean;
  onExploreMovies?: () => void;
  className?: string;
}

export const EmptyEventsState: React.FC<EmptyEventsStateProps> = ({
  title = 'Belum Ada Jadwal Screening Aktif',
  description = 'Saat ini seluruh sesi penayangan bioskop kampus telah selesai atau sedang dalam tahap kurasi jadwal berikutnya. Nantikan pengumuman sesi presale selanjutnya!',
  showSectionHeader = true,
  onExploreMovies,
  className,
}) => {
  return (
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      {showSectionHeader && (
        <div className="flex items-end justify-between px-1">
          <div className="space-y-0.5">
            <h3 className="font-display text-base font-bold tracking-tight text-white sm:text-2xl">
              Event Screening
            </h3>
            <p className="text-[11px] font-normal text-neutral-400 sm:text-sm">
              Penayangan bioskop alternatif &amp; venue kampus
            </p>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/40 via-neutral-900/20 to-neutral-950/70 p-6 text-center backdrop-blur-sm sm:p-10">
        {/* Subtle Ambient Radial Glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-28 w-72 -translate-x-1/2 rounded-full bg-[#0066FF]/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Minimalist Bare Icon (Tanpa Box / Background) */}
          <CalendarDays className="h-8 w-8 text-neutral-400 sm:h-9 sm:w-9" />

          {/* Heading & Subtitle */}
          <h4 className="mt-3 font-display text-sm font-bold tracking-tight text-white sm:text-base md:text-lg">
            {title}
          </h4>
          {description && (
            <p className="mx-auto mt-1.5 max-w-lg text-xs leading-relaxed text-neutral-400 sm:text-sm sm:leading-relaxed">
              {description}
            </p>
          )}

          {/* Optional Action CTA */}
          {onExploreMovies && (
            <button
              type="button"
              onClick={onExploreMovies}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-4 py-2 text-xs font-semibold text-neutral-200 transition-all duration-200 hover:border-neutral-500 hover:bg-neutral-800 hover:text-white active:scale-95 sm:text-sm"
            >
              <Film className="h-4 w-4 text-blue-400" />
              <span>Jelajahi Katalog Streaming Film</span>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
