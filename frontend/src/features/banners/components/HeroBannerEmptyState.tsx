import React from 'react';
import { Ticket, Film, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HeroBannerEmptyStateProps {
  onNavigate?: (path: string) => void;
  className?: string;
}

export const HeroBannerEmptyState: React.FC<HeroBannerEmptyStateProps> = ({
  onNavigate,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative min-h-[420px] w-full select-none overflow-hidden bg-neutral-950 sm:min-h-[480px] md:min-h-[540px] lg:min-h-[600px]',
        className
      )}
      role="banner"
      aria-label="Sinemus Cinematic Showcase"
    >
      {/* 1. Ambient Background Effects & Cinema Gradients */}
      <div
        className="pointer-events-none absolute -top-24 right-1/4 h-[350px] w-[500px] rounded-full bg-[#0066FF]/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-6 top-1/3 h-[250px] w-[350px] rounded-full bg-blue-600/10 blur-[100px]"
        aria-hidden="true"
      />

      {/* Subtle Cinema Grid Accent */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
        aria-hidden="true"
      />

      {/* Scrim Overlays */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/85 to-transparent sm:h-44"
        aria-hidden="true"
      />

      {/* 2. Main Hero Content (Safe Padding for Navbar Top Clearance) */}
      <div className="relative z-20 flex h-full min-h-[420px] flex-col justify-end px-4 pb-8 pt-24 sm:min-h-[480px] sm:px-6 sm:pb-12 sm:pt-28 md:min-h-[540px] md:pb-16 md:pl-16 md:pr-6 lg:min-h-[600px] lg:pb-20 lg:pl-20 lg:pr-8">
        <div className="max-w-2xl space-y-4 sm:space-y-5">
          {/* Subtle Tag Typography (Tanpa background/border badge) */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-mono text-[11px] font-semibold tracking-wider text-blue-400 sm:text-xs">
              Sinemus Screen • Campus Software Expo Edition
            </span>
          </div>

          {/* Headline Typography */}
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-4xl md:text-5xl lg:text-5xl lg:leading-[1.15]">
              Ruang Temu Karya Sinema &amp; Penonton Layar Lebar
            </h1>
            <p className="max-w-xl text-xs font-normal leading-relaxed text-neutral-300 sm:text-sm sm:leading-relaxed md:text-base">
              Kurasi penayangan bioskop alternatif, reservasi kursi studio eksklusif kampus, dan
              koleksi streaming VoD legal karya sineas independen Indonesia.
            </p>
          </div>

          {/* CTA Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1 sm:pt-2">
            <button
              type="button"
              onClick={() => onNavigate?.('/events')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:bg-blue-600 hover:shadow-blue-500/40 active:scale-95 sm:px-5 sm:py-3 sm:text-sm"
            >
              <Ticket className="h-4 w-4" />
              <span>Jelajahi Jadwal Screening</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('/movies')}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700/80 bg-neutral-900/80 px-4 py-2.5 text-xs font-semibold text-neutral-200 backdrop-blur-md transition-all duration-200 hover:border-neutral-500 hover:bg-neutral-800 hover:text-white active:scale-95 sm:px-5 sm:py-3 sm:text-sm"
            >
              <Film className="h-4 w-4 text-blue-400" />
              <span>Katalog Streaming VoD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
