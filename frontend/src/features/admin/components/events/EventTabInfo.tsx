import React, { useMemo } from 'react';
import { CalendarRange, Sparkles, Clock, Film } from 'lucide-react';
import { usePresaleStatus } from '@/features/events';
import { CastInput, DateTimePicker24, CloudflareStreamInput } from '../common';
import type { CreateEventPayload } from '../../types';

export interface EventTabInfoProps {
  formData: CreateEventPayload;
  onChange: (updates: Partial<CreateEventPayload>) => void;
}

const ALL_EVENT_GENRES = [
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

export function EventTabInfo({ formData, onChange }: EventTabInfoProps): React.JSX.Element {
  // Live Presale status badge calculation via shared headless hook (menghormati event_concludes_at)
  const presaleStatus = usePresaleStatus(
    formData.presale_start_at,
    formData.presale_end_at,
    undefined,
    formData.event_type === 'presale_cinema',
    formData.event_concludes_at
  );

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

  // Otomatis deteksi estimasi bulan penayangan dari jadwal venue atau presale window
  const derivedMonthDisplay = useMemo(() => {
    const firstShowTime = formData.venues?.[0]?.schedules?.[0]?.show_time;
    const refDateStr = firstShowTime || formData.presale_end_at || formData.presale_start_at;
    if (!refDateStr) return 'Belum Ada Jadwal (Atur di Tab 2)';

    try {
      const d = new Date(refDateStr);
      if (isNaN(d.getTime())) return 'Belum Ada Jadwal';
      const monthNames = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];
      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return 'Belum Ada Jadwal';
    }
  }, [formData.venues, formData.presale_end_at, formData.presale_start_at]);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-bold text-white">Informasi Dasar & Media Event</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Atur judul, format penayangan bioskop, sinopsis, dan aset grafis event.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Judul Event Penayangan <span className="text-red-400">*</span>
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
            placeholder="Contoh: Cinta dan Sejarah (CDS) - Special Screening"
            className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Slug */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            URL Slug Identitas <span className="font-normal text-neutral-500">(Otomatis)</span>
          </label>
          <div className="mt-1.5 flex items-center rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-neutral-400">
            <span className="select-none text-neutral-500">/event/</span>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => onChange({ slug: e.target.value })}
              className="w-full bg-transparent pl-1 font-mono text-xs text-blue-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300">
            Format Penayangan <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.event_type}
            onChange={(e) =>
              onChange({ event_type: e.target.value as CreateEventPayload['event_type'] })
            }
            className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="presale_cinema">Presale Komersial Bioskop (XXI / Partner)</option>
            <option value="regular">Penayangan Reguler Sinemus Space</option>
          </select>
        </div>

        {/* Seating Type */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300">
            Tipe Tempat Duduk <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.seating_type}
            onChange={(e) =>
              onChange({ seating_type: e.target.value as CreateEventPayload['seating_type'] })
            }
            className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="assigned_seating">Denah Kursi Tetap (Assigned Seating)</option>
            <option value="general_admission">Kapasitas Bebas / Berdiri (General Admission)</option>
          </select>
        </div>

        {/* Cinema Partner */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Mitra Bioskop (Cinema Partner){' '}
            <span className="font-normal text-neutral-500">(Opsional jika Presale)</span>
          </label>
          <input
            type="text"
            list="cinema-partner-options"
            value={formData.cinema_partner || ''}
            onChange={(e) => onChange({ cinema_partner: e.target.value })}
            placeholder="Contoh: Cinema XXI / CGV / Cinepolis"
            className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
          <datalist id="cinema-partner-options">
            <option value="Cinema XXI" />
            <option value="CGV Cinemas" />
            <option value="Cinepolis" />
            <option value="Sinemus Space" />
            <option value="Indie Theater" />
          </datalist>
        </div>

        {/* Sales Window & Auto-Draft Block (Universal for Regular & Presale) */}
        <div className="my-2 space-y-5 rounded-2xl border border-neutral-800/90 bg-[#0B0F19] p-5 shadow-sm sm:col-span-2 sm:p-6">
          {/* Header: Title & Live Status */}
          <div className="flex flex-col gap-3 border-b border-neutral-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <CalendarRange className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wide text-white">
                  {formData.event_type === 'presale_cinema'
                    ? 'Jendela Waktu Penjualan Presale (Presale Window)'
                    : 'Jendela Waktu Penjualan Tiket (Sales Window)'}
                </h4>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  {formData.event_type === 'presale_cinema'
                    ? 'Periode resmi saat kuota tiket bioskop dibuka untuk publik.'
                    : 'Periode aktif pemesanan tiket. Pisahkan waktu tutup tiket dengan waktu selesai acara agar UX penonton optimal.'}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex flex-shrink-0 items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] text-neutral-500">Status Penjualan:</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${presaleStatus.badgeStyle}`}
              >
                {presaleStatus.isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                )}
                {presaleStatus.label}
              </span>
            </div>
          </div>

          {/* Datetime Inputs (2-Column Spacious Cards) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-800/80 bg-[#070A0F]/70 p-4 transition-all hover:border-neutral-700/80">
              <DateTimePicker24
                label={
                  formData.event_type === 'presale_cinema'
                    ? 'Mulai Penjualan Presale'
                    : 'Mulai Penjualan Tiket'
                }
                icon={<Clock className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />}
                value={formData.presale_start_at}
                defaultTime="00:00"
                onChange={(val) => onChange({ presale_start_at: val, sales_start_at: val })}
              />
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-[#070A0F]/70 p-4 transition-all hover:border-neutral-700/80">
              <DateTimePicker24
                label={
                  formData.event_type === 'presale_cinema'
                    ? 'Batas Akhir Penjualan Presale'
                    : 'Batas Akhir Penjualan Tiket'
                }
                icon={<Clock className="h-3.5 w-3.5 flex-shrink-0 text-rose-400" />}
                value={formData.presale_end_at}
                defaultTime="23:59"
                minDate={
                  formData.presale_start_at ? formData.presale_start_at.slice(0, 10) : undefined
                }
                onChange={(val) => onChange({ presale_end_at: val, sales_end_at: val })}
              />
            </div>
          </div>

          {/* Waktu Selesai Acara & Auto-Draft Card (Khusus Penayangan Reguler / Multi Sesi) */}
          <div className="rounded-xl border border-neutral-800/70 bg-[#070A0F]/50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h5 className="text-xs font-semibold text-neutral-200">
                  Waktu Penayangan Selesai (Otomatis Masuk Draf & Hilang dari Beranda)
                </h5>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  Begitu penayangan selesai, event otomatis draf dan tidak lagi muncul di beranda
                  penonton.
                </p>
              </div>
              {formData.event_concludes_at && (
                <button
                  type="button"
                  onClick={() => onChange({ event_concludes_at: null })}
                  className="self-start text-[10px] font-medium text-amber-400 hover:underline sm:self-auto"
                >
                  Gunakan Hitungan Otomatis Sesi Terakhir
                </button>
              )}
            </div>

            <div className="mt-3">
              <DateTimePicker24
                label="Waktu Acara Berakhir (Opsional - Kosongkan jika ingin auto-derive dari jam tayang terakhir + durasi)"
                icon={<Clock className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />}
                value={formData.event_concludes_at}
                defaultTime="23:00"
                minDate={formData.presale_end_at ? formData.presale_end_at.slice(0, 10) : undefined}
                onChange={(val) => onChange({ event_concludes_at: val })}
              />
            </div>
          </div>

          {/* Auto-Derivation Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/80 pt-3.5 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <span className="text-neutral-400">Target Tayang Otomatis:</span>
              <span className="font-semibold tracking-wide text-white">{derivedMonthDisplay}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
              <span>Auto-sync jadwal bioskop di Tab 2</span>
            </div>
          </div>
        </div>

        {/* Film Specifications Card (Year, Duration, Age Rating, Genre Chips) */}
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
                placeholder="2024"
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
                placeholder="Contoh: 125"
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#070A0F] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <span className="mt-1 block text-[10px] font-medium text-blue-400">
                💡 Terbaca: {humanizedDuration}
              </span>
            </div>

            {/* Age Rating */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300">
                Klasifikasi Usia (Sensor LSF) <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.age_rating || 'SU'}
                onChange={(e) =>
                  onChange({
                    age_rating: e.target.value as CreateEventPayload['age_rating'],
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
              {ALL_EVENT_GENRES.map((genre) => {
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

        {/* Director */}
        <div>
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

        {/* Cloudflare Teaser UID */}
        <div className="sm:col-span-2">
          <CloudflareStreamInput
            label="Cloudflare Stream Teaser UID"
            optional
            value={formData.cloudflare_teaser_uid || null}
            onChange={(val) => onChange({ cloudflare_teaser_uid: val })}
            placeholder="Contoh: e39b7a1f8c424df39c14ad539281a1bb"
            helperText="Video teaser publik untuk memikat calon penonton di halaman detail screening."
          />
        </div>

        {/* Cast & Pemeran (Aktor & Karakter) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Daftar Cast & Pemeran Karakter <span className="text-red-400">*</span>
          </label>
          <div className="mt-1.5">
            <CastInput value={formData.cast} onChange={(cast) => onChange({ cast })} />
          </div>
        </div>

        {/* Short Synopsis */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Sinopsis Singkat <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.synopsis_short}
            onChange={(e) => onChange({ synopsis_short: e.target.value })}
            placeholder="Ringkasan 1-2 kalimat untuk thumbnail kartu event"
            className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Full Description */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Deskripsi Lengkap / Sinopsis Penuh <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Sinopsis lengkap karya, latar belakang cerita, sesi Q&A bersama filmmaker, dan catatan penting bagi penonton..."
            className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Published & Featured Controls */}
        <div className="grid grid-cols-1 gap-4 pt-3 sm:col-span-2 sm:grid-cols-2">
          {/* Published Toggle Card */}
          <div
            onClick={() => {
              const nextPublished = !formData.is_published;
              onChange({
                is_published: nextPublished,
                is_featured: nextPublished ? Boolean(formData.is_featured) : false,
              });
            }}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
              formData.is_published
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : 'border-neutral-800 bg-[#0D111A]'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(formData.is_published)}
              onChange={(e) => {
                const nextPublished = e.target.checked;
                onChange({
                  is_published: nextPublished,
                  is_featured: nextPublished ? Boolean(formData.is_featured) : false,
                });
              }}
              className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white">
                Publikasikan ke Katalog Pengguna (Live)
              </span>
              <p className="text-[11px] text-neutral-400">
                {formData.is_published
                  ? 'Event aktif dan dapat dilihat serta dipesan oleh seluruh penonton.'
                  : 'Event disimpan sebagai draf internal dan tidak muncul di katalog publik.'}
              </p>
            </div>
          </div>

          {/* Featured Toggle Card */}
          <div
            onClick={() => {
              if (!formData.is_published) return;
              onChange({ is_featured: !formData.is_featured });
            }}
            className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all ${
              !formData.is_published
                ? 'cursor-not-allowed border-neutral-800/50 bg-[#0D111A]/40 opacity-50'
                : formData.is_featured
                  ? 'cursor-pointer border-amber-500/40 bg-amber-950/20'
                  : 'cursor-pointer border-neutral-800 bg-[#0D111A]'
            }`}
          >
            <input
              type="checkbox"
              disabled={!formData.is_published}
              checked={Boolean(formData.is_published && formData.is_featured)}
              onChange={(e) => {
                if (!formData.is_published) return;
                onChange({ is_featured: e.target.checked });
              }}
              className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500 disabled:opacity-50"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">
                  Jadikan Event Pilihan Utama (Featured)
                </span>
                {formData.is_published && formData.is_featured && (
                  <Sparkles className="h-3 w-3 text-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {!formData.is_published
                  ? 'Aktifkan publikasi terlebih dahulu untuk menandai event sebagai pilihan utama.'
                  : formData.is_featured
                    ? 'Diprioritaskan di urutan teratas katalog dan bertanda lencana PILIHAN.'
                    : 'Tampilkan dengan urutan dan tata letak reguler di katalog.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
