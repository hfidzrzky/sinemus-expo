import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetflixRowSliderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionClick?: () => void;
  children: React.ReactNode;
  className?: string;
  gapClassName?: string;
}

export const NetflixRowSlider: React.FC<NetflixRowSliderProps> = ({
  title,
  subtitle,
  actionText,
  onActionClick,
  children,
  className,
  gapClassName = 'gap-4 sm:gap-6',
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = rowRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, children]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;

    // Scroll by ~75% of viewport width
    const scrollAmount = el.clientWidth * 0.75;
    const targetScroll =
      direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;

    el.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  return (
    <section
      className={cn('group/slider relative space-y-2 sm:space-y-3', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Row Header */}
      <div className="flex items-end justify-between px-1">
        <div className="space-y-0.5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] font-normal text-neutral-400 sm:text-sm">{subtitle}</p>
          )}
        </div>

        {actionText && (
          <button
            type="button"
            onClick={onActionClick}
            className="group inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-semibold text-[#0066FF] transition-colors hover:bg-blue-500/10 hover:text-blue-400 sm:px-2 sm:py-1 sm:text-sm"
          >
            <span>{actionText}</span>
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1 sm:h-3.5 sm:w-3.5" />
          </button>
        )}
      </div>

      {/* Slider Viewport Container */}
      <div className="relative">
        {/* Left Chevron Button (Desktop Hover - Ramping persis referensi) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Geser ke kiri"
            className={cn(
              'absolute left-0 top-1/2 z-20 hidden h-16 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg bg-black/60 text-white shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-black/90 active:scale-95 sm:flex sm:h-20 sm:w-10',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={rowRef}
          className={cn(
            'vercel-scrollbar flex snap-x snap-mandatory items-stretch overflow-x-auto scroll-smooth px-1 py-2 focus:outline-none',
            gapClassName
          )}
          tabIndex={0}
          role="region"
          aria-label={title}
        >
          {children}
        </div>

        {/* Right Chevron Button (Desktop Hover - Ramping persis referensi) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Geser ke kanan"
            className={cn(
              'absolute right-0 top-1/2 z-20 hidden h-16 w-8 -translate-y-1/2 items-center justify-center rounded-l-lg bg-black/60 text-white shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-black/90 active:scale-95 sm:flex sm:h-20 sm:w-10',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </section>
  );
};
