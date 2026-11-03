import React from 'react';
import type { SeekFeedbackState } from '../types';

export interface SinemusSeekIndicatorProps {
  seekFeedback: SeekFeedbackState | null;
}

export const SinemusSeekIndicator: React.FC<SinemusSeekIndicatorProps> = ({ seekFeedback }) => {
  if (!seekFeedback) return null;

  const isBackward = seekFeedback.direction === 'backward';

  return (
    <div
      key={seekFeedback.key}
      className={`pointer-events-none absolute top-1/2 z-40 flex -translate-y-1/2 items-center justify-center transition-all ${
        isBackward ? 'left-8 sm:left-16 md:left-24' : 'right-8 sm:right-16 md:right-24'
      }`}
    >
      {/* Minimalist, Sleek Cinema Seek Indicator (Tanpa background & border) */}
      <div className="animate-in fade-in zoom-in-95 flex items-center gap-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-all duration-150">
        {isBackward ? (
          <>
            <svg
              className="h-3.5 w-3.5 text-neutral-300"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <polygon points="11 19 2 12 11 5 11 19" />
              <polygon points="22 19 13 12 22 5 22 19" />
            </svg>
            <span className="select-none font-mono text-xs font-semibold tracking-wide text-neutral-100">
              -{seekFeedback.seconds}s
            </span>
          </>
        ) : (
          <>
            <span className="select-none font-mono text-xs font-semibold tracking-wide text-neutral-100">
              +{seekFeedback.seconds}s
            </span>
            <svg
              className="h-3.5 w-3.5 text-neutral-300"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <polygon points="13 19 22 12 13 5 13 19" />
              <polygon points="2 19 11 12 2 5 2 19" />
            </svg>
          </>
        )}
      </div>
    </div>
  );
};
