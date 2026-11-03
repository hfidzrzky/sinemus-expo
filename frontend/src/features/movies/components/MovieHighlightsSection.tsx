import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MovieDetail } from '../types';

export interface MovieHighlightsSectionProps {
  movie: MovieDetail;
  onOpenTrailerModal?: () => void;
  onSelectImage?: (imageUrl: string) => void;
  className?: string;
}

export const MovieHighlightsSection: React.FC<MovieHighlightsSectionProps> = ({
  movie,
  onSelectImage,
  className = '',
}) => {
  const lookFilms = movie.look_films || [];

  // Jika tidak ada still foto look film, jangan render seksi kosong
  if (lookFilms.length === 0) {
    return null;
  }

  return (
    <section className={cn('space-y-4', className)} aria-labelledby="looks-film-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blue-400" />
          <h2
            id="looks-film-heading"
            className="font-display text-lg font-bold tracking-tight text-white sm:text-xl"
          >
            Looks Film
          </h2>
        </div>
        <span className="text-xs text-neutral-400">{lookFilms.length} Foto Adegan</span>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {/* Kartu Galeri Still Foto Adegan (Looks Film) — Hanya Gambar */}
        {lookFilms.map((photoUrl, idx) => (
          <div key={`${photoUrl}-${idx}`} className="group relative w-52 shrink-0 sm:w-60 md:w-64">
            <button
              type="button"
              onClick={() => onSelectImage?.(photoUrl)}
              className="relative aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition-all hover:border-blue-500/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <img
                src={photoUrl}
                alt={`Look Film #${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-md">
                Look #{idx + 1}
              </span>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-lg backdrop-blur-md">
                  <ImageIcon className="h-4 w-4" />
                </div>
              </div>
            </button>

            <div className="mt-2 space-y-0.5">
              <p className="text-xs font-semibold text-neutral-200 group-hover:text-white sm:text-sm">
                Foto Adegan #{idx + 1}
              </p>
              <p className="text-[11px] text-neutral-500">Klik untuk melihat foto penuh</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const MovieLooksFilmSection = MovieHighlightsSection;
