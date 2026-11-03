import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, Clock, Film, Coins, Users } from 'lucide-react';
import type { BusinessPoliciesConfig } from '../../types';

export interface SettingsBusinessTabProps {
  initialData: BusinessPoliciesConfig;
  onSave: (data: BusinessPoliciesConfig) => Promise<void>;
  isSaving: boolean;
}

export function SettingsBusinessTab({
  initialData,
  onSave,
  isSaving,
}: SettingsBusinessTabProps): React.JSX.Element {
  const [formData, setFormData] = useState<BusinessPoliciesConfig>(initialData);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (formData.seat_lock_duration_minutes < 5 || formData.seat_lock_duration_minutes > 60) {
      setStatusMessage({
        type: 'error',
        text: 'Durasi penguncian kursi harus antara 5 hingga 60 menit.',
      });
      return;
    }

    if (formData.vod_rental_duration_hours < 12 || formData.vod_rental_duration_hours > 168) {
      setStatusMessage({
        type: 'error',
        text: 'Durasi sewa film VoD harus antara 12 hingga 168 jam (7 hari).',
      });
      return;
    }

    if (formData.platform_service_fee < 0) {
      setStatusMessage({
        type: 'error',
        text: 'Biaya layanan platform tidak boleh bernilai negatif.',
      });
      return;
    }

    if (formData.max_tickets_per_order < 1 || formData.max_tickets_per_order > 20) {
      setStatusMessage({
        type: 'error',
        text: 'Batas maksimal pembelian kursi harus antara 1 hingga 20 tiket.',
      });
      return;
    }

    try {
      await onSave(formData);
      setStatusMessage({
        type: 'success',
        text: 'Kebijakan bisnis dan transaksi berhasil disimpan.',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal menyimpan pengaturan kebijakan bisnis.';
      setStatusMessage({ type: 'error', text: message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {statusMessage && (
        <div
          role="alert"
          className={`animate-in fade-in flex items-center gap-2.5 rounded-xl border p-4 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid 2 Kolom */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Seat Lock Duration */}
        <div className="space-y-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-[#0066FF]">
              <Clock className="h-4 w-4" />
            </div>
            <label htmlFor="seat_lock_duration" className="text-xs font-bold sm:text-sm">
              Durasi Kunci Kursi Ticket War (Menit)
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-400">
            Batas waktu penonton menyelesaikan pembayaran Midtrans sebelum reservasi kursi dilepas
            kembali ke publik.
          </p>
          <div className="flex items-center gap-3">
            <input
              id="seat_lock_duration"
              type="number"
              min={5}
              max={60}
              value={formData.seat_lock_duration_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  seat_lock_duration_minutes: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-32 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#0066FF]"
              required
            />
            <span className="text-xs font-semibold text-neutral-400">
              Menit (Default: 15 Menit)
            </span>
          </div>
        </div>

        {/* Card 2: VoD Rental Duration */}
        <div className="space-y-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Film className="h-4 w-4" />
            </div>
            <label htmlFor="vod_rental_duration" className="text-xs font-bold sm:text-sm">
              Masa Akses Sewa Film VoD (Jam)
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-400">
            Jangka waktu penonton berhak menonton streaming film berbayar sejak konfirmasi
            pembayaran.
          </p>
          <div className="flex items-center gap-3">
            <input
              id="vod_rental_duration"
              type="number"
              min={12}
              max={168}
              value={formData.vod_rental_duration_hours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vod_rental_duration_hours: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-32 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#0066FF]"
              required
            />
            <span className="text-xs font-semibold text-neutral-400">Jam (Default: 48 Jam)</span>
          </div>
        </div>

        {/* Card 3: Platform Service Fee */}
        <div className="space-y-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Coins className="h-4 w-4" />
            </div>
            <label htmlFor="platform_service_fee" className="text-xs font-bold sm:text-sm">
              Biaya Layanan Platform (Rupiah)
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-400">
            Nominal biaya layanan operasional per order yang dibebankan kepada penonton saat
            checkout.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-neutral-500">Rp</span>
              <input
                id="platform_service_fee"
                type="number"
                min={0}
                step={500}
                value={formData.platform_service_fee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    platform_service_fee: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-36 rounded-xl border border-neutral-700 bg-neutral-900 py-2 pl-9 pr-3 text-xs font-bold text-white outline-none focus:border-[#0066FF]"
                required
              />
            </div>
            <span className="text-xs font-semibold text-neutral-400">Per Transaksi</span>
          </div>
        </div>

        {/* Card 4: Max Tickets Limit per Order */}
        <div className="space-y-3 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Users className="h-4 w-4" />
            </div>
            <label htmlFor="max_tickets_per_order" className="text-xs font-bold sm:text-sm">
              Batas Maksimal Kursi per Order
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-400">
            Proteksi kuota anti-calo untuk mencegah satu akun memborong terlalu banyak kursi dalam
            satu transaksi war.
          </p>
          <div className="flex items-center gap-3">
            <input
              id="max_tickets_per_order"
              type="number"
              min={1}
              max={20}
              value={formData.max_tickets_per_order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_tickets_per_order: parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-32 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#0066FF]"
              required
            />
            <span className="text-xs font-semibold text-neutral-400">Kursi (Default: 8 Kursi)</span>
          </div>
        </div>
      </div>

      {/* Submit Button Bar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Kebijakan Bisnis'}</span>
        </button>
      </div>
    </form>
  );
}
