import React from 'react';
import { cn } from '@/lib/utils';
import { formatMovieDuration } from '../utils/formatters';
import type { MovieSummary } from '../types';

interface MovieCardProps {
  movie: MovieSummary;
  onSelect?: (movie: MovieSummary) => void;
  className?: string;
  showTitle?: boolean;
  showMetadata?: boolean;
  /** @deprecated Tampilan awal kartu tidak lagi menampilkan harga. Gunakan showMetadata. */
  showPrice?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
  className,
  showTitle = false,
  showMetadata = false,
  showPrice,
}) => {
  const shouldShowMetadata = showMetadata || Boolean(showPrice);
  return (
    <div
      onClick={() => onSelect?.(movie)}
      className={cn(
        'group relative flex w-[130px] shrink-0 cursor-pointer select-none snap-start flex-col transition-all duration-300 hover:-translate-y-1 sm:w-[155px] md:w-[170px] lg:w-[185px]',
        className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(movie);
        }
      }}
    >
      {/* Poster Container (Aspect 2:3 Full-Bleed Modern) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-900 shadow-md">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Subtle Gradient Shadow Overlay on Hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Age Rating Badge */}
        {movie.age_rating && (
          <div className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            {movie.age_rating}
          </div>
        )}
      </div>

      {/* Judul Film (Hanya tampil jika showTitle aktif, default false agar tampilan bersih hanya poster) */}
      {showTitle && (
        <h4 className="mt-2 truncate font-display text-xs font-bold text-white transition-colors group-hover:text-blue-400 sm:text-sm">
          {movie.title}
        </h4>
      )}

      {/* Metadata Film Ringkas (Genre, Tahun, Durasi — Bersih tanpa badge/harga) */}
      {shouldShowMetadata && (
        <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="truncate">{movie.genre || 'Film'}</span>
          <span className="shrink-0 text-neutral-500">
            {[
              movie.release_year,
              movie.duration_minutes ? formatMovieDuration(movie.duration_minutes) : null,
            ]
              .filter(Boolean)
              .join(' • ')}
          </span>
        </div>
      )}
    </div>
  );
};
