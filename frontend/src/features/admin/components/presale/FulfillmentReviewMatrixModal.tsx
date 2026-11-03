import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Armchair,
  ExternalLink,
  Loader2,
  ShieldCheck,
  QrCode,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { RateLimitAlertBanner } from '@/components/common';
import { useRateLimitCooldown } from '@/hooks/useRateLimitCooldown';
import { useConfirmSmartIngestMutation } from '../../api';
import type {
  SmartIngestPreviewResponse,
  SmartIngestMatchedItem,
  SmartIngestUnmatchedItem,
} from '../../types';

export interface FulfillmentReviewMatrixModalProps {
  scheduleId: number | null;
  previewData: SmartIngestPreviewResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: () => void;
}

interface FulfillmentReviewMatrixContentProps {
  scheduleId: number;
  previewData: SmartIngestPreviewResponse;
  onClose: () => void;
  onConfirmSuccess: () => void;
}

function QrPreviewCell({ url }: { url: string }): React.JSX.Element {
  const [hasError, setHasError] = useState(false);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 text-neutral-400 hover:text-white"
      title="Buka QR code di tab baru"
    >
      <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded border border-neutral-700 bg-white">
        {!hasError && url ? (
          <img
            src={url}
            alt="QR Preview"
            onError={() => setHasError(true)}
            className="h-full w-full object-contain p-0.5"
          />
        ) : (
          <QrCode className="h-4 w-4 text-neutral-800" />
        )}
      </div>
      <ExternalLink className="h-3 w-3 text-neutral-500 group-hover:text-blue-400" />
    </a>
  );
}

