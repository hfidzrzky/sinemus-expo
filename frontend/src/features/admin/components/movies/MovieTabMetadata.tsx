import React, { useMemo } from 'react';
import { Film } from 'lucide-react';
import { CastInput } from '../common';
import type { CreateMoviePayload } from '../../types';

export interface MovieTabMetadataProps {
  formData: CreateMoviePayload;
  onChange: (updates: Partial<CreateMoviePayload>) => void;
}

const ALL_GENRES = [
  'Drama',
  'Horor',
  'Dokumenter',
  'Misteri',
  'Komedi',
  'Romansa',
  'Thriller',
  'Petualangan',
  'Animasi',
  'Aksi',
  'Religi',
  'Sejarah',
  'Eksperimental',
];

export function MovieTabMetadata({ formData, onChange }: MovieTabMetadataProps): React.JSX.Element {
  const toggleGenre = (genre: string) => {
    const current = formData.genre || [];
    if (current.includes(genre)) {
      onChange({ genre: current.filter((g) => g !== genre) });
    } else {
      onChange({ genre: [...current, genre] });
    }
  };

  const humanizedDuration = useMemo(() => {
    const minutes = Number(formData.duration_minutes) || 0;
    if (minutes <= 0) return 'Belum diisi';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}j ${m}m (${h} Jam ${m} Menit)`;
    if (h > 0) return `${h}j (${h} Jam)`;
    return `${m}m (${m} Menit)`;
  }, [formData.duration_minutes]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-bold text-white">Metadata & Sinopsis Film VoD</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Informasi katalog dasar, klasifikasi usia penonton, sutradara, dan deskripsi film.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Judul Film <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => {
              const title = e.target.value;
              const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
              onChange({ title, slug });
            }}
            placeholder="Contoh: Laut Bercerita"
            className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Slug */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            URL Slug Identitas <span className="font-normal text-neutral-500">(Otomatis)</span>
          </label>
          <div className="mt-1.5 flex items-center rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-neutral-400">
            <span className="select-none text-neutral-500">/film/</span>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => onChange({ slug: e.target.value })}
              className="w-full bg-transparent pl-1 font-mono text-xs text-blue-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Director */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Sutradara <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.director}
            onChange={(e) => onChange({ director: e.target.value })}
            placeholder="Nama sutradara film"
            className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Film Specifications Card (Year, Duration, Age Rating, Genre Chips) - Aligned with Event Submit */}
        <div className="my-2 space-y-4 rounded-2xl border border-neutral-800/90 bg-[#0B0F19] p-5 shadow-sm sm:col-span-2 sm:p-6">
          <div className="flex items-center gap-2.5 border-b border-neutral-800/80 pb-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Film className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-wide text-white">
                Spesifikasi Karya Film & Klasifikasi Sensor Bioskop
              </h4>
              <p className="mt-0.5 text-[11px] text-neutral-400">
                Atur tahun rilis, durasi pemutaran, klasifikasi usia LSF, dan genre film penayangan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Release Year */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300">
                Tahun Rilis <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1900"
                max="2099"
                required
                value={formData.release_year || new Date().getFullYear()}
                onChange={(e) =>
                  onChange({
                    release_year: Number(e.target.value) || new Date().getFullYear(),
                  })
                }
                placeholder="2026"
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#070A0F] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <span className="mt-1 block text-[10px] text-neutral-500">
                Rentang valid: 1900 - 2099
              </span>
            </div>

            {/* Duration Minutes */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300">
                Durasi Film (Menit) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="600"
                required
                value={formData.duration_minutes || ''}
                onChange={(e) => onChange({ duration_minutes: Number(e.target.value) || 0 })}
                placeholder="Contoh: 120"
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#070A0F] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <span className="mt-1 block text-[10px] font-medium text-blue-400">
                💡 Terbaca: {humanizedDuration}
              </span>
            </div>

            {/* Age Rating (Sensor LSF) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300">
                Klasifikasi Usia (Sensor LSF) <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.age_rating || 'SU'}
                onChange={(e) =>
                  onChange({
                    age_rating: e.target.value as CreateMoviePayload['age_rating'],
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#070A0F] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="SU">SU (Semua Umur)</option>
                <option value="13+">13+ (Remaja)</option>
                <option value="17+">17+ (Dewasa)</option>
                <option value="21+">21+ (Dewasa Khusus)</option>
              </select>
              <span className="mt-1 block text-[10px] text-neutral-500">
                Standar sensor bioskop Indonesia
              </span>
            </div>
          </div>

          {/* Genre Selection Chips */}
          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300">
                Genre Film <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-neutral-500">
                {(formData.genre || []).length} genre terpilih
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((genre) => {
                const isSelected = (formData.genre || []).includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'border border-neutral-800 bg-[#070A0F] text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {isSelected ? `✓ ${genre}` : `+ ${genre}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cast & Pemeran Karakter (Menggunakan CastInput persis seperti Submit Event) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Daftar Cast & Pemeran Karakter <span className="text-red-400">*</span>
          </label>
          <div className="mt-1.5">
            <CastInput value={formData.cast} onChange={(cast) => onChange({ cast })} />
          </div>
        </div>

        {/* Single Synopsis Input (Hapus sinopsis singkat, hanya gunakan 1 input sinopsis lengkap) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Sinopsis Lengkap <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={5}
            required
            value={formData.synopsis || formData.synopsis_full || ''}
            onChange={(e) => {
              const val = e.target.value;
              onChange({
                synopsis: val,
                synopsis_full: val,
                synopsis_short: val.slice(0, 120),
              });
            }}
            placeholder="Tulis ulasan dan deskripsi lengkap film yang memikat penonton..."
            className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs leading-relaxed text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
