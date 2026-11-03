import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Ticket, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMovieDuration } from '@/features/events';
import type { BannerItem } from '../types';

interface HeroBannerCarouselProps {
  banners: BannerItem[];
  isLoading?: boolean;
  onSelectBanner?: (banner: BannerItem) => void;
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({
  banners,
  isLoading = false,
  onSelectBanner,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 30,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Synchronize active dot index
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

  // Auto-slide every 5 seconds, paused when hovering
  useEffect(() => {
    if (!emblaApi || isHovered || banners.length <= 1) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [emblaApi, isHovered, banners.length]);

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

  // Skeleton Loading State
  if (isLoading) {
    return (
      <div className="relative h-[380px] w-full animate-pulse overflow-hidden bg-neutral-900 sm:h-[460px] md:h-[540px] lg:h-[620px] xl:h-[680px]">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="w-full max-w-lg space-y-3 px-4 pb-9 sm:px-6 sm:pb-12 md:pb-16 md:pl-16 md:pr-6 lg:pl-20 lg:pr-8">
            <div className="h-7 w-52 rounded-xl bg-neutral-800 sm:h-9 sm:w-80" />
            <div className="h-4 w-72 rounded bg-neutral-800 sm:w-96" />
            <div className="h-9 w-36 rounded-xl bg-neutral-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div
      className="group relative w-full select-none overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Hero Showcase Banner"
    >
      {/* Embla Viewport */}
      <div ref={emblaRef} className="w-full overflow-hidden bg-black">
        <div className="flex">
          {banners.map((banner, index) => {
            const isImageOnly = banner.display_mode === 'image_only';
            const isRichContent = banner.display_mode === 'rich_content';
            const showCinematicMetadata = !isImageOnly && !isRichContent;

            return (
              <div
                key={banner.id}
                className="relative h-[380px] min-w-0 flex-[0_0_100%] overflow-hidden bg-neutral-950 sm:h-[460px] md:h-[540px] lg:h-[620px] xl:h-[680px]"
              >
                {/* Background Image (Tanpa zoom hover agar gambar banner tetap tenang & stabil) */}
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Sinemus Cinematic Banner'}
                  className="h-full w-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />

                {/* Scrim Overlays */}
                <div className="pointer-events-none absolute inset-0 z-10 bg-black/40" />
                {/* Bottom Shadow Overlay for seamless background transition */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-black via-black/80 to-transparent sm:h-48 md:h-56" />

                {/* Rich Content / Spotlight Mode Overlay */}
                {!isImageOnly ? (
                  /* Content Layer (Aligned with full-width layout) */
                  <div className="absolute inset-0 z-20 flex flex-col justify-end">
                    <div className="w-full px-4 pb-9 sm:px-6 sm:pb-12 md:pb-16 md:pl-16 md:pr-6 lg:pb-20 lg:pl-20 lg:pr-8">
                      <div className="max-w-xl space-y-2 sm:space-y-3 lg:max-w-2xl">
                        {/* Category Badge & Metadata Tags (Diatas Judul) */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isRichContent && banner.badge_text && (
                            <span className="inline-flex items-center rounded-md border border-blue-400/30 bg-[#0066FF] px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-white sm:rounded-lg sm:px-3 sm:py-1 sm:text-xs">
                              {banner.badge_text}
                            </span>
                          )}

                          {showCinematicMetadata && banner.age_rating && (
                            <span className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm">
                              {banner.age_rating}
                            </span>
                          )}

                          {showCinematicMetadata && banner.release_year && (
                            <span className="font-mono text-[11px] font-semibold text-neutral-200 sm:text-xs">
                              {banner.release_year}
                            </span>
                          )}

                          {showCinematicMetadata && banner.duration_minutes && (
                            <>
                              {(banner.age_rating || banner.release_year) && (
                                <span className="text-neutral-500">•</span>
                              )}
                              <span className="font-mono text-[11px] font-semibold text-neutral-200 sm:text-xs">
                                {formatMovieDuration(banner.duration_minutes)}
                              </span>
                            </>
                          )}

                          {showCinematicMetadata && banner.genre && (
                            <>
                              {(banner.release_year || banner.duration_minutes) && (
                                <span className="text-neutral-500">•</span>
                              )}
                              <span className="font-mono text-[11px] font-semibold text-neutral-300 sm:text-xs">
                                {banner.genre}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        {banner.title && (
                          <h2 className="line-clamp-1 font-display text-lg font-extrabold leading-snug tracking-tight text-white sm:line-clamp-2 sm:text-2xl md:text-3xl lg:text-4xl">
                            {banner.title}
                          </h2>
                        )}

                        {/* Subtitle / Synopsis */}
                        {banner.subtitle && (
                          <p className="line-clamp-1 max-w-sm text-xs leading-relaxed text-neutral-300 sm:line-clamp-3 sm:max-w-lg sm:text-sm md:text-base">
                            {banner.subtitle}
                          </p>
                        )}

                        {/* CTA Button */}
                        <div className="pt-1.5 sm:pt-2">
                          <button
                            type="button"
                            onClick={() => onSelectBanner?.(banner)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0066FF] px-3.5 py-2 text-xs font-bold tracking-wide text-white transition-all duration-200 hover:bg-[#0052D4] active:scale-95 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm"
                          >
                            <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>{banner.button_text || 'Beli Tiket Presale'}</span>
                            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Image-Only Mode Overlay & Click Action */
                  <button
                    type="button"
                    onClick={() => onSelectBanner?.(banner)}
                    className="absolute inset-0 z-20 h-full w-full cursor-pointer text-left opacity-0 transition-opacity duration-300 hover:opacity-100"
                    aria-label={banner.title || 'Buka tautan banner'}
                  >
                    <div className="flex h-full w-full items-end justify-end px-4 pb-8 sm:px-6 sm:pb-12 md:pb-16 md:pl-16 md:pr-6 lg:pl-20 lg:pr-8">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-black/90 px-4 py-2 text-xs font-semibold text-white">
                        <span>{banner.button_text || 'Lihat Detail'}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#0066FF]" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Left / Right Navigation Buttons (Desktop) */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Slide sebelumnya"
            className="absolute left-4 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-800 bg-black/90 text-white opacity-0 transition-all duration-200 hover:bg-neutral-800 hover:text-[#0066FF] active:scale-90 group-hover:opacity-100 sm:flex lg:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            aria-label="Slide berikutnya"
            className="absolute right-4 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-800 bg-black/90 text-white opacity-0 transition-all duration-200 hover:bg-neutral-800 hover:text-[#0066FF] active:scale-90 group-hover:opacity-100 sm:flex lg:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3.5 right-3.5 z-30 flex items-center gap-1 rounded-full border border-neutral-800 bg-black/90 p-1 sm:bottom-10 sm:right-6 sm:gap-1.5 sm:p-1.5 lg:right-8">
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
  );
};
