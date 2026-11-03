import React, { useEffect, useState, useMemo } from 'react';
import { X, BookOpen, Film, Users, MapPin, ExternalLink, Check } from 'lucide-react';
import type { EventDetail, EventVenueItem } from '../types';
import { formatMovieDuration, normalizeCastMember } from '../utils/formatters';

export interface EventDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetail;
  activeVenue?: EventVenueItem | null;
  onSelectVenue?: (venue: EventVenueItem) => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  isOpen,
  onClose,
  event,
  activeVenue,
  onSelectVenue,
}) => {
  // Daftar seluruh venue yang tersedia untuk event ini
  const allVenues = useMemo<EventVenueItem[]>(() => {
    if (event.venues && event.venues.length > 0) {
      return event.venues;
    }
    // Fallback single venue dari root event object
    return [
      {
        id: 0,
        event_id: event.id,
        venue_name: event.venue_name,
        cinema_partner: event.cinema_partner,
        venue_address: event.venue_address,
        city: event.city,
        google_maps_url: undefined,
      },
    ];
  }, [event]);

  // State pemilihan venue internal drawer (null = mengikuti activeVenue / venue pertama)
  const [internalVenueId, setInternalVenueId] = useState<number | null>(null);

  // Venue ID efektif yang sedang diinspeksi
  const effectiveVenueId = internalVenueId ?? activeVenue?.id ?? allVenues[0]?.id ?? 0;

  // Venue yang sedang aktif dilihat detailnya
  const currentVenue = useMemo(() => {
    return allVenues.find((v) => v.id === effectiveVenueId) || allVenues[0];
  }, [allVenues, effectiveVenueId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="animate-in fade-in fixed inset-0 z-50 flex justify-start bg-black/80 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="animate-in slide-in-from-left flex h-full w-full max-w-xl flex-col overflow-hidden border-r border-neutral-900 bg-neutral-950 text-white shadow-2xl transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div className="flex items-center justify-between border-b border-neutral-900 bg-neutral-950/90 px-6 py-3.5 backdrop-blur-md">
          <span className="text-xs font-semibold tracking-wide text-neutral-400">
            Detail Informasi Karya
          </span>

          <button
            type="button"
            onClick={onClose}
            className="group flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
            aria-label="Tutup drawer"
          >
            <span>Tutup</span>
            <X className="h-4 w-4 text-neutral-400 transition-colors group-hover:text-white" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="vercel-scrollbar flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Section 1: Informasi Spesifikasi Karya Film */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
              <Film className="h-3.5 w-3.5 text-neutral-400" />
              <span>Informasi Karya Film</span>
            </div>

            <div className="divide-y divide-neutral-900 rounded-xl border border-neutral-900 bg-neutral-900/50 text-xs">
              {/* Judul Karya */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-neutral-400">Judul Karya</span>
                <span id="drawer-title" className="font-bold text-white">
                  {event.title}
                </span>
              </div>

              {/* Klasifikasi Usia Sensor */}
              {event.age_rating && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-neutral-400">Klasifikasi Usia (Sensor LSF)</span>
                  <span className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-200">
                    {event.age_rating}
                  </span>
                </div>
              )}

              {/* Tahun Rilis */}
              {event.release_year && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-neutral-400">Tahun Rilis</span>
                  <span className="font-semibold text-neutral-200">{event.release_year}</span>
                </div>
              )}

              {/* Durasi Film */}
              {event.duration_minutes && event.duration_minutes > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-neutral-400">Durasi Pemutaran</span>
                  <span className="font-semibold text-white">
                    {formatMovieDuration(event.duration_minutes)}{' '}
                    <span className="font-normal text-neutral-400">
                      ({event.duration_minutes} Menit)
                    </span>
                  </span>
                </div>
              )}

              {/* Genre Film */}
              {event.genre && event.genre.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-neutral-400">Genre Film</span>
                  <span className="font-medium text-blue-400">
                    {Array.isArray(event.genre) ? event.genre.join(', ') : event.genre}
                  </span>
                </div>
              )}

              {/* Sutradara Film */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-neutral-400">Sutradara</span>
                <span className="font-semibold text-white">{event.director || 'Filmmaker'}</span>
              </div>

              {/* Mitra Jaringan Bioskop (jika ada) */}
              {event.cinema_partner && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-neutral-400">Mitra Jaringan</span>
                  <span className="font-semibold text-white">{event.cinema_partner}</span>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Sinopsis Lengkap */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
              <BookOpen className="h-3.5 w-3.5 text-neutral-400" />
              <span>Sinopsis Lengkap</span>
            </div>
            <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4 text-xs leading-relaxed text-neutral-300 sm:text-[13px]">
              <p className="whitespace-pre-line">
                {event.description ||
                  event.synopsis_short ||
                  'Sinopsis lengkap belum tersedia untuk event penayangan ini.'}
              </p>
            </div>
          </section>

          {/* Section 3: Lokasi Penayangan Venue */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                <span>Lokasi Penayangan Bioskop</span>
              </div>
              {allVenues.length > 1 && (
                <span className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                  {allVenues.length} Lokasi Tersedia
                </span>
              )}
            </div>

            {/* Segmented Venue Selector (jika multi-venue) */}
            {allVenues.length > 1 && (
              <div className="grid grid-cols-2 gap-2">
                {allVenues.map((v) => {
                  const isSelected = v.id === effectiveVenueId;
                  const isBookingActive = activeVenue?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setInternalVenueId(v.id);
                        if (onSelectVenue) onSelectVenue(v);
                      }}
                      className={`relative flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-600/15 text-white shadow-sm ring-1 ring-blue-500'
                          : 'border-neutral-800/80 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-1">
                        <span className="truncate text-xs font-bold">{v.venue_name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-blue-400" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                        <span>{v.city}</span>
                        {isBookingActive && (
                          <span className="py-0.2 rounded bg-blue-500/20 px-1 text-[9px] font-semibold text-blue-300">
                            Pilihan Anda
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Detail Venue yang Terpilih */}
            {currentVenue && (
              <div className="divide-y divide-neutral-900 rounded-xl border border-neutral-900 bg-neutral-900/50 text-xs">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-neutral-400">Nama Bioskop / Venue</span>
                  <span className="font-semibold text-white">{currentVenue.venue_name}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-neutral-400">Kota / Wilayah</span>
                  <span className="font-medium text-neutral-200">{currentVenue.city}</span>
                </div>
                {currentVenue.venue_address && (
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <span className="shrink-0 text-neutral-400">Alamat Lengkap</span>
                    <span className="text-right text-[11px] leading-relaxed text-neutral-300">
                      {currentVenue.venue_address}
                    </span>
                  </div>
                )}
                {currentVenue.google_maps_url && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-neutral-400">Navigasi Peta</span>
                    <a
                      href={currentVenue.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20 hover:text-blue-300"
                    >
                      <MapPin className="h-3 w-3" />
                      <span>Buka Google Maps</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section 4: Daftar Cast & Pemeran Utama */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
              <Users className="h-3.5 w-3.5 text-neutral-400" />
              <span>Daftar Cast & Pemeran</span>
            </div>
            {event.cast && event.cast.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {event.cast.map((item, idx) => {
                  const { actor, role } = normalizeCastMember(item);
                  if (!actor) return null;
                  return (
                    <div
                      key={`${actor}-${idx}`}
                      className="flex items-center gap-2.5 rounded-xl border border-neutral-900 bg-neutral-900/50 px-3.5 py-2.5 text-xs text-neutral-200 transition-colors hover:border-neutral-800"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neutral-800 text-[10px] font-bold text-neutral-300">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-200">{actor}</p>
                        {role && (
                          <p className="truncate text-[11px] text-neutral-400">
                            sebagai <span className="font-medium text-blue-400">{role}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-3.5 text-xs text-neutral-400">
                Informasi cast dan pemeran akan segera diperbarui.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export const EventRulesDrawer = EventDetailDrawer;
