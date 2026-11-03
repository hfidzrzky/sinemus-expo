import React, { useState } from 'react';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Flame,
  Shield,
  Info,
  Clock,
  Server,
  UserCheck,
} from 'lucide-react';
import type { EmergencyControlsConfig, SystemSettingsAuditMeta } from '../../types';

export interface SettingsEmergencyTabProps {
  initialData: EmergencyControlsConfig;
  auditMeta: SystemSettingsAuditMeta;
  onSave: (data: EmergencyControlsConfig) => Promise<void>;
  isSaving: boolean;
}

export function SettingsEmergencyTab({
  initialData,
  auditMeta,
  onSave,
  isSaving,
}: SettingsEmergencyTabProps): React.JSX.Element {
  const [formData, setFormData] = useState<EmergencyControlsConfig>(initialData);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (formData.is_maintenance_mode && !formData.maintenance_message.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Harap masukkan pesan resmi pemeliharaan untuk penonton saat Mode Pemeliharaan diaktifkan.',
      });
      return;
    }

    try {
      await onSave(formData);
      setStatusMessage({
        type: 'success',
        text: 'Status kontrol darurat dan keamanan sistem berhasil disimpan.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan pengaturan darurat.';
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

      {/* Bagian 1: Sakelar Mode Pemeliharaan (Maintenance Mode) */}
      <div
        className={`space-y-4 rounded-2xl border p-5 transition-all ${
          formData.is_maintenance_mode
            ? 'border-red-500/50 bg-red-950/20'
            : 'border-neutral-800 bg-[#0B0E14]'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 text-white">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                formData.is_maintenance_mode
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold sm:text-sm">
                Mode Pemeliharaan Global (Maintenance Mode)
              </h3>
              <p className="text-[11px] text-neutral-400">
                Mengalihkan seluruh akses penonton ke layar pemeliharaan darurat. Super Admin tetap
                memiliki akses penuh bypass.
              </p>
            </div>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={formData.is_maintenance_mode}
              onChange={(e) => setFormData({ ...formData, is_maintenance_mode: e.target.checked })}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-neutral-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-600 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
          </label>
        </div>

        {formData.is_maintenance_mode && (
          <div className="animate-in fade-in space-y-2 pt-2">
            <label htmlFor="maintenance_message" className="text-xs font-semibold text-red-300">
              Pesan Kustom Pemeliharaan untuk Penonton:
            </label>
            <textarea
              id="maintenance_message"
              rows={5}
              value={formData.maintenance_message}
              onChange={(e) => setFormData({ ...formData, maintenance_message: e.target.value })}
              placeholder="Jelaskan alasan dan estimasi waktu pemeliharaan..."
              className="w-full whitespace-pre-wrap rounded-xl border border-red-500/40 bg-neutral-900 p-3 font-sans text-xs leading-relaxed text-white outline-none focus:border-red-400"
              required
            />
            <p className="text-[11px] text-neutral-400">
              Pesan ini akan langsung diterima dan ditampilkan di modal/layar darurat penonton.
            </p>
          </div>
        )}
      </div>

      {/* Bagian 2: Sakelar Pembekuan Transaksi Khusus (Selective Freeze) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Freeze Cinema Tickets */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                formData.freeze_cinema_ticket_sales
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white sm:text-sm">
                Bekukan Penjualan Tiket Bioskop
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                Nonaktifkan tombol reservasi dan checkout tiket screening jika venue bioskop sedang
                mengalami kendala teknis.
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={formData.freeze_cinema_ticket_sales}
              onChange={(e) =>
                setFormData({ ...formData, freeze_cinema_ticket_sales: e.target.checked })
              }
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-neutral-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-600 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
          </label>
        </div>

        {/* Freeze VoD Rentals */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                formData.freeze_vod_rentals
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white sm:text-sm">Bekukan Sewa Film VoD</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                Hentikan transaksi sewa film baru sementara tanpa memutus akses bagi penonton yang
                sudah menyewa aktif.
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={formData.freeze_vod_rentals}
              onChange={(e) => setFormData({ ...formData, freeze_vod_rentals: e.target.checked })}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-neutral-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-600 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
          </label>
        </div>
      </div>

      {/* Bagian 3: Banner Pengumuman Darurat Beranda (Emergency Alert Banner) */}
      <div className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-[#0066FF]">
              <Info className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold sm:text-sm">Banner Pengumuman Darurat di Beranda</h3>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={formData.emergency_alert_banner.is_active}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emergency_alert_banner: {
                    ...formData.emergency_alert_banner,
                    is_active: e.target.checked,
                  },
                })
              }
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-neutral-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-600 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0066FF] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
          </label>
        </div>

        {formData.emergency_alert_banner.is_active && (
          <div className="animate-in fade-in space-y-3 pt-1">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-neutral-300">Tipe Peringatan:</span>
              <div className="flex items-center gap-3 text-xs">
                {(['warning', 'danger', 'info'] as const).map((t) => (
                  <label
                    key={t}
                    className="inline-flex cursor-pointer items-center gap-1.5 capitalize"
                  >
                    <input
                      type="radio"
                      name="banner_type"
                      checked={formData.emergency_alert_banner.type === t}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          emergency_alert_banner: { ...formData.emergency_alert_banner, type: t },
                        })
                      }
                      className="text-[#0066FF]"
                    />
                    <span className="text-neutral-300">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="emergency_banner_message"
                className="text-xs font-semibold text-neutral-300"
              >
                Isi Pesan Banner Pengumuman:
              </label>
              <input
                id="emergency_banner_message"
                type="text"
                value={formData.emergency_alert_banner.message || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergency_alert_banner: {
                      ...formData.emergency_alert_banner,
                      message: e.target.value,
                    },
                  })
                }
                placeholder="Contoh: Pemberitahuan: Studio 2 XXI Plaza Senayan sedang perbaikan AC..."
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bagian 4: Audit Metadata & System Info */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          Informasi Lingkungan Sistem & Jejak Audit
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-neutral-300 sm:grid-cols-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <Server className="h-3.5 w-3.5" />
              <span>Versi Platform</span>
            </div>
            <p className="font-bold text-white">{auditMeta.app_version}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Zona Waktu Server</span>
            </div>
            <p className="font-bold text-white">{auditMeta.timezone}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Diperbarui Oleh</span>
            </div>
            <p className="font-bold text-white">{auditMeta.last_updated_by_name || 'Sistem'}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Pembaruan Terakhir</span>
            </div>
            <p className="font-bold text-white">
              {auditMeta.last_updated_at
                ? new Date(auditMeta.last_updated_at).toLocaleString('id-ID')
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button Bar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-red-500 active:scale-95 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Kontrol Darurat'}</span>
        </button>
      </div>
    </form>
  );
}
