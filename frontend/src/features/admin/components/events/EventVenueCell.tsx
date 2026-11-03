import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Building2, ExternalLink, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminEventItem, EventVenueItem } from '../../types';

export interface EventVenueCellProps {
  event: AdminEventItem;
  openUpward?: boolean;
}

export function EventVenueCell({
  event,
  openUpward = true,
}: EventVenueCellProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Extract venues list, with fallback to legacy flat venue fields
  const rawVenues = event.venues && event.venues.length > 0 ? event.venues : [];
  const venues: EventVenueItem[] =
    rawVenues.length > 0
      ? rawVenues
      : [
          {
            id: 0,
            event_id: event.id,
            venue_name: event.venue_name || 'Bioskop Mitra',
            cinema_partner: event.cinema_partner || 'Cinema XXI',
            venue_address: event.venue_address || '',
            city: event.city || 'Indonesia',
            google_maps_url: event.google_maps_url || null,
          },
        ];

  const primaryVenue = venues[0];
  const hasMultipleVenues = venues.length > 1;
  const extraCount = venues.length - 1;

  // Extract unique cities
  const uniqueCities = Array.from(new Set(venues.map((v) => v.city).filter(Boolean)));
  const citySummary =
    uniqueCities.length <= 1
      ? hasMultipleVenues
        ? `${uniqueCities[0] || primaryVenue.city} • ${venues.length} Lokasi`
        : primaryVenue.city || '-'
      : `${uniqueCities.slice(0, 2).join(', ')}${
          uniqueCities.length > 2 ? ` (+${uniqueCities.length - 2})` : ''
        } • ${venues.length} Bioskop`;

  if (!hasMultipleVenues) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <MapPin className="h-3 w-3 flex-shrink-0 text-neutral-500" />
          <span className="max-w-[190px] truncate" title={primaryVenue.venue_name}>
            {primaryVenue.venue_name}
          </span>
        </div>
        <span className="mt-0.5 block text-[11px] text-neutral-400">
          {primaryVenue.city || '-'}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="group/venue relative inline-block text-left">
      {/* Main Collapsed Cell Display */}
      <div className="flex flex-col">
        {/* Row 1: Primary Venue Name (Clean, Uncrowded) */}
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
          <span className="max-w-[200px] truncate sm:max-w-[220px]" title={primaryVenue.venue_name}>
            {primaryVenue.venue_name}
          </span>
        </div>

        {/* Row 2: Sub-info with Interactive Multi-Venue Badge */}
        <div
          className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400"
          title={citySummary}
        >
          <span className="max-w-[130px] truncate sm:max-w-[150px]" title={uniqueCities.join(', ')}>
            {uniqueCities.slice(0, 2).join(', ')}
            {uniqueCities.length > 2 ? ` (+${uniqueCities.length - 2})` : ''}
          </span>

          <span className="text-neutral-600">•</span>

          {/* Interactive Pill Button for Multi-Venue */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 transition-colors hover:border-blue-400/60 hover:bg-blue-500/20 active:scale-95"
            title="Klik untuk melihat rincian seluruh bioskop penayangan"
          >
            <span className="whitespace-nowrap">+{extraCount} Bioskop</span>
            <ChevronDown
              className={cn(
                'h-2.5 w-2.5 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. Mobile Bottom Sheet Drawer (< 640px)
          Solusi anti-terpotong: Muncul dari bawah layar dengan backdrop gelap
          ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
          className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm duration-200 sm:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-in slide-in-from-bottom duration-250 flex max-h-[85vh] w-full flex-col rounded-t-3xl border-t border-neutral-800 bg-[#0B0E14] p-5 shadow-2xl"
          >
            {/* Handle Drag Bar */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-700/80" />

            {/* Mobile Sheet Header */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Daftar Bioskop Mitra</h4>
                  <p className="text-[11px] text-neutral-400">
                    {venues.length} Lokasi di {uniqueCities.length} Kota
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-neutral-800/80 p-1.5 text-neutral-400 hover:text-white"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Venues List Container (Smooth scroll on touch) */}
            <div className="max-h-[55vh] space-y-2.5 overflow-y-auto py-3 pr-1 text-left">
              {venues.map((venue, vIdx) => {
                const venueSchedules =
                  event.schedules?.filter((s) => s.event_venue_id === venue.id) || [];
                const sessionCount = venueSchedules.length;
                const uniqueStudios = Array.from(
                  new Set(venueSchedules.map((s) => s.studio_name || 'Studio 1'))
                );
                const partnerLabel = venue.venue_name.toLowerCase().includes('cgv')
                  ? 'CGV'
                  : venue.venue_name.toLowerCase().includes('cinepolis')
                    ? 'Cinepolis'
                    : venue.venue_name.toLowerCase().includes('xxi')
                      ? 'Cinema XXI'
                      : venue.cinema_partner || event.cinema_partner || null;

                return (
                  <div
                    key={venue.id || vIdx}
                    className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-white">{venue.venue_name}</div>
                      {partnerLabel && (
                        <span className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
                          {partnerLabel}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                      <span>{venue.city}</span>
                      {venue.venue_address && (
                        <span className="line-clamp-1 text-neutral-500">
                          • {venue.venue_address}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-neutral-800/60 pt-2 text-[11px]">
                      <span className="text-neutral-300">
                        🎟️ {sessionCount} Sesi Tayang{' '}
                        {uniqueStudios.length > 0 && `(${uniqueStudios.join(', ')})`}
                      </span>

                      {venue.google_maps_url && (
                        <a
                          href={venue.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-400"
                        >
                          <span>Buka Peta</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close Button at bottom */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-xl bg-neutral-800 py-2.5 text-xs font-bold text-white transition-colors hover:bg-neutral-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. Desktop Floating Popover (>= 640px)
          Tampil melayang ke atas (Upward) di layar desktop
          ───────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'absolute left-0 z-50 hidden w-72 rounded-xl border border-neutral-800/90 bg-[#0D111A]/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-200 sm:block sm:w-80',
          openUpward ? 'bottom-full mb-2.5 origin-bottom' : 'top-full mt-2.5 origin-top',
          isOpen
            ? 'pointer-events-auto visible scale-100 opacity-100'
            : 'pointer-events-none invisible scale-95 opacity-0 group-hover/venue:pointer-events-auto group-hover/venue:visible group-hover/venue:scale-100 group-hover/venue:opacity-100'
        )}
      >
        {/* Indicator Arrow */}
        <div
          className={cn(
            'absolute left-6 h-2 w-2 rotate-45 bg-[#0D111A]',
            openUpward
              ? '-bottom-1 border-b border-r border-neutral-800/90'
              : '-top-1 border-l border-t border-neutral-800/90'
          )}
        />

        {/* Popover Header */}
        <div className="mb-2.5 flex items-center justify-between border-b border-neutral-800/70 pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            <div>
              <h4 className="text-xs font-bold text-white">Daftar Bioskop Mitra</h4>
              <p className="text-[10px] text-neutral-400">
                {venues.length} Lokasi di {uniqueCities.length} Kota
              </p>
            </div>
          </div>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-extrabold text-blue-400">
            Multi-Venue
          </span>
        </div>

        {/* Venues List Container */}
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {venues.map((venue, vIdx) => {
            const venueSchedules =
              event.schedules?.filter((s) => s.event_venue_id === venue.id) || [];
            const sessionCount = venueSchedules.length;
            const uniqueStudios = Array.from(
              new Set(venueSchedules.map((s) => s.studio_name || 'Studio 1'))
            );
            const partnerLabel = venue.venue_name.toLowerCase().includes('cgv')
              ? 'CGV'
              : venue.venue_name.toLowerCase().includes('cinepolis')
                ? 'Cinepolis'
                : venue.venue_name.toLowerCase().includes('xxi')
                  ? 'Cinema XXI'
                  : venue.cinema_partner || event.cinema_partner || null;

            return (
              <div
                key={venue.id || vIdx}
                className="rounded-lg border border-neutral-800/60 bg-neutral-900/60 p-2.5 text-xs transition-colors hover:border-neutral-700 hover:bg-neutral-900/90"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-white">{venue.venue_name}</div>
                  {partnerLabel && (
                    <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-bold text-neutral-300">
                      {partnerLabel}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <MapPin className="h-3 w-3 shrink-0 text-neutral-500" />
                  <span className="truncate">{venue.city}</span>
                  {venue.venue_address && (
                    <span className="truncate text-neutral-500">• {venue.venue_address}</span>
                  )}
                </div>

                <div className="mt-1.5 flex items-center justify-between border-t border-neutral-800/40 pt-1.5 text-[10px]">
                  <span className="text-neutral-400">
                    🎟️ {sessionCount} Sesi{' '}
                    {uniqueStudios.length > 0 && `(${uniqueStudios.join(', ')})`}
                  </span>

                  {venue.google_maps_url && (
                    <a
                      href={venue.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 font-medium text-blue-400 hover:underline"
                    >
                      <span>Peta</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Popover Footer Hint */}
        <div className="mt-2.5 border-t border-neutral-800/50 pt-1.5 text-center text-[10px] text-neutral-500">
          Gunakan tombol Edit pada tabel untuk mengubah venue atau jam tayang.
        </div>
      </div>
    </div>
  );
}
