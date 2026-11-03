import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { formatCountdownTimer } from '@/lib/utils';
import { usePublicSettingsQuery } from '@/features/admin';
import { formatMovieDuration } from '@/features/movies';
import type { MyFilmRentalItem } from '../types';

export interface FilmRentalCardProps {
  film: MyFilmRentalItem;
  onWatch?: (slug: string) => void;
}

export const FilmRentalCard: React.FC<FilmRentalCardProps> = ({ film, onWatch }) => {
  const { data: publicSettings } = usePublicSettingsQuery();
  const vodRentalHours = publicSettings?.business_policies.vod_rental_duration_hours ?? 48;
  const [remainingSeconds, setRemainingSeconds] = useState(film.remaining_seconds);

  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const isExpired = film.is_expired || remainingSeconds <= 0;

  const formatRemainingHuman = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} Jam ${minutes} Menit`;
    }
    return formatCountdownTimer(seconds);
  };

  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 transition-colors hover:border-neutral-700/80 sm:p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Left: Poster & Info */}
        <div className="flex items-start gap-3.5">
          <img
            src={film.poster_url}
            alt={film.title}
            className="h-20 w-14 shrink-0 rounded-lg border border-neutral-800 bg-neutral-950 object-cover sm:h-24 sm:w-16"
          />

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">{film.title}</h3>

            <p className="text-xs text-neutral-400">
              {film.genre}
              {formatMovieDuration(film.duration_minutes)
                ? ` • ${formatMovieDuration(film.duration_minutes)}`
                : ''}
            </p>

            <div className="pt-1 text-xs">
              {isExpired ? (
                <span className="text-neutral-500">
                  Masa akses streaming {vodRentalHours} jam telah berakhir
                </span>
              ) : (
                <span className="text-neutral-300">
                  Sisa waktu akses streaming:{' '}
                  <span className="font-mono font-medium text-emerald-400">
                    {formatRemainingHuman(remainingSeconds)}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status & Action Button */}
        <div className="flex items-center justify-between gap-3 border-t border-neutral-800/60 pt-2 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <div>
            {isExpired ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800/80 bg-neutral-900/80 px-2.5 py-0.5 text-neutral-400 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-500" />
                <span className="text-[11px] font-medium tracking-wide">Akses Selesai</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800/80 bg-neutral-900/80 px-2.5 py-0.5 text-neutral-200 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium tracking-wide">Streaming Aktif</span>
              </div>
            )}
          </div>

          <div>
            {isExpired ? (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center rounded-lg border border-neutral-800/80 bg-neutral-900/50 px-3.5 py-2 text-xs font-medium text-neutral-500"
              >
                Akses Berakhir
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onWatch?.(film.slug)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Nonton Film</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
