import React, { useState } from 'react';
import { Eye, Film, Monitor, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { formatMovieDuration } from '@/features/events';
import type { AdminBannerItem, CreateBannerPayload } from '../../types';

export interface BannerLivePreviewProps {
  banner: Partial<AdminBannerItem> | Partial<CreateBannerPayload>;
  targetTitle?: string;
  className?: string;
}

export function BannerLivePreview({
  banner,
  targetTitle,
  className = '',
}: BannerLivePreviewProps): React.JSX.Element {
  const [previewMode, setPreviewMode] = useState<'hero' | 'card'>('hero');

  const isImageOnly = banner.display_mode === 'image_only';
  const isRichContent = banner.display_mode === 'rich_content';
  const isSpotlight = banner.display_mode === 'spotlight' || (!isImageOnly && !isRichContent);
  const showCinematicMetadata = isSpotlight;
  const imageUrl = banner.image_url?.trim() || '';
  const isActive = banner.is_active ?? true;

  const modeBadgeText = isSpotlight ? 'Sorotan' : isRichContent ? 'Rich Content' : 'Image Only';

  return (
    <div
      className={`sticky top-6 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5 shadow-xl transition-all ${className}`}
    >
      {/* Header: Title, Live Status & Dual Tab Mode Switcher */}
      <div className="space-y-3 border-b border-neutral-800/80 pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Eye className="h-4 w-4 text-blue-400" />
            Live Preview Penonton
          </div>
        </div>

        {/* Dual Tab Mode Switcher: Hero Showcase (16:9) vs Mobile Feed Card */}
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-800 bg-[#0D111A] p-1 text-xs">
          <button
            type="button"
            onClick={() => setPreviewMode('hero')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${
              previewMode === 'hero'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            Hero Showcase (16:9)
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('card')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${
              previewMode === 'card'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Mobile / Feed Card
          </button>
        </div>
      </div>

      {/* VIEW 1: Hero Showcase (16:9) Screen-Wide Carousel Simulation */}
      {previewMode === 'hero' && (
        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800 bg-[#0D111A] transition-all">
          <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={banner.title || 'Banner Preview'}
                className="h-full w-full object-cover transition-all"
              />
            ) : (
              /* Empty State Premium */
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-neutral-900/60 to-[#0A0D14] p-6 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-500">
                  <Film className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-neutral-300">
                  Visual Banner 16:9 Belum Diunggah
                </p>
                <p className="mt-1 max-w-[240px] text-[10px] text-neutral-500">
                  Unggah visual 16:9 pada formulir untuk melihat simulasi tampilan hero carousel.
                </p>
              </div>
            )}

            {/* Badges Overlay (Kiri Atas) */}
            <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
              <span
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold shadow ${
                  isSpotlight
                    ? 'bg-blue-600 text-white'
                    : isRichContent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-900/90 text-neutral-300 backdrop-blur-md'
                }`}
              >
                {isSpotlight && <Sparkles className="h-2.5 w-2.5" />}
                {modeBadgeText.toUpperCase()}
              </span>
              <span className="rounded-md bg-neutral-900/80 px-2 py-0.5 text-[9px] font-semibold text-neutral-300 backdrop-blur-md">
                Urutan #{banner.order_priority || 1}
              </span>
            </div>

            {/* Overlay Content (Rich Content & Spotlight) */}
            {!isImageOnly ? (
              <>
                <div className="pointer-events-none absolute inset-0 bg-black/40" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/80 to-transparent sm:h-36" />

                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
                  {/* Badge & Metadata Badges */}
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    {!isSpotlight && banner.badge_text && (
                      <span className="inline-flex items-center rounded-md border border-blue-400/30 bg-[#0066FF] px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-wider text-white">
                        {banner.badge_text}
                      </span>
                    )}

                    {showCinematicMetadata && banner.age_rating && (
                      <span className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white shadow-sm">
                        {banner.age_rating}
                      </span>
                    )}

                    {showCinematicMetadata && banner.release_year && (
                      <span className="font-mono text-[9px] font-semibold text-neutral-300">
                        {banner.release_year}
                      </span>
                    )}

                    {showCinematicMetadata && banner.duration_minutes && (
                      <>
                        {(banner.age_rating || banner.release_year) && (
                          <span className="text-neutral-500">•</span>
                        )}
                        <span className="font-mono text-[9px] font-semibold text-neutral-300">
                          {formatMovieDuration(banner.duration_minutes)}
                        </span>
                      </>
                    )}

                    {showCinematicMetadata && banner.genre && (
                      <>
                        {(banner.release_year || banner.duration_minutes) && (
                          <span className="text-neutral-500">•</span>
                        )}
                        <span className="font-mono text-[9px] font-semibold text-neutral-300">
                          {banner.genre}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="line-clamp-2 font-display text-sm font-extrabold tracking-tight text-white sm:text-base">
                    {banner.title || 'Judul Banner Promosi'}
                  </h3>

                  {banner.subtitle && (
                    <p className="mt-0.5 line-clamp-2 text-[10px] text-neutral-300 sm:text-xs">
                      {banner.subtitle}
                    </p>
                  )}

                  <div className="mt-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0066FF] px-3 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-blue-500/20">
                      <span>{banner.button_text || 'Jelajahi Sekarang'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute bottom-2.5 right-2.5 rounded-lg border border-neutral-800 bg-black/80 px-2 py-0.5 text-[9px] font-bold text-neutral-300 backdrop-blur-md">
                Mode Grafis Penuh (Image-Only)
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Mobile / Feed Card Mode */}
      {previewMode === 'card' && (
        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800 bg-[#0D111A] transition-all">
          {/* Card Media Container */}
          <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={banner.title || 'Banner Preview'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-neutral-900/60 to-[#0A0D14] p-5 text-center">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-500">
                  <Film className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-neutral-300">Visual Belum Diunggah</p>
                <p className="mt-1 text-[10px] text-neutral-500">
                  Simulasi tampilan kartu feed mobile.
                </p>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
              <span
                className={`rounded-md px-2 py-0.5 text-[9px] font-bold shadow ${
                  isSpotlight
                    ? 'bg-blue-600 text-white'
                    : isRichContent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-900/90 text-neutral-300 backdrop-blur-md'
                }`}
              >
                {modeBadgeText}
              </span>
              <span className="rounded-md bg-neutral-900/80 px-2 py-0.5 text-[9px] font-semibold text-neutral-300 backdrop-blur-md">
                #{banner.order_priority || 1}
              </span>
            </div>
          </div>

          {/* Card Meta Content */}
          <div className="space-y-2 p-3.5">
            <div className="flex items-center justify-between gap-2">
              {!isSpotlight && banner.badge_text ? (
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] font-extrabold uppercase text-blue-400">
                  {banner.badge_text}
                </span>
              ) : (
                <span className="text-[10px] text-neutral-500">
                  {isSpotlight ? 'Sorotan Karya' : 'Banner Beranda'}
                </span>
              )}

              {banner.link_type && (
                <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                  <ExternalLink className="h-3 w-3" />
                  {banner.link_type === 'event'
                    ? 'Event'
                    : banner.link_type === 'movie'
                      ? 'Film'
                      : 'URL'}
                </span>
              )}
            </div>

            <h4 className="line-clamp-1 font-display text-sm font-extrabold text-white">
              {banner.title || 'Judul Banner Promosi'}
            </h4>

            {showCinematicMetadata &&
              (banner.release_year ||
                banner.age_rating ||
                banner.genre ||
                banner.duration_minutes) && (
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400">
                  {banner.age_rating && (
                    <span className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono font-bold text-white shadow-sm">
                      {banner.age_rating}
                    </span>
                  )}
                  {banner.release_year && (
                    <>
                      {banner.age_rating && <span className="text-neutral-600">•</span>}
                      <span className="font-semibold text-neutral-300">{banner.release_year}</span>
                    </>
                  )}
                  {banner.duration_minutes && (
                    <>
                      {(banner.age_rating || banner.release_year) && (
                        <span className="text-neutral-600">•</span>
                      )}
                      <span className="font-semibold text-neutral-300">
                        {formatMovieDuration(banner.duration_minutes)}
                      </span>
                    </>
                  )}
                  {banner.genre && (
                    <>
                      {(banner.age_rating || banner.release_year || banner.duration_minutes) && (
                        <span className="text-neutral-600">•</span>
                      )}
                      <span className="font-medium text-blue-400">{banner.genre}</span>
                    </>
                  )}
                </div>
              )}

            <p className="line-clamp-2 text-[11px] text-neutral-400">
              {banner.subtitle ||
                (isImageOnly
                  ? 'Banner grafis penuh mandiri tanpa teks pendukung.'
                  : 'Deskripsi dan informasi promosi penayangan akan ditampilkan di sini.')}
            </p>

            <div className="flex items-center justify-between border-t border-neutral-800/80 pt-2 text-xs">
              <span className="truncate text-[10px] text-neutral-500">
                {targetTitle ? `Target: ${targetTitle}` : 'Tujuan Belum Dipilih'}
              </span>

              {!isImageOnly ? (
                <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-400">
                  {banner.button_text || 'Buka Tautan'}
                </span>
              ) : (
                <span className="rounded-lg bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">
                  Image Only
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Production Metadata Summary */}
      <div className="mt-4 space-y-1.5 rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-3 text-[11px] text-neutral-400">
        <p>
          <strong className="text-white">Mode Tampilan:</strong>{' '}
          {isSpotlight
            ? 'Sorotan (Sinematik Metadata)'
            : isRichContent
              ? 'Rich Content (Promo & CTA)'
              : 'Image Only (Grafis Penuh)'}
        </p>
        <p className="truncate">
          <strong className="text-white">Target Tautan:</strong>{' '}
          {banner.link_type === 'event'
            ? `Event Bioskop: ${targetTitle || (banner.event_id ? `#${banner.event_id}` : '-')}`
            : banner.link_type === 'movie'
              ? `Film VoD: ${targetTitle || (banner.movie_id ? `#${banner.movie_id}` : '-')}`
              : `URL Eksternal: ${banner.target_url || '-'}`}
        </p>
        {showCinematicMetadata && (
          <p>
            <strong className="text-white">Metadata Sinematik:</strong> {banner.age_rating || 'SU'}{' '}
            • {banner.release_year || '-'} • {banner.genre || '-'}
          </p>
        )}
        {!isImageOnly && (
          <p>
            <strong className="text-white">Tombol Aksi (CTA):</strong>{' '}
            {banner.button_text || 'Jelajahi Sekarang'}
          </p>
        )}
        <p>
          <strong className="text-white">Prioritas Carousel:</strong> Urutan #
          {banner.order_priority || 1}
        </p>
        <p>
          <strong className="text-white">Status Publikasi:</strong>{' '}
          <span className={isActive ? 'font-semibold text-emerald-400' : 'text-neutral-400'}>
            {isActive ? 'Aktif di Beranda Publik' : 'Draft Nonaktif'}
          </span>
        </p>
      </div>
    </div>
  );
}
