import React, { useState } from 'react';
import {
  X,
  Ticket,
  Upload,
  Send,
  Loader2,
  Armchair,
  FileImage,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useInjectCinemaTicketMutation, useResetCinemaTicketMutation } from '../../api';
import type { AdminFulfillmentOrder } from '../../types';

export interface SingleInjectModalProps {
  order: AdminFulfillmentOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SingleInjectModalContentProps {
  order: AdminFulfillmentOrder;
  onClose: () => void;
}

function SingleInjectModalContent({
  order,
  onClose,
}: SingleInjectModalContentProps): React.JSX.Element {
  const isFulfilled = order.fulfillment_status === 'fulfilled';
  const [bookingCode, setBookingCode] = useState(order.cinema_booking_code || '');
  const [passcode, setPasscode] = useState(order.cinema_passcode || '');
  const [notes, setNotes] = useState(
    order.cinema_ticket_notes || 'Cetak mandiri di Kiosk Bioskop sebelum penayangan'
  );
  const [sendNotification, setSendNotification] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  const injectMutation = useInjectCinemaTicketMutation();
  const resetMutation = useResetCinemaTicketMutation();

  const handleConfirmReset = async () => {
    try {
      await resetMutation.mutateAsync(order.transaction_id);
      toast.success(`Tiket pesanan ${order.order_id} berhasil di-reset.`);
      setIsConfirmResetOpen(false);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal mereset tiket pesanan. Silakan coba kembali.';
      toast.error(message, { duration: 6000 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCode.trim() || !passcode.trim()) {
      toast.error('Booking Code dan Passcode wajib diisi.');
      return;
    }

    try {
      await injectMutation.mutateAsync({
        transactionId: order.transaction_id,
        payload: {
          cinema_booking_code: bookingCode.trim().toUpperCase(),
          cinema_passcode: passcode.trim(),
          qr_image: selectedFile,
          notes: notes.trim(),
          send_notification: sendNotification,
          allow_update: isFulfilled,
        },
      });

      toast.success(
        isFulfilled
          ? `Data tiket ${order.order_id} berhasil diperbarui!`
          : `Tiket ${order.order_id} berhasil diinjeksi! ${sendNotification ? 'Notifikasi email terkirim.' : ''}`
      );
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memproses karcis bioskop.';
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
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                isFulfilled
                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                  : 'border-blue-500/20 bg-blue-500/10 text-blue-400'
              }`}
            >
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">
                {isFulfilled ? 'Perbarui / Koreksi Karcis Bioskop' : 'Injeksi Tiket Bioskop'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                Order <span className="font-mono text-white">{order.order_id}</span>
                {isFulfilled && (
                  <span className="ml-2 font-semibold text-amber-400">(Sudah Terinjeksi)</span>
                )}
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
          {/* Notice Banner jika sudah Fulfilled */}
          {isFulfilled && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-amber-300">
                  Mode Pembaruan / Koreksi Data Karcis
                </span>
                <span className="block text-[11px] leading-relaxed text-amber-200/80">
                  Pesanan ini sudah pernah diinjeksi. Anda dapat memperbarui Kode Booking, Passcode,
                  atau mengunggah ulang QR jika terdapat kekeliruan cetak bioskop.
                </span>
              </div>
            </div>
          )}

          {/* Order Summary Card */}
          <div className="space-y-2 rounded-xl border border-neutral-800 bg-[#0D111A] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{order.user_name}</span>
              <span className="font-mono text-[11px] text-neutral-400">{order.user_phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Kursi Dipesan:</span>
              <div className="flex flex-wrap gap-1">
                {order.seats.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-400"
                  >
                    <Armchair className="h-3 w-3" />
                    <span>{s}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Code & Passcode */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-neutral-300">
                Booking Code Tiket <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                placeholder="Contoh: TKT-849201"
                className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2 font-mono text-xs uppercase text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-neutral-300">
                Passcode / PIN Kiosk <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Contoh: 382910"
                className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2 font-mono text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Screenshot QR Upload */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-neutral-300">
              Screenshot Barcode / QR Kiosk (Opsional)
            </label>
            <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-[#0D111A] p-4 text-center transition hover:border-neutral-700">
              {selectedFile ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <FileImage className="h-5 w-5" />
                  <span className="max-w-xs truncate text-xs font-medium">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="ml-2 text-neutral-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-1 h-6 w-6 text-neutral-500" />
                  <span className="text-[11px] text-neutral-400">
                    Klik atau drag screenshot QR karcis tiket (JPG/PNG max 2MB)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-neutral-300">
              Instruksi Penukaran Kiosk
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Cetak di mesin Kiosk Cinema XXI Lantai 3"
              className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Notification Checkbox */}
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-800 bg-[#0D111A] p-3">
            <input
              type="checkbox"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="block text-xs font-bold text-white">
                {isFulfilled
                  ? 'Kirim Notifikasi Pembaruan Tiket via Email'
                  : 'Kirim Notifikasi Tiket Siap via Email'}
              </span>
              <span className="block text-[10px] text-neutral-400">
                {isFulfilled
                  ? 'Kirim pembaruan e-ticket PDF terbaru ke email penonton via antrean background'
                  : 'Kirim e-ticket PDF dan kode booking ke email penonton via antrean background'}
              </span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
            {isFulfilled ? (
              <button
                type="button"
                onClick={() => setIsConfirmResetOpen(true)}
                disabled={injectMutation.isPending || resetMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Tiket</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={injectMutation.isPending || resetMutation.isPending}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 font-medium text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={injectMutation.isPending || resetMutation.isPending}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 font-bold text-white transition disabled:opacity-40 ${
                  isFulfilled ? 'bg-amber-600 hover:bg-amber-500' : 'bg-[#0066FF] hover:bg-blue-600'
                }`}
              >
                {injectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>{isFulfilled ? 'Simpan Perubahan' : 'Injeksi Tiket'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Modal Popup Kecil Konfirmasi Reset Tiket */}
        {isConfirmResetOpen && (
          <div className="z-60 fixed inset-0 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !resetMutation.isPending && setIsConfirmResetOpen(false)}
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5 shadow-2xl">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Reset Injeksi Tiket?</h4>
                  <p className="text-xs leading-relaxed text-neutral-400">
                    Tiket pesanan{' '}
                    <span className="font-semibold text-neutral-200">{order.order_id}</span> akan
                    dikembalikan ke status belum terinjeksi. Berkas QR di Cloudflare R2 akan
                    otomatis dihapus.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-neutral-800/80 pt-3.5">
                <button
                  type="button"
                  onClick={() => setIsConfirmResetOpen(false)}
                  disabled={resetMutation.isPending}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  disabled={resetMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Mereset...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Ya, Reset Tiket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SingleInjectModal(props: SingleInjectModalProps): React.JSX.Element | null {
  if (!props.isOpen || !props.order) return null;
  return <SingleInjectModalContent key={props.order.id} {...props} order={props.order} />;
}
