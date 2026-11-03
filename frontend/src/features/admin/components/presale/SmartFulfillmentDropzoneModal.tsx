import React, { useState, useCallback } from 'react';
import {
  X,
  Wand2,
  UploadCloud,
  FileArchive,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Lock,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { RateLimitAlertBanner } from '@/components/common';
import { useRateLimitCooldown } from '@/hooks/useRateLimitCooldown';
import { usePreviewSmartIngestMutation } from '../../api';
import type { SmartIngestPreviewResponse, IngestTargetContext } from '../../types';

export interface SmartFulfillmentDropzoneModalProps {
  scheduleId: number | null;
  targetContext?: IngestTargetContext | null;
  isOpen: boolean;
  onClose: () => void;
  onPreviewSuccess: (preview: SmartIngestPreviewResponse) => void;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function SmartFulfillmentDropzoneModal({
  scheduleId,
  targetContext,
  isOpen,
  onClose,
  onPreviewSuccess,
}: SmartFulfillmentDropzoneModalProps): React.JSX.Element | null {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const previewMutation = usePreviewSmartIngestMutation();
  const rateLimit = useRateLimitCooldown({ defaultSeconds: 60 });

  const handleValidateAndSetFile = useCallback((file: File) => {
    setValidationError(null);

    const validExtensions = ['.pdf', '.zip'];
    const lowerName = file.name.toLowerCase();
    const isValidExtension = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExtension) {
      setValidationError('Hanya file Master PDF (.pdf) atau arsip ZIP (.zip) yang didukung.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('Ukuran file melebihi batas maksimal 25 MB.');
      return;
    }

    setSelectedFile(file);
  }, []);

  if (!isOpen || !scheduleId) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleStartExtraction = async () => {
    if (!selectedFile) {
      toast.error('Pilih file Master PDF atau ZIP terlebih dahulu.');
      return;
    }

    try {
      const result = await previewMutation.mutateAsync({
        scheduleId,
        file: selectedFile,
      });

      const alreadyFulfilledCount = result.unmatched_items.filter(
        (i) => i.match_status === 'already_fulfilled'
      ).length;

      if (result.matched_count === 0 && alreadyFulfilledCount > 0) {
        toast.warning(
          `Semua ${alreadyFulfilledCount} karcis pada berkas ini sudah pernah diinjeksi sebelumnya.`
        );
      } else if (result.matched_count > 0 && alreadyFulfilledCount > 0) {
        toast.info(
          `Terdeteksi ${result.total_detected} karcis (${result.matched_count} cocok, ${alreadyFulfilledCount} sudah pernah diinjeksi).`
        );
      } else {
        toast.success(
          `Ekstraksi selesai! Terdeteksi ${result.total_detected} karcis (${result.matched_count} cocok sempurna).`
        );
      }
      onPreviewSuccess(result);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 429) {
        rateLimit.triggerCooldown(err);
      }
      const message =
        err instanceof Error ? err.message : 'Gagal mengekstrak karcis tiket bioskop dari file.';
      toast.error(message, { duration: 6000 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0D111A] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Smart Ingest E-Tiket Bioskop Presale
              </h2>
              <p className="text-[11px] text-neutral-400">
                Ekstraksi & pencocokan otomatis Master PDF bioskop mitra atau arsip ZIP karcis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-6 text-xs">
          {/* Solusi A: Locked Target Context Badge */}
          {targetContext && (
            <div className="flex items-center gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2.5 text-xs text-blue-200">
              <Lock className="h-4 w-4 shrink-0 text-blue-400" />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-blue-300">Target Sesi Terkunci: </span>
                <span className="font-medium text-white">
                  {targetContext.eventTitle} • {targetContext.venueName} •{' '}
                  {targetContext.studioName} ({targetContext.showTimeStr})
                </span>
              </div>
            </div>
          )}

          {/* Rate Limit Alert Banner (SSOT) */}
          <RateLimitAlertBanner
            cooldownSeconds={rateLimit.cooldownSeconds}
            actionName="ekstraksi tiket"
          />

          {/* Dropzone Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragOver
                ? 'scale-[0.99] border-blue-500 bg-blue-500/10'
                : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-neutral-800 bg-[#0D111A] hover:border-neutral-700'
            }`}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  {selectedFile.name.endsWith('.pdf') ? (
                    <FileText className="h-6 w-6" />
                  ) : (
                    <FileArchive className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <span className="mx-auto block max-w-xs truncate text-sm font-bold text-white">
                    {selectedFile.name}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Siap diekstrak
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="mt-2 text-xs font-semibold text-neutral-400 transition hover:text-red-400"
                >
                  Ganti File
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-400">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-white">
                  Drag & Drop Master PDF atau ZIP Tiket
                </p>
                <p className="mt-1 max-w-xs text-[11px] text-neutral-400">
                  Sistem mengekstrak Booking Code, Passcode PIN, nomor kursi, dan QR barcode
                  menggunakan parser dependensi internal
                </p>
                <span className="mt-3 inline-block rounded-full bg-neutral-800 px-3 py-1 font-mono text-[10px] text-neutral-300">
                  Format: .PDF atau .ZIP (Maksimal 25MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,.zip,application/pdf,application/zip"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleValidateAndSetFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Feature Highlights */}
          <div className="space-y-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] p-3.5 text-[11px] text-neutral-400">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
              <span>Matriks Validasi 5-Point Strict Match (Anti-Salah Injeksi):</span>
            </div>
            <p className="pl-5 leading-relaxed">
              Sistem secara ketat memverifikasi kesesuaian Judul Film, Lokasi Venue, Studio, Jam
              Tayang, dan Nomor Kursi pembeli dengan karcis resmi bioskop agar 100% tepat sasaran,
              serta memotong crop QR karcis ke Cloudflare R2 secara otomatis.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-neutral-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 font-medium text-neutral-300 transition hover:bg-neutral-800"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!selectedFile || previewMutation.isPending || rateLimit.isCooldownActive}
              onClick={handleStartExtraction}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 font-bold transition disabled:opacity-40 ${
                rateLimit.isCooldownActive
                  ? 'cursor-not-allowed border border-amber-500/40 bg-amber-500/20 text-amber-300'
                  : 'bg-[#0066FF] text-white hover:bg-blue-600'
              }`}
            >
              {previewMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengekstrak & Mencocokkan Karcis...</span>
                </>
              ) : rateLimit.isCooldownActive ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-pulse text-amber-300" />
                  <span>Tunggu {rateLimit.cooldownSeconds}s (Cooldown)</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>Mulai Ekstraksi & Pencocokan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
