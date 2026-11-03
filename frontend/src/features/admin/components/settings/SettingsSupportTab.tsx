import React, { useState } from 'react';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Mail,
  ExternalLink,
  Globe,
} from 'lucide-react';
import type { PublicContactConfig } from '../../types';

export interface SettingsSupportTabProps {
  initialData: PublicContactConfig;
  onSave: (data: PublicContactConfig) => Promise<void>;
  isSaving: boolean;
}

export function SettingsSupportTab({
  initialData,
  onSave,
  isSaving,
}: SettingsSupportTabProps): React.JSX.Element {
  const [formData, setFormData] = useState<PublicContactConfig>(initialData);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const cleanPhone = formData.whatsapp_admin_number.replace(/\D/g, '');
  const testWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    formData.whatsapp_prefill_template || 'Halo Sinemus...'
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validate phone number
    if (!/^(08|\+628|628)[0-9]{8,13}$/.test(formData.whatsapp_admin_number.trim())) {
      setStatusMessage({
        type: 'error',
        text: 'Format nomor WhatsApp tidak valid. Gunakan format Indonesia (misal: 081234567890 atau 6281234567890).',
      });
      return;
    }

    if (!formData.support_email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Format alamat email bantuan tidak valid.' });
      return;
    }

    try {
      await onSave(formData);
      setStatusMessage({
        type: 'success',
        text: 'Informasi kontak dan layanan pengguna berhasil disimpan.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan pengaturan kontak.';
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

      {/* Bagian 1: WhatsApp Admin Hotline */}
      <div className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
        <div className="flex items-center gap-2.5 text-white">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <MessageCircle className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold sm:text-sm">
            Hotline WhatsApp Layanan Penonton (Direct wa.me)
          </h3>
        </div>
        <p className="text-[11px] leading-relaxed text-neutral-400">
          Nomor WhatsApp yang dituju ketika penonton mengklik tombol "Hubungi via WhatsApp" di
          footer atau formulir bantuan penonton.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="wa_admin_number" className="text-xs font-semibold text-neutral-300">
              Nomor WhatsApp Admin CS
            </label>
            <input
              id="wa_admin_number"
              type="text"
              value={formData.whatsapp_admin_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_admin_number: e.target.value })}
              placeholder="Contoh: 6281234567890"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="flex items-end">
            <a
              href={testWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-95"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Tes Tautan wa.me Langsung</span>
            </a>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="wa_prefill_template" className="text-xs font-semibold text-neutral-300">
            Template Teks Prefilled Otomatis
          </label>
          <textarea
            id="wa_prefill_template"
            rows={2}
            value={formData.whatsapp_prefill_template}
            onChange={(e) =>
              setFormData({ ...formData, whatsapp_prefill_template: e.target.value })
            }
            placeholder="Teks yang otomatis terisi di chat WhatsApp penonton..."
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900 p-3 text-xs leading-relaxed text-white outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Bagian 2: Layanan Email & Notifikasi Tiket */}
      <div className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
        <div className="flex items-center gap-2.5 text-white">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-[#0066FF]">
            <Mail className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold sm:text-sm">
            Layanan Email Dukungan & Pengiriman Tiket
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="support_email" className="text-xs font-semibold text-neutral-300">
              Email Helpdesk / CS Resmi
            </label>
            <input
              id="support_email"
              type="email"
              value={formData.support_email}
              onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#0066FF]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="operating_hours" className="text-xs font-semibold text-neutral-300">
              Jam Operasional Dukungan
            </label>
            <input
              id="operating_hours"
              type="text"
              value={formData.operating_hours}
              onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
              placeholder="Contoh: Senin - Minggu: 09:00 - 22:00 WIB"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#0066FF]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ticket_sender_name" className="text-xs font-semibold text-neutral-300">
              Nama Pengirim Email Tiket (Sender Name)
            </label>
            <input
              id="ticket_sender_name"
              type="text"
              value={formData.ticket_sender_name}
              onChange={(e) => setFormData({ ...formData, ticket_sender_name: e.target.value })}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#0066FF]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ticket_sender_email" className="text-xs font-semibold text-neutral-300">
              Alamat Email Pengirim Tiket (From Address)
            </label>
            <input
              id="ticket_sender_email"
              type="email"
              value={formData.ticket_sender_email}
              onChange={(e) => setFormData({ ...formData, ticket_sender_email: e.target.value })}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#0066FF]"
              required
            />
          </div>
        </div>
      </div>

      {/* Bagian 3: Media Sosial Resmi */}
      <div className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5">
        <div className="flex items-center gap-2.5 text-white">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <Globe className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold sm:text-sm">Tautan Media Sosial Resmi</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="ig_url" className="text-xs font-semibold text-neutral-300">
              Instagram URL
            </label>
            <input
              id="ig_url"
              type="url"
              value={formData.social_media.instagram}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  social_media: { ...formData.social_media, instagram: e.target.value },
                })
              }
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tiktok_url" className="text-xs font-semibold text-neutral-300">
              TikTok URL
            </label>
            <input
              id="tiktok_url"
              type="url"
              value={formData.social_media.tiktok || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  social_media: { ...formData.social_media, tiktok: e.target.value },
                })
              }
              placeholder="https://tiktok.com/@sinemus.id"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="yt_url" className="text-xs font-semibold text-neutral-300">
              YouTube Channel URL
            </label>
            <input
              id="yt_url"
              type="url"
              value={formData.social_media.youtube || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  social_media: { ...formData.social_media, youtube: e.target.value },
                })
              }
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-purple-500"
            />
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
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Kontak & Layanan'}</span>
        </button>
      </div>
    </form>
  );
}
