import React from 'react';
import { Clock } from 'lucide-react';
import { usePublicSettingsQuery } from '../../api';
import type { CreateMoviePayload } from '../../types';

export interface MovieTabPricingProps {
  formData: CreateMoviePayload;
  onChange: (updates: Partial<CreateMoviePayload>) => void;
}

export function MovieTabPricing({ formData, onChange }: MovieTabPricingProps): React.JSX.Element {
  const { data: publicSettings } = usePublicSettingsQuery();
  const defaultRentalHours = publicSettings?.business_policies.vod_rental_duration_hours ?? 48;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-bold text-white">
          Model Akses & Tarif Sewa Streaming
        </h3>
        <p className="mt-1 text-xs text-neutral-400">
          Tentukan skema monetisasi film digital VoD dan durasi tonton aktif setelah pembayaran.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Access Model (Hanya 2 model akses: rental dan free) */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300">
            Model Akses Tonton <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.access_model}
            onChange={(e) => {
              const selectedModel = e.target.value as CreateMoviePayload['access_model'];
              if (selectedModel === 'free') {
                onChange({ access_model: 'free', rental_price: 0 });
              } else {
                onChange({
                  access_model: 'rental',
                  rental_price: formData.rental_price > 0 ? formData.rental_price : 25000,
                });
              }
            }}
            className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="rental">Sewa Digital Berbayar (Pay-per-View)</option>
            <option value="free">Penayangan Gratis / Komunal (Free Access)</option>
          </select>
        </div>

        {/* Rental Price */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300">
            Tarif Sewa (Rp){' '}
            {formData.access_model === 'rental' && <span className="text-red-400">*</span>}
          </label>
          <div className="relative mt-1.5">
            <input
              type="text"
              inputMode="numeric"
              disabled={formData.access_model !== 'rental'}
              value={formData.rental_price === 0 ? '' : formData.rental_price}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const rawDigits = e.target.value.replace(/\D/g, '');
                const cleaned = rawDigits.replace(/^0+(?=\d)/, '');
                onChange({ rental_price: cleaned === '' ? 0 : Number(cleaned) });
              }}
              className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-8 pr-3.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none disabled:opacity-40"
            />
            <span className="pointer-events-none absolute left-3 top-2.5 text-xs text-neutral-500">
              Rp
            </span>
          </div>
          <span className="mt-1 block text-[10px] text-neutral-500">
            Harga standar film indie: Rp 15.000 - Rp 35.000
          </span>
        </div>

        {/* Active Rental Duration */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300">
            Durasi Akses Sewa (Jam) <span className="text-red-400">*</span>
          </label>
          <div className="relative mt-1.5">
            <input
              type="text"
              inputMode="numeric"
              value={
                formData.active_rental_duration_hours === 0
                  ? ''
                  : (formData.active_rental_duration_hours ?? defaultRentalHours)
              }
              placeholder={String(defaultRentalHours)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const rawDigits = e.target.value.replace(/\D/g, '');
                const cleaned = rawDigits.replace(/^0+(?=\d)/, '');
                onChange({ active_rental_duration_hours: cleaned === '' ? 0 : Number(cleaned) });
              }}
              onBlur={() => {
                if (
                  formData.active_rental_duration_hours === undefined ||
                  formData.active_rental_duration_hours <= 0
                ) {
                  onChange({ active_rental_duration_hours: defaultRentalHours });
                }
              }}
              className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-8 pr-3.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
            />
            <Clock className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-neutral-500" />
          </div>
          <span className="mt-1 block text-[10px] text-neutral-500">
            Standar pengaturan platform Sinemus: {defaultRentalHours} Jam
          </span>
        </div>

        {/* Switches */}
        <div className="flex flex-wrap gap-6 border-t border-neutral-800/80 pt-4 sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-white">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => onChange({ is_published: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
            />
            Publikasikan ke Katalog VoD (Tersedia untuk disewa)
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-white">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => onChange({ is_featured: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
            />
            Sorot sebagai Film Pilihan (Featured Carousel)
          </label>
        </div>
      </div>
    </div>
  );
}