function FulfillmentReviewMatrixContent({
  scheduleId,
  previewData,
  onClose,
  onConfirmSuccess,
}: FulfillmentReviewMatrixContentProps): React.JSX.Element {
  const [matchedItems, setMatchedItems] = useState<SmartIngestMatchedItem[]>(
    () => previewData.matched_items
  );
  const [unmatchedItems, setUnmatchedItems] = useState<SmartIngestUnmatchedItem[]>(
    () => previewData.unmatched_items
  );
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<number[]>(() =>
    previewData.matched_items.map((i) => i.transaction_id)
  );
  const [sendNotification, setSendNotification] = useState(true);

  const confirmMutation = useConfirmSmartIngestMutation();
  const rateLimit = useRateLimitCooldown({ defaultSeconds: 60 });

  const toggleSelect = (id: number) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactionIds.length === matchedItems.length) {
      setSelectedTransactionIds([]);
    } else {
      setSelectedTransactionIds(matchedItems.map((i) => i.transaction_id));
    }
  };

  const updateMatchedItem = (
    transactionId: number,
    field: 'detected_booking_code' | 'detected_passcode',
    value: string
  ) => {
    setMatchedItems((prev) =>
      prev.map((item) =>
        item.transaction_id === transactionId ? { ...item, [field]: value } : item
      )
    );
  };

  const updateUnmatchedItem = (
    index: number,
    field: 'detected_booking_code' | 'detected_passcode',
    value: string
  ) => {
    setUnmatchedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handlePromoteUnmatched = (unmatched: SmartIngestUnmatchedItem, index: number) => {
    if (!unmatched.transaction_id) {
      toast.error('Karcis ini tidak memiliki pesanan transaksi yang cocok di sesi ini.');
      return;
    }
    const passcode = (unmatched.detected_passcode || '').trim();
    if (!passcode || passcode.length < 4) {
      toast.error('Harap masukkan Passcode PIN minimal 4 digit terlebih dahulu.');
      return;
    }
    const bookingCode = (unmatched.detected_booking_code || '').trim();
    if (!bookingCode) {
      toast.error('Booking code tidak boleh kosong.');
      return;
    }

    const newMatchedItem: SmartIngestMatchedItem = {
      transaction_id: unmatched.transaction_id,
      order_id: unmatched.order_id || 'SNM-TKT-MANUAL',
      user_name: unmatched.user_name || 'Penonton Sinemus',
      seats: unmatched.detected_seats,
      detected_booking_code: bookingCode,
      detected_passcode: passcode,
      r2_qr_path: unmatched.r2_qr_path,
      r2_preview_url: unmatched.r2_preview_url,
      qr_source: unmatched.qr_source || 'original_pdf',
      match_status: 'manual_override',
      notes: 'Injeksi PIN Kiosk Manual via Review Matrix',
    };

    setMatchedItems((prev) => [...prev, newMatchedItem]);
    setUnmatchedItems((prev) => prev.filter((_, idx) => idx !== index));
    setSelectedTransactionIds((prev) => [...prev, unmatched.transaction_id!]);
    toast.success(
      `Karcis kursi ${unmatched.detected_seats.join(', ')} berhasil dipromosikan ke karcis cocok!`
    );
  };

  const handleConfirm = async () => {
    if (selectedTransactionIds.length === 0) {
      toast.error('Pilih setidaknya 1 karcis yang disetujui untuk pemenuhan.');
      return;
    }

    // Validasi apakah ada karcis terpilih yang passcode-nya kosong
    const invalidItem = matchedItems.find(
      (i) =>
        selectedTransactionIds.includes(i.transaction_id) &&
        (!i.detected_passcode || i.detected_passcode.trim() === '')
    );
    if (invalidItem) {
      toast.error(
        `Karcis ${invalidItem.order_id} (Kursi: ${invalidItem.seats.join(', ')}) belum memiliki Passcode PIN. Harap isi PIN sebelum konfirmasi.`
      );
      return;
    }

    const approvedItems = matchedItems
      .filter((i) => selectedTransactionIds.includes(i.transaction_id))
      .map((i: SmartIngestMatchedItem) => ({
        transaction_id: i.transaction_id,
        detected_booking_code: i.detected_booking_code,
        detected_passcode: i.detected_passcode,
        r2_qr_path: i.r2_qr_path,
        notes: i.notes || 'Injeksi Cerdas via Smart Ingest',
      }));

    try {
      const res = await confirmMutation.mutateAsync({
        scheduleId,
        payload: {
          approved_items: approvedItems,
          send_notification: sendNotification,
        },
      });

      toast.success(
        `Sukses! ${res.fulfilled_count} tiket terdistribusi ke penonton & ${res.dispatched_notifications_count} notifikasi terkirim.`
      );
      onConfirmSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 429) {
        rateLimit.triggerCooldown(err);
      }
      const errorMsg =
        err instanceof Error ? err.message : 'Gagal mengonfirmasi pemenuhan tiket presale.';
      toast.error(errorMsg, { duration: 6000 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0D111A] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Matriks Validasi 5-Point Strict Match
              </h2>
              <p className="text-[11px] text-neutral-400">
                Verifikasi kesesuaian tiket bioskop terhadap film, studio, jam tayang dan kursi
                penonton
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

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-xs">
          {/* Rate Limit Alert Banner (SSOT) */}
          <RateLimitAlertBanner
            cooldownSeconds={rateLimit.cooldownSeconds}
            actionName="distribusi tiket"
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-neutral-800 bg-[#0D111A] p-3 text-center">
              <span className="text-[10px] font-medium text-neutral-400">Total Terdeteksi</span>
              <p className="text-lg font-black text-white">{previewData.total_detected}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <span className="text-[10px] font-medium text-emerald-400">
                Cocok Sempurna (Exact)
              </span>
              <p className="text-lg font-black text-emerald-400">{matchedItems.length}</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <span className="text-[10px] font-medium text-amber-400">Perlu Tinjauan</span>
              <p className="text-lg font-black text-amber-400">{unmatchedItems.length}</p>
            </div>
          </div>

          {/* Matched Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h3 className="font-display text-xs font-bold text-white">
                  Daftar Karcis Cocok ({matchedItems.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
              >
                {selectedTransactionIds.length === matchedItems.length
                  ? 'Batal Pilih Semua'
                  : 'Pilih Semua'}
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0D111A]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 bg-[#080B10] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <tr>
                      <th className="w-10 px-4 py-3">Pilih</th>
                      <th className="px-4 py-3">Order ID & Pemesan</th>
                      <th className="px-4 py-3">Kursi Cocok</th>
                      <th className="px-4 py-3">Booking Code</th>
                      <th className="px-4 py-3">Passcode PIN</th>
                      <th className="px-4 py-3">Preview QR R2</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                    {matchedItems.map((item) => (
                      <tr key={item.transaction_id} className="hover:bg-neutral-800/30">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTransactionIds.includes(item.transaction_id)}
                            onChange={() => toggleSelect(item.transaction_id)}
                            className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="block font-mono font-bold text-white">
                            {item.order_id}
                          </span>
                          <span className="text-[11px] text-neutral-400">{item.user_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.seats.map((seat) => (
                              <span
                                key={seat}
                                className="inline-flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-400"
                              >
                                <Armchair className="h-3 w-3" />
                                <span>{seat}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.detected_booking_code}
                            onChange={(e) =>
                              updateMatchedItem(
                                item.transaction_id,
                                'detected_booking_code',
                                e.target.value
                              )
                            }
                            title="Edit Booking Code"
                            className="w-32 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 font-mono text-xs font-bold text-emerald-400 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.detected_passcode}
                            onChange={(e) =>
                              updateMatchedItem(
                                item.transaction_id,
                                'detected_passcode',
                                e.target.value
                              )
                            }
                            placeholder="PIN Kiosk"
                            title="Edit Passcode PIN"
                            className="w-24 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <QrPreviewCell url={item.r2_preview_url} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                              {item.match_status === 'manual_override'
                                ? 'Manual Matched'
                                : 'Exact Match'}
                            </span>
                            {item.qr_source === 'original_pdf' ? (
                              <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                                ✓ QR Asli PDF
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                                QR Kredensial
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Unmatched Items (if any) */}
          {unmatchedItems && unmatchedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="font-display text-xs font-bold">
                  Karcis Perlu Tinjauan ({unmatchedItems.length})
                </h3>
              </div>

              <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Karcis di bawah ini memerlukan tindakan manual atau ditolak oleh sistem validasi.
                  Jika karcis memiliki pesanan namun PIN belum lengkap, Anda dapat melengkapi PIN
                  dan mengeklik tombol <strong>Promosikan</strong>.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  {unmatchedItems.map((unmatched, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col justify-between gap-3 rounded-lg border border-neutral-800 bg-[#0B0E14] p-3 text-[11px]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-mono text-neutral-300">
                          <span className="font-bold text-amber-400">
                            Kursi {unmatched.detected_seats.join(', ')}
                          </span>
                          <span>•</span>
                          <span className="text-neutral-400">
                            {unmatched.detected_booking_code || 'Tanpa Kode Booking'}
                          </span>
                          {unmatched.order_id && (
                            <>
                              <span>•</span>
                              <span className="font-bold text-white">{unmatched.order_id}</span>
                              <span className="text-neutral-400">({unmatched.user_name})</span>
                            </>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {unmatched.match_status === 'rejected_foreign_movie' && (
                            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                              ✕ Beda Judul Film
                            </span>
                          )}
                          {unmatched.match_status === 'rejected_mismatched_studio' && (
                            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                              ✕ Salah Studio
                            </span>
                          )}
                          {unmatched.match_status === 'rejected_mismatched_time' && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                              ✕ Selisih Jam Tayang
                            </span>
                          )}
                          {unmatched.match_status === 'rejected_missing_passcode' && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              ⚠️ PIN Belum Diisi
                            </span>
                          )}
                          {unmatched.match_status === 'already_fulfilled' && (
                            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                              ✕ Sudah Terinjeksi Sebelumnya
                            </span>
                          )}
                          {unmatched.match_status === 'unmatched_seat' && (
                            <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">
                              ✕ Kursi Tidak Ditemukan
                            </span>
                          )}
                        </div>
                      </div>

                      {unmatched.unmatched_reason && (
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-300/90">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span>{unmatched.unmatched_reason}</span>
                        </div>
                      )}

                      {/* Manual Input for Missing Passcode or Fulfillable Unmatched */}
                      {unmatched.can_manual_fulfill && unmatched.transaction_id && (
                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-800 bg-[#080B10] p-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-neutral-400">Booking:</span>
                            <input
                              type="text"
                              value={unmatched.detected_booking_code || ''}
                              onChange={(e) =>
                                updateUnmatchedItem(idx, 'detected_booking_code', e.target.value)
                              }
                              placeholder="Booking Code"
                              className="w-28 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 font-mono text-xs text-emerald-400 focus:border-blue-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-neutral-400">PIN:</span>
                            <input
                              type="text"
                              value={unmatched.detected_passcode || ''}
                              onChange={(e) =>
                                updateUnmatchedItem(idx, 'detected_passcode', e.target.value)
                              }
                              placeholder="Ketik PIN Kiosk"
                              className="w-28 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePromoteUnmatched(unmatched, idx)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 font-semibold text-white transition hover:bg-emerald-500"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Promosikan ke Cocok</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="rounded-xl border border-neutral-800 bg-[#0D111A] p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="block text-xs font-bold text-white">
                  Kirim Notifikasi Tiket Siap Otomatis via Email
                </span>
                <span className="block text-[11px] text-neutral-400">
                  Kirimkan e-ticket PDF dan instruksi penukaran kiosk langsung ke email{' '}
                  {selectedTransactionIds.length} penonton terpilih.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 bg-[#0D111A] px-6 py-4">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{selectedTransactionIds.length} karcis dipilih untuk diproses</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 font-medium text-neutral-300 transition hover:bg-neutral-800"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={
                selectedTransactionIds.length === 0 ||
                confirmMutation.isPending ||
                rateLimit.isCooldownActive
              }
              onClick={handleConfirm}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 font-bold transition disabled:opacity-40 ${
                rateLimit.isCooldownActive
                  ? 'cursor-not-allowed border border-amber-500/40 bg-amber-500/20 text-amber-300'
                  : 'bg-[#0066FF] text-white hover:bg-blue-600'
              }`}
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses Distribusi...</span>
                </>
              ) : rateLimit.isCooldownActive ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-pulse text-amber-300" />
                  <span>Tunggu {rateLimit.cooldownSeconds}s (Cooldown)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Konfirmasi Pemenuhan Massal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FulfillmentReviewMatrixModal(
  props: FulfillmentReviewMatrixModalProps
): React.JSX.Element | null {
  if (!props.isOpen || !props.previewData || !props.scheduleId) return null;
  return (
    <FulfillmentReviewMatrixContent
      key={props.scheduleId}
      {...props}
      previewData={props.previewData}
      scheduleId={props.scheduleId}
    />
  );
}
