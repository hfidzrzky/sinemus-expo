import React from 'react';
import { UserCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { usePublicSettingsQuery } from '@/features/admin';
import { cn } from '@/lib/utils';
import type { MovieDetail, CastItem } from '../types';

export interface MovieSynopsisCardProps {
  movie: MovieDetail;
  className?: string;
}

export const MovieSynopsisCard: React.FC<MovieSynopsisCardProps> = ({ movie, className = '' }) => {
  const { data: publicSettings } = usePublicSettingsQuery();

  const rentalDurationHours =
    movie.rental_duration_hours ||
    publicSettings?.business_policies?.vod_rental_duration_hours ||
    48;

  // Normalisasi daftar pemain (baik string atau object CastMember)
  const renderCastItem = (castItem: CastItem, index: number) => {
    if (typeof castItem === 'string') {
      return (
        <span
          key={`cast-${index}`}
          className="rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-1.5 text-xs font-medium text-neutral-300"
        >
          {castItem}
        </span>
      );
    }

    return (
      <span
        key={`cast-${index}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-1.5 text-xs text-neutral-300"
      >
        <span className="font-semibold text-neutral-200">{castItem.actor}</span>
        {castItem.role && <span className="text-neutral-500">({castItem.role})</span>}
      </span>
    );
  };

  return (
    <div
      className={cn(
        'space-y-6 rounded-2xl border border-neutral-800/80 bg-neutral-950/80 p-6 backdrop-blur sm:p-8',
        className
      )}
    >
      {/* Sinopsis Cerita */}
      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold text-white sm:text-xl">Sinopsis</h3>
        <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-300 sm:text-base">
          {movie.synopsis || 'Sinopsis belum tersedia untuk film ini.'}
        </p>
      </div>

      <div className="border-t border-neutral-800/70 pt-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Sutradara */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              <UserCheck className="h-4 w-4 text-blue-400" />
              Sutradara
            </h4>
            <p className="text-sm font-medium text-white sm:text-base">
              {movie.director || 'Tidak ditentukan'}
            </p>
          </div>

          {/* Jaminan Layanan Digital */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs text-blue-200">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
            <div className="space-y-1">
              <span className="font-semibold text-white">Jaminan Akses Digital Resmi</span>
              <p className="text-neutral-300">
                Masa sewa <strong>{rentalDurationHours} jam</strong> sejak pembayaran diverifikasi.
                Akses bebas putar berulang kali tanpa jeda iklan dengan kualitas HD Cloudflare
                Stream.
              </p>
            </div>
          </div>
        </div>

        {/* Daftar Pemeran / Cast */}
        {Array.isArray(movie.cast) && movie.cast.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Pemeran Utama
            </h4>
            <div className="flex flex-wrap gap-2">{movie.cast.map(renderCastItem)}</div>
          </div>
        )}
      </div>
    </div>
  );
};
