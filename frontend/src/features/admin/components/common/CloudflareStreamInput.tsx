import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RotateCw,
  X,
  ExternalLink,
  Film,
} from 'lucide-react';
import { useStreamVideoMetadataQuery } from '../../api';
import { formatStreamDuration } from '../../utils';
import type { StreamVideoMetadata } from '../../types';

export interface CloudflareStreamInputProps {
  label: string;
  value: string | null;
  onChange: (val: string | null) => void;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  helperText?: string;
  onOpenPreview?: (uid: string) => void;
  className?: string;
  initialMetadata?: StreamVideoMetadata | null;
  savedDurationMinutes?: number | null;
}

export function CloudflareStreamInput({
  label,
  value,
  onChange,
  required = false,
  optional = false,
  placeholder = 'Contoh: e39b7a1f8c424df39c14ad539281a1bb',
  helperText,
  onOpenPreview,
  className = '',
  initialMetadata = null,
  savedDurationMinutes = null,
}: CloudflareStreamInputProps): React.JSX.Element {
  const [manualError, setManualError] = useState<string | null>(null);
  const [isUserEdited, setIsUserEdited] = useState(false);

  const rawValue = (value || '').trim();
  const is32Hex = /^[a-f0-9]{32}$/i.test(rawValue);

  // Jika input belum pernah disentuh/diubah oleh user dan memiliki 32-hex, anggap sebagai data tersimpan
  const isInitialSavedValue = Boolean(!isUserEdited && is32Hex);

  // Query deklaratif ke Cloudflare Stream API via TanStack Query (React 19 compliant, zero cascading renders)
  const {
    data: queryMetadata,
    isFetching,
    isError: isQueryError,
    error: queryError,
    refetch,
  } = useStreamVideoMetadataQuery(is32Hex ? rawValue : null);

  // Metadata efektif: prioritas hasil query terkini, fallback ke initialMetadata jika UID cocok
  const effectiveMetadata =
    queryMetadata && queryMetadata.uid.toLowerCase() === rawValue.toLowerCase()
      ? queryMetadata
      : initialMetadata && initialMetadata.uid.toLowerCase() === rawValue.toLowerCase()
        ? initialMetadata
        : null;

  // Tangani error dari API verifikasi backend
  const apiErrorMessage =
    isQueryError && is32Hex
      ? (queryError as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        queryError?.message ||
        'Video tidak ditemukan di akun Cloudflare Stream Sinemus. Pastikan UID sudah benar.'
      : null;

  const errorMessage = manualError || apiErrorMessage;

  // Handle perubahan input langsung di event handler
  const handleInputChange = (nextVal: string) => {
    setIsUserEdited(true);
    if (manualError) {
      setManualError(null);
    }
    const trimmed = nextVal.trim();
    onChange(trimmed || null);
  };

  const handleClear = () => {
    setIsUserEdited(true);
    setManualError(null);
    onChange(null);
  };

  const handleCheckClick = () => {
    if (!rawValue) {
      setManualError('Silakan masukkan 32-karakter UID video Cloudflare Stream.');
      return;
    }
    if (!is32Hex) {
      setManualError('Format UID tidak valid (harus 32 karakter heksadesimal 0-9, a-f).');
      return;
    }
    setManualError(null);
    void refetch();
  };

  const isPending = isFetching;
  const isVerified = Boolean(
    (effectiveMetadata && effectiveMetadata.is_ready) || (isInitialSavedValue && !errorMessage)
  );

  const displayUid = effectiveMetadata?.uid || rawValue;
  const thumbnailUrl =
    effectiveMetadata?.thumbnail_url ||
    (displayUid && is32Hex
      ? `https://videodelivery.net/${displayUid}/thumbnails/thumbnail.jpg?height=120`
      : null);

  // Komputasi durasi ramah pengguna (contoh: "10m" atau "2j 10m" atau "45d")
  const durationText = (() => {
    if (effectiveMetadata?.duration_seconds && effectiveMetadata.duration_seconds > 0) {
      return formatStreamDuration(effectiveMetadata.duration_seconds);
    }
    if (savedDurationMinutes && savedDurationMinutes > 0) {
      return formatStreamDuration(savedDurationMinutes, true);
    }
    return null;
  })();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label & Optional Flag */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-neutral-300">
          {label} {required && <span className="text-red-400">*</span>}
          {optional && <span className="font-normal text-neutral-500">(Opsional)</span>}
        </label>

        {/* Verification Status Pill */}
        {isPending && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Memverifikasi...
          </span>
        )}
        {!isPending && isVerified && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            {isInitialSavedValue && !effectiveMetadata
              ? 'Terverifikasi (Tersimpan)'
              : 'Terverifikasi di Cloudflare'}
          </span>
        )}
        {!isPending && errorMessage && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
            <AlertCircle className="h-3 w-3" />
            Belum Terverifikasi
          </span>
        )}
      </div>

      {/* Input Group */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          maxLength={32}
          className={`w-full rounded-xl border bg-[#0D111A] py-2.5 pl-3.5 pr-20 font-mono text-xs placeholder-neutral-500 transition-colors focus:outline-none ${
            isVerified
              ? 'border-emerald-500/50 text-emerald-300 focus:border-emerald-500'
              : errorMessage
                ? 'border-amber-500/50 text-neutral-200 focus:border-amber-500'
                : 'border-neutral-800 text-neutral-200 focus:border-blue-500'
          }`}
        />

        {/* Action Buttons inside Input */}
        <div className="absolute right-2 flex items-center gap-1">
          {rawValue && (
            <button
              type="button"
              onClick={handleClear}
              title="Hapus UID"
              className="rounded-lg p-1 text-neutral-500 transition hover:bg-neutral-800 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCheckClick}
            disabled={!is32Hex || isPending}
            title="Cek Verifikasi ke Cloudflare"
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] font-medium text-neutral-300 transition hover:bg-neutral-700 hover:text-white disabled:opacity-40"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
            ) : (
              <RotateCw className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">Cek</span>
          </button>
        </div>
      </div>

      {/* Helper Text */}
      {helperText && !errorMessage && !isVerified && (
        <p className="text-[11px] text-neutral-500">{helperText}</p>
      )}

      {/* Friendly Error Message Box */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/90">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-amber-300">{errorMessage}</p>
            <p className="text-[11px] text-neutral-400">
              Pastikan Anda menyalin UID dari{' '}
              <span className="font-mono text-neutral-300">
                Cloudflare Dashboard &gt; Stream &gt; Videos
              </span>{' '}
              dan video telah selesai diunggah.
            </p>
          </div>
        </div>
      )}

      {/* Verified Video Card Preview */}
      {isVerified && (
        <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-[#0B131E] p-3.5 transition-all">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Thumbnail + Video Info */}
            <div className="flex items-center gap-3">
              <div className="relative aspect-video w-20 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-700/60 bg-neutral-900">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Pratinjau Video"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-600">
                    <Film className="h-5 w-5" />
                  </div>
                )}
                {durationText && (
                  <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 font-mono text-[9px] text-white">
                    {durationText}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">
                    UID: {displayUid.slice(0, 10)}...{displayUid.slice(-6)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      effectiveMetadata?.status === 'ready' ||
                      (!effectiveMetadata && isInitialSavedValue)
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {effectiveMetadata?.status || 'READY'}
                  </span>
                  {isInitialSavedValue && !effectiveMetadata && (
                    <span className="rounded bg-neutral-800/80 px-1.5 py-0.5 text-[9px] font-medium text-neutral-400">
                      Tersimpan
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                  <span>Durasi: {durationText || 'Tersimpan di Database'}</span>
                  {effectiveMetadata?.meta?.width && effectiveMetadata?.meta?.height && (
                    <>
                      <span>•</span>
                      <span>
                        {effectiveMetadata.meta.width}x{effectiveMetadata.meta.height}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Action Button */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {onOpenPreview ? (
                <button
                  type="button"
                  onClick={() => onOpenPreview(displayUid)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition hover:bg-neutral-700 hover:text-white"
                >
                  <Play className="h-3 w-3 text-emerald-400" />
                  Uji Putar
                </button>
              ) : (
                <a
                  href={
                    effectiveMetadata?.preview_iframe_url ||
                    `https://iframe.videodelivery.net/${displayUid}`
                  }
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition hover:bg-neutral-700 hover:text-white"
                >
                  <ExternalLink className="h-3 w-3 text-neutral-400" />
                  Buka Player
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
