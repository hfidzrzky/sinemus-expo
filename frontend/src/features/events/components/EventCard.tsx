import React from 'react';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePresaleStatus } from '../hooks/usePresaleStatus';
import { formatMovieDuration } from '../utils/formatters';
import type { EventSummary } from '../types';

interface EventCardProps {
  event: EventSummary;
  onSelect?: (event: EventSummary) => void;
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect, className }) => {
  const isPresale = event.event_type === 'presale_cinema';
  const startAt = event.sales_start_at || event.presale_start_at;
  const endAt = event.sales_end_at || event.presale_end_at;
  const concludesAt = event.event_concludes_at;

  // Real-time sales lifecycle status (Universal for Presale & Reguler with event_concludes_at)
  const salesStatus = usePresaleStatus(startAt, endAt, undefined, isPresale, concludesAt);

  // Format date helper: "SABTU, 28 NOV • 19:00 WIB"
  const formatShowTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const dayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long' });
      const dayMonthFormatter = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
      });
      const timeFormatter = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const dayName = dayFormatter.format(date).toUpperCase();
      const dayMonth = dayMonthFormatter.format(date).toUpperCase();
      const time = timeFormatter.format(date).replace('.', ':');

      return `${dayName}, ${dayMonth} • ${time} WIB`;
    } catch {
      return isoString;
    }
  };

  return (
    <div
      onClick={() => onSelect?.(event)}
      className={cn(
        'group relative flex w-[280px] shrink-0 cursor-pointer snap-start flex-col justify-between overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700/80 sm:w-[380px] sm:rounded-2xl sm:p-5',
        event.is_featured && 'shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:border-neutral-600',
        className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(event);
        }
      }}
    >
      {/* Top Header: Schedule & Venue */}
      <div className="space-y-1 border-b border-neutral-800/60 pb-2.5 sm:space-y-1.5 sm:pb-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400 sm:text-xs">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-400/90" />
          <span>{formatShowTime(event.earliest_show_time)}</span>
        </div>

        <div className="flex items-center gap-1.5 truncate text-[11px] text-neutral-400 sm:text-xs">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
          <span className="truncate">
            {event.venue_name}, {event.city}
          </span>
        </div>
      </div>

      {/* Middle Body: Poster Thumbnail + Title & Metadata */}
      <div className="flex items-start gap-3 py-2.5 sm:gap-4 sm:py-3.5">
        {/* Poster thumbnail */}
        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md border border-neutral-800 bg-neutral-900 shadow-md sm:h-24 sm:w-16 sm:rounded-lg">
          <img
            src={event.poster_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {event.is_featured && (
            <div className="absolute left-0 top-0 rounded-br-md rounded-tl-md border-b border-r border-white/20 bg-black/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md sm:rounded-tl-lg">
              SOROTAN
            </div>
          )}
        </div>

        {/* Title, Category & Natural Metadata */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <h4 className="line-clamp-2 font-display text-sm font-bold leading-snug text-white transition-colors group-hover:text-blue-400 sm:text-base">
            {event.title}
          </h4>

          {/* Film Metadata Line: [13+] • 2024 • 2j 5m • Drama, Romansa */}
          {(event.release_year ||
            event.duration_minutes ||
            (event.genre && event.genre.length > 0) ||
            event.age_rating) && (
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              {event.age_rating && (
                <span className="rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 font-mono text-[9px] font-bold text-neutral-200">
                  {event.age_rating}
                </span>
              )}
              {event.release_year && (
                <>
                  {event.age_rating && <span className="text-neutral-600">•</span>}
                  <span className="font-semibold text-neutral-300">{event.release_year}</span>
                </>
              )}
              {event.duration_minutes ? (
                <>
                  {(event.age_rating || event.release_year) && (
                    <span className="text-neutral-600">•</span>
                  )}
                  <span className="font-medium text-neutral-300">
                    {formatMovieDuration(event.duration_minutes)}
                  </span>
                </>
              ) : null}
              {event.genre && event.genre.length > 0 && (
                <>
                  {(event.age_rating || event.release_year || event.duration_minutes) && (
                    <span className="text-neutral-600">•</span>
                  )}
                  <span className="max-w-[130px] truncate font-medium text-neutral-300">
                    {Array.isArray(event.genre) ? event.genre.slice(0, 2).join(', ') : event.genre}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Clean editorial metadata (bukan pill capsule bertumpuk) */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-neutral-400">
            {/* Event Type / Presale Tag */}
            {/* Event Type / Sales Status Tag */}
            <span
              className={cn(
                'font-medium',
                salesStatus?.isLive
                  ? 'text-emerald-400'
                  : !salesStatus?.canBook
                    ? 'text-amber-400'
                    : isPresale
                      ? 'text-blue-400'
                      : 'text-neutral-300'
              )}
            >
              {salesStatus
                ? salesStatus.label
                : isPresale
                  ? 'Presale Bioskop'
                  : 'Screening Komunitas'}
            </span>

            {/* Separator dot */}
            {typeof event.remaining_seats_count === 'number' && (
              <span className="text-neutral-600">•</span>
            )}

            {/* Remaining seats */}
            {typeof event.remaining_seats_count === 'number' && (
              <span
                className={cn(
                  event.remaining_seats_count === 0
                    ? 'font-medium text-rose-400'
                    : 'text-neutral-400'
                )}
              >
                {event.remaining_seats_count === 0
                  ? 'Kursi Habis'
                  : `Sisa ${event.remaining_seats_count} Kursi`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer: Price & Action CTA */}
      <div className="flex items-center justify-between border-t border-neutral-800/60 pt-2.5 sm:pt-3">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-neutral-400 sm:text-[10px]">
            Harga Mulai
          </p>
          <p className="text-xs font-extrabold text-white sm:text-sm">
            {event.formatted_starting_price || `Rp ${event.starting_price.toLocaleString('id-ID')}`}{' '}
            <span className="text-[10px] font-normal text-neutral-400 sm:text-[11px]">/ Kursi</span>
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(event);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 active:scale-95 sm:rounded-xl sm:px-3.5 sm:py-1.5 sm:text-xs',
            salesStatus && !salesStatus.canBook
              ? 'border border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-700'
              : 'bg-[#0066FF] text-white hover:bg-[#0052D4] hover:shadow-md hover:shadow-blue-500/20'
          )}
        >
          <span>{salesStatus?.cta || 'PILIH KURSI'}</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
