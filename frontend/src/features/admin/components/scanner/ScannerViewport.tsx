import React from 'react';
import { Camera, SwitchCamera, Zap, ZapOff, AlertCircle } from 'lucide-react';

export interface ScannerViewportProps {
  viewportElementId: string;
  isScanning: boolean;
  isCooldown: boolean;
  cameraError: string | null;
  hasTorch: boolean;
  isTorchOn: boolean;
  canSwitchCamera: boolean;
  onToggleTorch: () => void;
  onSwitchCamera: () => void;
  onStartScanner: () => void;
}

export function ScannerViewport({
  viewportElementId,
  isScanning,
  isCooldown,
  cameraError,
  hasTorch,
  isTorchOn,
  canSwitchCamera,
  onToggleTorch,
  onSwitchCamera,
  onStartScanner,
}: ScannerViewportProps): React.JSX.Element {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-800 bg-black">
      {/* HTML5 QR Container */}
      <div id={viewportElementId} className="h-full w-full object-cover" />

      {/* Camera Off / Error State Overlay */}
      {(!isScanning || cameraError) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950 p-6 text-center">
          {cameraError ? (
            <>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-semibold text-white">Gagal Mengakses Kamera</h3>
              <p className="mt-1 max-w-[240px] text-[11px] text-neutral-400">{cameraError}</p>
              <button
                type="button"
                onClick={onStartScanner}
                className="mt-4 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-700"
              >
                Coba Lagi
              </button>
            </>
          ) : (
            <>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-semibold text-white">Kamera Standby</h3>
              <p className="mt-1 max-w-[240px] text-[11px] text-neutral-400">
                Arahkan lensa kamera ke QR Code e-tiket penonton
              </p>
              <button
                type="button"
                onClick={onStartScanner}
                className="mt-4 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-700"
              >
                Nyalakan Kamera
              </button>
            </>
          )}
        </div>
      )}

      {/* Minimalist Target Framing Overlay */}
      {isScanning && !cameraError && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
          <div className="relative flex h-52 w-52 items-center justify-center">
            {/* Sleek Corner Markers */}
            <div className="absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-neutral-400" />
            <div className="absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-neutral-400" />
            <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-neutral-400" />
            <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-neutral-400" />

            {/* Subtle Scanning Indicator */}
            {!isCooldown && (
              <div className="absolute left-0 right-0 top-1/2 h-px animate-pulse bg-white/20" />
            )}

            {isCooldown && (
              <span className="rounded-full border border-neutral-800 bg-neutral-950/90 px-3 py-1 font-mono text-[10px] text-neutral-400">
                Siap memindai...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Minimalist Controls Overlay (Top) */}
      {isScanning && !cameraError && (
        <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950/80 px-2.5 py-1 font-mono text-[10px] text-neutral-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span>LIVE</span>
          </div>

          <div className="flex items-center gap-1.5">
            {hasTorch && (
              <button
                type="button"
                onClick={onToggleTorch}
                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                  isTorchOn
                    ? 'border-white bg-white text-black'
                    : 'border-neutral-800 bg-neutral-950/80 text-neutral-300 hover:text-white'
                }`}
                aria-label="Toggle Flashlight"
              >
                {isTorchOn ? (
                  <Zap className="h-3.5 w-3.5 fill-black" />
                ) : (
                  <ZapOff className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {canSwitchCamera && (
              <button
                type="button"
                onClick={onSwitchCamera}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950/80 text-neutral-300 transition hover:text-white"
                aria-label="Switch Camera"
              >
                <SwitchCamera className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
