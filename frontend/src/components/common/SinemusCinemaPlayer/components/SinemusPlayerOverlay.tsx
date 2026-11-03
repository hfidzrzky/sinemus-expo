import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface SinemusPlayerOverlayProps {
  isBuffering: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

export const SinemusPlayerOverlay: React.FC<SinemusPlayerOverlayProps> = ({
  isBuffering,
  errorMessage,
  onRetry,
}) => {
  // 1. Error Overlay State
  if (errorMessage) {
    return (
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-red-900/40 bg-red-950/40 text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-white">Kendala Pemutaran Streaming</h4>
        <p className="mt-1 max-w-sm text-xs text-neutral-400">{errorMessage}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500 active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Muat Ulang Video</span>
        </button>
      </div>
    );
  }

  // 2. Buffering Spinner
  if (isBuffering) {
    return (
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/20">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent shadow-md" />
          <span className="font-mono text-[10px] font-semibold text-neutral-300">
            Memuat Buffer...
          </span>
        </div>
      </div>
    );
  }

  return null;
};
