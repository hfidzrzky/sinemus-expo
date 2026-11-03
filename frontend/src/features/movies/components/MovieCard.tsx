import React from 'react';
import { cn } from '@/lib/utils';
import { formatMovieDuration } from '../utils/formatters';
import type { MovieSummary } from '../types';

interface MovieCardProps {
  movie: MovieSummary;
  onSelect?: (movie: MovieSummary) => void;
  className?: string;
  showPrice?: boolean;
  showTitle?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
  className,
  showPrice = false,
  showTitle = false,
}) => {
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

        {/* Access Model Badge if showPrice is active */}
        {showPrice && (
          <div className="absolute right-2 top-2 rounded bg-blue-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-md">
            {movie.access_model === 'free' ? 'Gratis' : '48 Jam'}
          </div>
        )}
      </div>

      {/* Judul Film (Hanya tampil jika showTitle aktif, default false agar tampilan bersih hanya poster) */}
      {showTitle && (
        <h4 className="mt-2 truncate font-display text-xs font-bold text-white transition-colors group-hover:text-blue-400 sm:text-sm">
          {movie.title}
        </h4>
      )}

      {/* Extended Metadata jika showPrice aktif di katalog */}
      {showPrice && (
        <div className="mt-1 w-full space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="truncate">{movie.genre || 'Film'}</span>
            {movie.duration_minutes ? (
              <span className="shrink-0">{formatMovieDuration(movie.duration_minutes)}</span>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-neutral-800/80 pt-1 text-[11px]">
            <span className="text-[10px] text-neutral-500">{movie.release_year || 2026}</span>
            <strong className="text-blue-400">
              {movie.access_model === 'free' ? 'Akses Bebas' : movie.formatted_price}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
