import React, { useState } from 'react';
import { MapPin, Eye, Film, Sparkles, ImagePlus } from 'lucide-react';
import { formatMovieDuration, formatCastSummary } from '@/features/events';
import type { CreateEventPayload } from '../../types';

export interface EventLivePreviewCardProps {
  formData: CreateEventPayload;
}

export function EventLivePreviewCard({ formData }: EventLivePreviewCardProps): React.JSX.Element {
  const [previewMode, setPreviewMode] = useState<'banner' | 'poster'>('banner');

  // Extract all schedules from venues or fallback to formData.schedules
  const allSchedules = React.useMemo(() => {
    if (formData.venues && formData.venues.length > 0) {
      const list = [];
      for (const v of formData.venues) {
        if (v.schedules) {
          list.push(...v.schedules);
        }
      }
      return list;
    }
    return formData.schedules || [];
  }, [formData.venues, formData.schedules]);

  const lowestPrice =
    allSchedules.length > 0 ? Math.min(...allSchedules.map((s) => s.ticket_price)) : 50000;

  const totalVenuesCount = formData.venues?.length || (formData.venue_name ? 1 : 0);
  const venueLocationSummary = React.useMemo(() => {
    if (formData.venues && formData.venues.length > 0) {
      const cities = Array.from(new Set(formData.venues.map((v) => v.city).filter(Boolean)));
      if (formData.venues.length === 1) {
        return `${formData.venues[0].venue_name || 'Bioskop'}, ${formData.venues[0].city || 'Kota'}`;
      }
      return `${formData.venues.length} Bioskop (${cities.join(', ') || 'Multi-Kota'})`;
    }
    return `${formData.venue_name || 'Venue Bioskop'}, ${formData.city || 'Kota'}`;
  }, [formData.venues, formData.venue_name, formData.city]);

  return (
    <div className="sticky top-6 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5 shadow-xl">
      {/* Header: Title, Live Status & Tab Switcher */}
      <div className="space-y-3 border-b border-neutral-800/80 pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Eye className="h-4 w-4 text-blue-400" />
            Live Preview Penonton
          </div>
        </div>

        {/* Dual Tab Mode Switcher: Banner vs Poster */}
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-800 bg-[#0D111A] p-1 text-xs">
          <button
            type="button"
            onClick={() => setPreviewMode('banner')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${
              previewMode === 'banner'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            Banner Card (16:9)
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('poster')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${
              previewMode === 'poster'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Poster Card (2:3)
          </button>
        </div>
      </div>

      {/* VIEW 1: Banner Landscape (16:9) Mode */}
      {previewMode === 'banner' && (
        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800 bg-[#0D111A] transition-all">
          {/* Backdrop Visual Container */}
          <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
            {formData.backdrop_url ? (
              <img
                src={formData.backdrop_url}
                alt={formData.title || 'Event Backdrop'}
                className="h-full w-full object-cover transition-all"
              />
            ) : (
              /* Empty State Premium */
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-neutral-900/60 to-[#0A0D14] p-6 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-500">
                  <Film className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-neutral-300">
                  Backdrop Landscape Belum Diunggah
                </p>
                <p className="mt-1 max-w-[240px] text-[10px] text-neutral-500">
                  Unggah visual latar 16:9 di tab formulir untuk melihat kartu feed beranda
                  penonton.
                </p>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
              {formData.event_type === 'presale_cinema' ? (
                <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                  {formData.cinema_partner || 'Presale Cinema'}
                </span>
              ) : (
                <span className="rounded-md bg-neutral-900/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-300 backdrop-blur-md">
                  Reguler
                </span>
              )}
              {formData.is_featured && (
                <span className="flex items-center gap-1 whitespace-nowrap rounded-md border border-white/20 bg-black/75 px-2 py-0.5 text-[10px] font-medium tracking-widest text-white backdrop-blur-md">
                  <Sparkles className="h-2.5 w-2.5 shrink-0 text-amber-400" />
                  SOROTAN
                </span>
              )}
            </div>
          </div>

          {/* Card Meta Content */}
          <div className="space-y-2 p-3.5">
            <h4 className="line-clamp-1 font-display text-sm font-extrabold text-white">
              {formData.title || 'Judul Event Penayangan'}
            </h4>

            {/* Film Metadata Row */}
            {(formData.release_year ||
              formData.duration_minutes ||
              (formData.genre && formData.genre.length > 0) ||
              formData.age_rating) && (
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400">
                {formData.age_rating && (
                  <span className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white shadow-sm">
                    {formData.age_rating}
                  </span>
                )}
                {formData.release_year && (
                  <>
                    {formData.age_rating && <span className="text-neutral-600">•</span>}
                    <span className="font-semibold text-neutral-300">{formData.release_year}</span>
                  </>
                )}
                {formData.duration_minutes ? (
                  <>
                    {(formData.age_rating || formData.release_year) && (
                      <span className="text-neutral-600">•</span>
                    )}
                    <span className="font-medium text-neutral-300">
                      {formatMovieDuration(formData.duration_minutes)}
                    </span>
                  </>
                ) : null}
                {formData.genre && formData.genre.length > 0 && (
                  <>
                    {(formData.age_rating ||
                      formData.release_year ||
                      formData.duration_minutes) && <span className="text-neutral-600">•</span>}
                    <span className="font-medium text-blue-400">
                      {formData.genre.slice(0, 2).join(', ')}
                    </span>
                  </>
                )}
              </div>
            )}

            <p className="line-clamp-2 text-[11px] text-neutral-400">
              {formData.synopsis_short ||
                'Sinopsis ringkas film penayangan akan ditampilkan di sini untuk penonton.'}
            </p>

            <div className="flex items-center gap-1 text-[11px] text-neutral-300">
              <MapPin className="h-3 w-3 flex-shrink-0 text-neutral-500" />
              <span className="truncate">{venueLocationSummary}</span>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800/80 pt-2 text-xs">
              <div>
                <span className="block text-[10px] text-neutral-500">Mulai Dari</span>
                <strong className="font-display font-extrabold text-white">
                  Rp {lowestPrice.toLocaleString('id-ID')}
                </strong>
              </div>

              <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-400">
                {formData.seating_type === 'assigned_seating' ? 'Pilih Kursi' : 'Beli Tiket'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Poster Portrait (2:3) Cinema Showcase Mode */}
      {previewMode === 'poster' && (
        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800 bg-[#0D111A] p-4 transition-all">
          <div className="flex flex-col items-center">
            {/* Poster Frame (2:3) */}
            <div className="relative aspect-[2/3] w-48 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
              {formData.poster_url ? (
                <img
                  src={formData.poster_url}
                  alt={formData.title || 'Poster Film'}
                  className="h-full w-full object-cover"
                />
              ) : (
                /* Empty State Poster */
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-neutral-900/60 to-[#0A0D14] p-4 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-500">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-neutral-300">
                    Poster Portrait Belum Diunggah
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-500">
                    Rasio 2:3 untuk etalase katalog & tiket.
                  </p>
                </div>
              )}

              {/* Badge Overlay */}
              <div className="absolute left-2 top-2">
                <span className="rounded-md bg-blue-600/90 px-2 py-0.5 text-[9px] font-semibold text-white shadow backdrop-blur-md">
                  {formData.cinema_partner || 'Bioskop'}
                </span>
              </div>
            </div>

            {/* Poster Card Caption Details */}
            <div className="mt-4 w-full space-y-1.5 text-center">
              <h4 className="font-display text-sm font-extrabold text-white">
                {formData.title || 'Judul Film Penayangan'}
              </h4>

              {/* Film Metadata Row */}
              {(formData.release_year ||
                formData.duration_minutes ||
                (formData.genre && formData.genre.length > 0) ||
                formData.age_rating) && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-neutral-400">
                  {formData.age_rating && (
                    <span className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white shadow-sm">
                      {formData.age_rating}
                    </span>
                  )}
                  {formData.release_year && (
                    <>
                      {formData.age_rating && <span className="text-neutral-600">•</span>}
                      <span className="font-semibold text-neutral-300">
                        {formData.release_year}
                      </span>
                    </>
                  )}
                  {formData.duration_minutes ? (
                    <>
                      {(formData.age_rating || formData.release_year) && (
                        <span className="text-neutral-600">•</span>
                      )}
                      <span className="font-medium text-neutral-300">
                        {formatMovieDuration(formData.duration_minutes)}
                      </span>
                    </>
                  ) : null}
                  {formData.genre && formData.genre.length > 0 && (
                    <>
                      {(formData.age_rating ||
                        formData.release_year ||
                        formData.duration_minutes) && <span className="text-neutral-600">•</span>}
                      <span className="font-medium text-blue-400">{formData.genre[0]}</span>
                    </>
                  )}
                </div>
              )}

              <p className="text-[11px] text-neutral-400">
                Sutradara: <span className="text-neutral-200">{formData.director || '-'}</span>
              </p>
              <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-400">
                <MapPin className="h-3 w-3 text-neutral-500" />
                <span>{venueLocationSummary}</span>
              </div>
              <div className="pt-2">
                <span className="inline-block rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20">
                  {formData.seating_type === 'assigned_seating'
                    ? 'Pilih Kursi Presale'
                    : 'Beli Tiket'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Production Metadata Summary */}
      <div className="mt-4 space-y-1 rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-3 text-[11px] text-neutral-400">
        <p>
          <strong className="text-white">Lokasi Bioskop:</strong> {totalVenuesCount} Bioskop
        </p>
        <p>
          <strong className="text-white">Total Sesi Tayang:</strong> {allSchedules.length} Sesi
        </p>
        <p>
          <strong className="text-white">Spesifikasi Film:</strong>{' '}
          {formatMovieDuration(formData.duration_minutes) || '0m'} ({formData.duration_minutes || 0}{' '}
          Menit) • {formData.age_rating || 'SU'} • {formData.release_year || '-'}
        </p>
        <p className="truncate">
          <strong className="text-white">Genre:</strong>{' '}
          {formData.genre && formData.genre.length > 0 ? formData.genre.join(', ') : '-'}
        </p>
        <p>
          <strong className="text-white">Sutradara:</strong> {formData.director || '-'}
        </p>
        <p className="truncate">
          <strong className="text-white">Pemeran:</strong> {formatCastSummary(formData.cast)}
        </p>
      </div>
    </div>
  );
}
