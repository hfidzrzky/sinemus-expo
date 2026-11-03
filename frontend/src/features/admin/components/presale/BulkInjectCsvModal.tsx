import React, { useState } from 'react';
import { X, FileSpreadsheet, FileArchive, Upload, Loader2, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkInjectTicketsMutation } from '../../api';
import type { IngestTargetContext } from '../../types';

export interface BulkInjectCsvModalProps {
  scheduleId: number | null;
  targetContext?: IngestTargetContext | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkInjectCsvModal({
  scheduleId,
  targetContext,
  isOpen,
  onClose,
  onSuccess,
}: BulkInjectCsvModalProps): React.JSX.Element | null {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [sendNotification, setSendNotification] = useState(true);

  const bulkMutation = useBulkInjectTicketsMutation();

  if (!isOpen || !scheduleId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('File CSV daftar karcis bioskop wajib diunggah.');
      return;
    }

    try {
      const res = await bulkMutation.mutateAsync({
        scheduleId,
        payload: {
          csv_file: csvFile,
          assets_zip: zipFile,
          send_notification: sendNotification,
        },
      });

      toast.success(
        `Job injeksi #${res.job_id} berhasil dijadwalkan! ${res.total_records_queued} data tiket diproses.`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal mengunggah berkas CSV injeksi massal.';
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Injeksi Massal CSV & ZIP
              </h2>
              <p className="text-[11px] text-neutral-400">
                Metode cadangan injeksi data karcis bioskop
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-xs">
          {/* Solusi A: Locked Target Context Badge */}
          {targetContext && (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
              <Lock className="h-4 w-4 shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-amber-300">Target Sesi Terkunci: </span>
                <span className="font-medium text-white">
                  {targetContext.eventTitle} • {targetContext.venueName} •{' '}
                  {targetContext.studioName} ({targetContext.showTimeStr})
                </span>
              </div>
            </div>
          )}

          {/* CSV File Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-neutral-300">
              File CSV Pesanan <span className="text-red-400">*</span>
            </label>
            <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-[#0D111A] p-4 text-center transition hover:border-neutral-700">
              {csvFile ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span className="max-w-xs truncate text-xs font-medium">{csvFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setCsvFile(null)}
                    className="ml-2 text-neutral-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-1 h-5 w-5 text-neutral-500" />
                  <span className="text-[11px] text-neutral-400">
                    Pilih file CSV (Kolom: order_id, booking_code, passcode, seats)
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCsvFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </>
              )}
            </div>
          </div>

          {/* ZIP Assets Input (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-neutral-300">
              Arsip ZIP Gambar QR Code (Opsional)
            </label>
            <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-[#0D111A] p-4 text-center transition hover:border-neutral-700">
              {zipFile ? (
                <div className="flex items-center gap-2 text-purple-400">
                  <FileArchive className="h-5 w-5" />
                  <span className="max-w-xs truncate text-xs font-medium">{zipFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setZipFile(null)}
                    className="ml-2 text-neutral-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-1 h-5 w-5 text-neutral-500" />
                  <span className="text-[11px] text-neutral-400">
                    File ZIP berisi screenshot QR karcis dengan nama file sesuai order_id
                  </span>
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setZipFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </>
              )}
            </div>
          </div>

          {/* Notification Checkbox */}
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-800 bg-[#0D111A] p-3">
            <input
              type="checkbox"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
            />
            <div>
              <span className="block text-xs font-bold text-white">
                Kirim Notifikasi Tiket Siap Otomatis via Email
              </span>
              <span className="block text-[10px] text-neutral-400">
                Otomatis kirim email dengan e-pass PDF setelah proses injeksi selesai
              </span>
            </div>
          </label>

          <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[11px] text-neutral-400">
            <AlertCircle className="h-4 w-4 shrink-0 text-blue-400" />
            <span>
              Proses CSV akan berjalan di background queue worker demi menjaga stabilitas server.
            </span>
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
              type="submit"
              disabled={bulkMutation.isPending || !csvFile}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-5 py-2 font-bold text-white transition hover:bg-blue-600 disabled:opacity-40"
            >
              {bulkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <span>Mulai Injeksi Massal</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
