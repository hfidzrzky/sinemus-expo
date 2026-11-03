import React from 'react';
import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyMoviesStateProps {
  title?: string;
  description?: string;
  showSectionHeader?: boolean;
  className?: string;
}

export const EmptyMoviesState: React.FC<EmptyMoviesStateProps> = ({
  title = 'Film tidak tersedia',
  description = 'Saat ini belum ada film yang tersedia di katalog.',
  showSectionHeader = true,
  className,
}) => {
  return (
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      {showSectionHeader && (
        <div className="flex items-end justify-between px-1">
          <h3 className="font-display text-base font-bold tracking-tight text-white sm:text-2xl">
            Streaming Film
          </h3>
        </div>
      )}

      <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 text-center sm:p-8">
        <Film className="h-7 w-7 text-neutral-600 sm:h-8 sm:w-8" />
        <h4 className="mt-3 font-display text-sm font-semibold text-neutral-300 sm:text-base">
          {title}
        </h4>
        {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
      </div>
    </div>
  );
};
