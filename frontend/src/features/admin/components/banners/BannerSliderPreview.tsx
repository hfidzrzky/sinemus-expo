import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {
  Monitor,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  Ticket,
  Edit2,
  Layers,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMovieDuration } from '@/features/events';
import type { AdminBannerItem } from '../../types';

export interface BannerSliderPreviewProps {
  banners: AdminBannerItem[];
  onEditBanner?: (banner: AdminBannerItem) => void;
}

export function BannerSliderPreview({
  banners,
  onEditBanner,
}: BannerSliderPreviewProps): React.JSX.Element {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: banners.length > 1,
    duration: 25,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(banners.length > 1);
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [previewSize, setPreviewSize] = useState<'compact' | 'cinema'>('compact');

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    const frameId = requestAnimationFrame(onSelect);

    return () => {
      cancelAnimationFrame(frameId);
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play timer
  useEffect(() => {
    if (!emblaApi || !isAutoPlay || isHovered || banners.length <= 1) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4500);

    return () => clearInterval(interval);
  }, [emblaApi, isAutoPlay, isHovered, banners.length]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  if (!banners || banners.length === 0) {
    return (
      <div className="flex h-48 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 p-6 text-center">
        <Layers className="h-8 w-8 text-neutral-600" />
        <p className="mt-2 text-xs text-neutral-400">Belum ada slide banner yang tersedia.</p>
      </div>
    );
  }

  const currentBanner = banners[selectedIndex] || banners[0];

  return (
    <div className="space-y-3">
      {/* Top Controls & Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/60 pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300">
            <Monitor className="h-3.5 w-3.5 text-[#38BDF8]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Live Preview Hero Carousel</span>
            <span className="inline-flex items-center rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[10px] text-neutral-400">
              {previewSize === 'compact' ? 'Compact View' : 'Cinema View'}
            </span>
            <span className="inline-flex items-center rounded-md border border-blue-900/40 bg-blue-950/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-400">
              Slide {selectedIndex + 1} dari {banners.length}
            </span>
          </div>
        </div>

        {/* Carousel Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isCollapsed && banners.length > 1 && (
            <button
              type="button"
              onClick={() => setIsAutoPlay((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition',
                isAutoPlay
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
              )}
              title={isAutoPlay ? 'Jeda rotasi otomatis' : 'Mulai rotasi otomatis'}
            >
              {isAutoPlay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span className="hidden sm:inline">
                {isAutoPlay ? 'Auto-Slide Aktif' : 'Auto-Slide Mati'}
              </span>
            </button>
          )}

          {/* Prev & Next Controls */}
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={banners.length <= 1}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-40"
                title="Slide sebelumnya"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={banners.length <= 1}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-40"
                title="Slide berikutnya"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Size Mode Toggle */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setPreviewSize((prev) => (prev === 'compact' ? 'cinema' : 'compact'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              title={
                previewSize === 'compact'
                  ? 'Perbesar tampilan ke mode Cinema'
                  : 'Kecilkan ke mode Ringkas'
              }
            >
              {previewSize === 'compact' ? (
                <>
                  <Maximize2 className="h-3 w-3 text-neutral-400" />
                  <span className="hidden md:inline">Mode Cinema</span>
                </>
              ) : (
                <>
                  <Minimize2 className="h-3 w-3 text-neutral-400" />
                  <span className="hidden md:inline">Mode Ringkas</span>
                </>
              )}
            </button>
          )}

          {onEditBanner && currentBanner && (
            <button
              type="button"
              onClick={() => onEditBanner(currentBanner)}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-[11px] font-semibold text-neutral-200 transition hover:bg-neutral-700"
              title="Edit slide yang sedang ditampilkan"
            >
              <Edit2 className="h-3 w-3" />
              <span>Edit Slide</span>
            </button>
          )}

          {/* Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-[11px] font-semibold text-neutral-400 transition hover:border-neutral-700 hover:text-white"
            title={isCollapsed ? 'Buka panel pratinjau' : 'Sembunyikan panel pratinjau'}
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Buka Pratinjau</span>
              </>
            ) : (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Sembunyikan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Preview Container (Rendered when not collapsed) */}
      {!isCollapsed && (
        <>
          {/* Embla Viewport */}
          <div
            className="group relative select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              ref={emblaRef}
              className={cn(
                'relative w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 transition-all duration-300',
                previewSize === 'compact'
                  ? 'h-[220px] sm:h-[260px] md:h-[290px] lg:h-[320px]'
                  : 'h-[280px] sm:h-[340px] md:h-[380px] lg:h-[420px]'
              )}
            >
              <div className="flex h-full">
                {banners.map((banner, index) => {
                  const isImageOnly = banner.display_mode === 'image_only';
                  const isRichContent = banner.display_mode === 'rich_content';
                  const showCinematicMetadata = !isImageOnly && !isRichContent;
                  const imageUrl =
                    banner.image_url ||
                    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80';

                  return (
                    <div
                      key={banner.id}
                      className="relative h-full min-w-0 flex-[0_0_100%] overflow-hidden bg-neutral-950"
                    >
                      {/* Background Image (Tanpa zoom hover) */}
                      <img
                        src={imageUrl}
                        alt={banner.title || `Slide #${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80';
                        }}
                      />

                      {/* Scrim Overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-black/40" />
                      {/* Bottom Shadow Overlay */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-black via-black/80 to-transparent sm:h-36" />

                      {/* Top info badge per slide */}
                      <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 sm:left-4 sm:top-4">
                        <span className="rounded-lg border border-neutral-800 bg-black/80 px-2.5 py-1 font-mono text-[10px] font-bold text-white">
                          #{index + 1} • Urutan {banner.order_priority}
                        </span>
                        <span
                          className={cn(
                            'rounded-lg border px-2 py-0.5 text-[10px] font-semibold',
                            banner.is_active
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          )}
                        >
                          {banner.is_active ? 'Aktif' : 'Draft'}
                        </span>
                      </div>

                      {/* Content Overlay */}
                      {!isImageOnly ? (
                        <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-5 md:p-6">
                          <div className="max-w-xl space-y-1 sm:space-y-1.5">
                            {/* Badge & Metadata Badges (Diatas Judul) */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              {isRichContent && banner.badge_text && (
                                <span className="inline-flex items-center rounded-md border border-blue-400/30 bg-[#0066FF] px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-wider text-white sm:px-2.5 sm:text-[10px]">
                                  {banner.badge_text}
                                </span>
                              )}

                              {showCinematicMetadata && banner.age_rating && (
                                <span className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white shadow-sm">
                                  {banner.age_rating}
                                </span>
                              )}

                              {showCinematicMetadata && banner.release_year && (
                                <span className="font-mono text-[10px] font-semibold text-neutral-300">
                                  {banner.release_year}
                                </span>
                              )}

                              {showCinematicMetadata && banner.duration_minutes && (
                                <>
                                  {(banner.age_rating || banner.release_year) && (
                                    <span className="text-neutral-500">•</span>
                                  )}
                                  <span className="font-mono text-[10px] font-semibold text-neutral-300">
                                    {formatMovieDuration(banner.duration_minutes)}
                                  </span>
                                </>
                              )}

                              {showCinematicMetadata && banner.genre && (
                                <>
                                  {(banner.release_year || banner.duration_minutes) && (
                                    <span className="text-neutral-500">•</span>
                                  )}
                                  <span className="font-mono text-[10px] font-semibold text-neutral-300">
                                    {banner.genre}
                                  </span>
                                </>
                              )}
                            </div>

                            <h3 className="line-clamp-2 font-display text-sm font-extrabold tracking-tight text-white sm:text-lg md:text-xl lg:text-2xl">
                              {banner.title || 'Judul Banner Promosi'}
                            </h3>

                            {banner.subtitle && (
                              <p className="line-clamp-2 max-w-lg text-[11px] leading-relaxed text-neutral-200 sm:text-xs">
                                {banner.subtitle}
                              </p>
                            )}

                            <div className="pt-1.5">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0066FF] px-3 py-1 text-[11px] font-bold text-white shadow-md sm:text-xs">
                                <Ticket className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span>{banner.button_text || 'Jelajahi Sekarang'}</span>
                                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute bottom-3 right-3 z-10 rounded-lg bg-black/70 px-2.5 py-1 text-[10px] font-bold text-neutral-300 backdrop-blur-md">
                          Mode Grafis Penuh (Image-Only)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hover Navigation Floating Buttons */}
            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={scrollPrev}
                  aria-label="Slide sebelumnya"
                  className="absolute left-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-700/80 bg-black/90 text-white opacity-0 transition-all duration-200 hover:bg-neutral-800 hover:text-[#0066FF] group-hover:opacity-100 sm:left-4 sm:h-10 sm:w-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={scrollNext}
                  aria-label="Slide berikutnya"
                  className="absolute right-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-700/80 bg-black/90 text-white opacity-0 transition-all duration-200 hover:bg-neutral-800 hover:text-[#0066FF] group-hover:opacity-100 sm:right-4 sm:h-10 sm:w-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1 rounded-full border border-neutral-800 bg-black/90 p-1 sm:bottom-4 sm:right-4 sm:gap-1.5 sm:p-1.5">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => scrollTo(idx)}
                      aria-label={`Pindah ke slide ${idx + 1}`}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300 sm:h-2',
                        selectedIndex === idx
                          ? 'w-5 bg-[#0066FF] sm:w-6'
                          : 'w-1.5 bg-neutral-600 hover:bg-neutral-400 sm:w-2'
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mini Thumbnails / Slide Selector Pills */}
          {banners.length > 1 && (
            <div className="vercel-scrollbar flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              {banners.map((banner, idx) => {
                const isCurrent = selectedIndex === idx;
                return (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => scrollTo(idx)}
                    className={cn(
                      'group flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition',
                      isCurrent
                        ? 'border-[#0066FF] bg-[#0066FF]/10 text-white shadow-sm'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold',
                        isCurrent ? 'bg-[#0066FF] text-white' : 'bg-neutral-800 text-neutral-400'
                      )}
                    >
                      {idx + 1}
                    </div>
                    <div className="max-w-[140px] truncate text-xs font-semibold sm:max-w-[200px]">
                      {banner.title || `Slide #${idx + 1}`}
                    </div>
                    {banner.is_active && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
