import React from 'react';
import { cn } from '@/lib/utils';
import type { MovieDetail, CastItem } from '../types';

export interface MovieCastCrewSectionProps {
  movie: MovieDetail;
  className?: string;
}

export const MovieCastCrewSection: React.FC<MovieCastCrewSectionProps> = ({
  movie,
  className = '',
}) => {
  // Normalisasi daftar nama aktor/pemeran menjadi format string bersih ("Aktor sebagai Peran")
  const castList = Array.isArray(movie.cast)
    ? movie.cast
        .map((item: CastItem) => {
          if (typeof item === 'string') {
            return item.trim();
          }
          if (item && typeof item === 'object') {
            const actor = item.actor?.trim() || '';
            const role = item.role?.trim();
            if (!actor) return '';
            return role ? `${actor} sebagai ${role}` : actor;
          }
          return '';
        })
        .filter(Boolean)
    : [];

  const directorName = movie.director?.trim() || '-';

  return (
    <section className={cn('space-y-3', className)} aria-labelledby="movie-credits-heading">
      <h2
        id="movie-credits-heading"
        className="font-display text-lg font-bold tracking-tight text-white sm:text-xl"
      >
        Detail Pemeran & Sutradara
      </h2>

      {/* Tampilan Teks Rapi Bersih (Tanpa Border Box & Tanpa Icon Sesuai UX Clean) */}
      <div className="space-y-3 pt-1 text-sm">
        {/* Sutradara */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="min-w-[100px] shrink-0 font-semibold text-neutral-400">Sutradara :</span>
          <span className="text-sm font-medium text-white sm:text-base">{directorName}</span>
        </div>

        {/* Aktor / Pemeran (Disusun kebawah per baris, tanpa pemisah koma) */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="min-w-[100px] shrink-0 font-semibold text-neutral-400">Aktor :</span>
          {castList.length > 0 ? (
            <div className="flex flex-col gap-1.5 text-sm font-medium leading-relaxed text-neutral-200 sm:text-base">
              {castList.map((castItem, idx) => (
                <span key={`${castItem}-${idx}`}>{castItem}</span>
              ))}
            </div>
          ) : (
            <span className="text-sm font-medium text-neutral-400 sm:text-base">-</span>
          )}
        </div>
      </div>
    </section>
  );
};
