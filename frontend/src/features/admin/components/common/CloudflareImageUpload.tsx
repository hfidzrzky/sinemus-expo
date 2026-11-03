import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import {
  ImagePlus,
  Loader2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Link as LinkIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCreateImageDirectUploadMutation, useDeleteCloudflareImageMutation } from '../../api';

export interface CloudflareImageUploadProps {
  label: string;
  aspectRatio: '2:3' | '16:9';
  value: string | null;
  onChange: (url: string | null) => void;
  required?: boolean;
  optional?: boolean;
  recommendedDimensions?: string;
  maxSizeMB?: number;
  assetType?: string;
  helperText?: string;
  className?: string;
}

export function CloudflareImageUpload({
  label,
  aspectRatio,
  value,
  onChange,
  required = false,
  optional = false,
  recommendedDimensions = aspectRatio === '2:3' ? '600 × 900 px' : '1920 × 1080 px',
  maxSizeMB = 5,
  assetType = 'event_asset',
  helperText,
  className = '',
}: CloudflareImageUploadProps): React.JSX.Element {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showManualInput, setShowManualInput] = useState(false);
  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null);
  const [optimisticPreview, setOptimisticPreview] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const createUploadMutation = useCreateImageDirectUploadMutation();
  const deleteMutation = useDeleteCloudflareImageMutation();

  const isPoster = aspectRatio === '2:3';

  // Derived state: gambar mengalami error jika URL yang gagal cocok dengan URL aktif saat ini
  const activeImageUrl = optimisticPreview || value;
  const isImageBroken = Boolean(activeImageUrl && failedUrl === activeImageUrl);

  // Extract Cloudflare Image ID dari URL jika formatnya standard imagedelivery.net
  const extractCloudflareImageId = (url: string | null): string | null => {
    if (!url) return null;
    const match = url.match(/imagedelivery\.net\/[^/]+\/([^/]+)/);
    return match ? match[1] : null;
  };

  // Handler Hapus Berkas (Anti-Orphan Garbage)
  const handleDelete = useCallback(async () => {
    const currentId = lastUploadedId || extractCloudflareImageId(value);

    // Jika gambar berasal dari unggahan Cloudflare, bersihkan dari server
    if (currentId) {
      deleteMutation.mutate(currentId, {
        onError: () => {
          // Tetap lanjutkan pembersihan lokal walau API delete gagal
        },
      });
    }

    if (optimisticPreview) {
      URL.revokeObjectURL(optimisticPreview);
      setOptimisticPreview(null);
    }

    setFailedUrl(null);
    onChange(null);
    setLastUploadedId(null);
    toast.info(`Aset ${isPoster ? 'poster' : 'banner'} telah dihapus.`);
  }, [value, lastUploadedId, isPoster, onChange, deleteMutation, optimisticPreview]);

  // Handler Drop File & Direct Creator Upload
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Ukuran file melebihi batas maksimal ${maxSizeMB} MB.`);
        return;
      }

      // Optimistic Instant Preview: Tampilkan langsung di browser tanpa lag (0ms)
      const previewUrl = URL.createObjectURL(file);
      setOptimisticPreview(previewUrl);

      setIsUploading(true);
      setUploadProgress(10);

      try {
        // 1. Minta One-Time Upload URL ke Backend Laravel
        const session = await createUploadMutation.mutateAsync({
          asset_type: assetType,
        });

        setUploadProgress(35);

        // 2. Upload file binary langsung ke Cloudflare Images API (Bypass backend server)
        const formData = new FormData();
        formData.append('file', file);

        await axios.post(session.upload_url, formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 55) / progressEvent.total) + 35;
              setUploadProgress(percent);
            }
          },
        });

        setUploadProgress(100);

        // Jika sebelumnya ada gambar yang diunggah pada sesi ini, bersihkan yang lama
        if (lastUploadedId && lastUploadedId !== session.image_id) {
          deleteMutation.mutate(lastUploadedId);
        }

        setLastUploadedId(session.image_id);

        // Format delivery URL spesifik varian jika perlu
        const finalUrl = session.delivery_url;
        onChange(finalUrl);

        // Bersihkan blob URL setelah CDN URL resmi terpasang
        URL.revokeObjectURL(previewUrl);
        setOptimisticPreview(null);

        toast.success(
          `Aset ${isPoster ? 'poster' : 'banner'} berhasil diunggah ke Cloudflare Images!`
        );
      } catch (err) {
        console.error('Direct Creator Upload failed:', err);
        // Reset optimistic preview jika unggah gagal
        URL.revokeObjectURL(previewUrl);
        setOptimisticPreview(null);
        toast.error('Gagal mengunggah berkas ke Cloudflare Images. Periksa koneksi internet Anda.');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [maxSizeMB, assetType, createUploadMutation, deleteMutation, lastUploadedId, isPoster, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label & Header */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-neutral-300">
          {label} {required && <span className="text-red-400">*</span>}
          {optional && <span className="font-normal text-neutral-500">(Opsional)</span>}
        </label>

        {/* Manual URL Input Toggle */}
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 transition hover:text-white"
        >
          <LinkIcon className="h-3 w-3" />
          {showManualInput ? 'Tutup Input Manual' : 'Input URL Manual'}
        </button>
      </div>

      {/* Manual Input Fallback (Bagi admin yang sudah memiliki URL CDN) */}
      {showManualInput && (
        <div className="rounded-xl border border-neutral-800 bg-[#0B0E14] p-3 text-xs">
          <label className="block text-[11px] text-neutral-400">
            Tautkan URL Eksternal / Cloudflare Delivery Langsung:
          </label>
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value.trim() || null)}
            placeholder="https://imagedelivery.net/.../public"
            className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-[#0D111A] px-3 py-2 font-mono text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Main Upload Dropzone / Micro Preview Container */}
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-500/10'
            : value
              ? 'border-neutral-800 bg-[#0A0D14]'
              : 'border-dashed border-neutral-800/90 bg-[#0B0F19] hover:border-neutral-700'
        }`}
      >
        {/* State 1: Active Image (CDN Value OR Optimistic Preview) */}
        {value || optimisticPreview ? (
          <div className="group relative flex flex-col items-center justify-center p-3">
            <div
              className={`relative overflow-hidden rounded-xl border border-neutral-800 shadow-md ${
                isPoster ? 'aspect-[2/3] w-36 sm:w-44' : 'aspect-video w-full max-w-md'
              }`}
            >
              {isImageBroken ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[#131722] p-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-rose-300">Gambar Tidak Ditemukan</p>
                  <p className="mt-1 max-w-[200px] text-[10px] text-neutral-400">
                    Aset telah terhapus dari Edge CDN atau URL tidak valid (HTTP 404).
                  </p>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs font-medium text-white transition hover:bg-neutral-700"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset Aset
                  </button>
                </div>
              ) : (
                <img
                  src={activeImageUrl || ''}
                  alt={label}
                  onError={() => {
                    if (activeImageUrl) {
                      setFailedUrl(activeImageUrl);
                    }
                  }}
                  className={`h-full w-full object-cover transition-transform duration-300 ${
                    isUploading ? 'scale-105 blur-[1px]' : 'group-hover:scale-105'
                  }`}
                />
              )}

              {/* Uploading Overlay during optimistic preview */}
              {isUploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 text-center backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  <p className="mt-2 text-xs font-bold text-white">Mengunggah ke Cloudflare...</p>
                  <p className="text-[10px] text-neutral-300">{uploadProgress}% Selesai</p>
                  {/* Progress Bar */}
                  <div className="mt-2 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Cloudflare Verified Badge */}
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 backdrop-blur-md">
                    <CheckCircle2 className="h-3 w-3" />
                    Cloudflare Images
                  </div>

                  {/* Hover Actions Bar with responsive wrap & compact spacing */}
                  <div className="absolute inset-0 flex flex-wrap content-center items-center justify-center gap-1.5 bg-black/60 p-2 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                    <div {...getRootProps()} className="cursor-pointer">
                      <input {...getInputProps()} />
                      <span className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-700">
                        <RefreshCw className="h-3 w-3" />
                        Ganti
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/20 px-2.5 py-1.5 text-xs font-semibold text-rose-300 shadow-sm transition hover:bg-rose-500/30"
                    >
                      <Trash2 className="h-3 w-3" />
                      Hapus
                    </button>

                    {value && (
                      <a
                        href={value}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800/95 p-1.5 text-neutral-300 shadow-sm hover:text-white"
                        title="Lihat Gambar Penuh"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="font-mono text-neutral-300">Rasio {aspectRatio}</span>
              <span>•</span>
              <span className={isUploading ? 'text-blue-400' : 'text-emerald-400'}>
                {isUploading ? 'Menyinkronkan ke Edge...' : 'Tersimpan di Edge CDN'}
              </span>
            </div>
          </div>
        ) : (
          /* State 2: Dropzone Empty State */
          <div {...getRootProps()} className="cursor-pointer p-6 text-center transition-colors">
            <input {...getInputProps()} />

            {isUploading ? (
              /* State 3: Progress Uploading */
              <div className="mx-auto max-w-xs space-y-3 py-4">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-500" />
                <div>
                  <p className="text-xs font-bold text-white">Mengunggah ke Cloudflare Images...</p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    Mengoptimasi AVIF/WebP langsung ke edge ({uploadProgress}%)
                  </p>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              /* State 2: Empty State dengan Copywriting Premium */
              <div className="space-y-3 py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-[#0F1420] text-blue-400 shadow-inner">
                  <ImagePlus className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-white">
                    {isDragActive
                      ? 'Lepaskan berkas di sini...'
                      : `Unggah ${isPoster ? 'Poster Portrait' : 'Banner Landscape'} Resmi`}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Tarik dan lepas gambar ke sini, atau{' '}
                    <span className="font-semibold text-blue-400 underline decoration-blue-500/40">
                      pilih berkas
                    </span>{' '}
                    dari perangkat Anda.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] text-neutral-500">
                  <span className="rounded bg-neutral-800/60 px-2 py-0.5 font-mono text-neutral-300">
                    Rasio {aspectRatio}
                  </span>
                  <span>•</span>
                  <span>Disarankan {recommendedDimensions}</span>
                  <span>•</span>
                  <span>Maks. {maxSizeMB} MB (JPG, PNG, WebP)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && (
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Sparkles className="h-3 w-3 text-neutral-400" />
          <span>{helperText}</span>
        </div>
      )}
    </div>
  );
}
