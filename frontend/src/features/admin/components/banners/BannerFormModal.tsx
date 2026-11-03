import React, { useState } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useAdminMoviesQuery,
  useAdminEventsQuery,
} from '../../api';
import { CloudflareImageUpload } from '../common/CloudflareImageUpload';
import { BannerLivePreview } from './BannerLivePreview';
import type { AdminBannerItem, AdminBannerDisplayMode, CreateBannerPayload } from '../../types';

export interface BannerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannerToEdit?: AdminBannerItem | null;
  totalExistingBanners?: number;
}

interface BannerFormModalContentProps {
  onClose: () => void;
  bannerToEdit?: AdminBannerItem | null;
  totalExistingBanners?: number;
}

function BannerFormModalContent({
  onClose,
  bannerToEdit,
  totalExistingBanners = 1,
}: BannerFormModalContentProps): React.JSX.Element {
  const isEditing = Boolean(bannerToEdit);

  const { data: movies = [] } = useAdminMoviesQuery();
  const { data: events = [] } = useAdminEventsQuery();

  const [title, setTitle] = useState(bannerToEdit ? bannerToEdit.title : '');
  const [subtitle, setSubtitle] = useState(bannerToEdit ? bannerToEdit.subtitle : '');
  const [badgeText, setBadgeText] = useState<string>(bannerToEdit?.badge_text || 'PROMO SPESIAL');
  const [ageRating, setAgeRating] = useState<string>(
    bannerToEdit ? bannerToEdit.age_rating || '' : '13+'
  );
  const [genre, setGenre] = useState<string>(bannerToEdit ? bannerToEdit.genre || '' : '');
  const [releaseYear, setReleaseYear] = useState<string | number>(
    bannerToEdit && bannerToEdit.release_year ? bannerToEdit.release_year : new Date().getFullYear()
  );
  const [durationMinutes, setDurationMinutes] = useState<string | number>(
    bannerToEdit && bannerToEdit.duration_minutes ? bannerToEdit.duration_minutes : ''
  );
  const [imageUrl, setImageUrl] = useState(bannerToEdit ? bannerToEdit.image_url : '');
  const [displayMode, setDisplayMode] = useState<AdminBannerDisplayMode>(
    bannerToEdit ? bannerToEdit.display_mode : 'spotlight'
  );
  const [linkType, setLinkType] = useState<'event' | 'movie' | 'url'>(
    bannerToEdit ? bannerToEdit.link_type : 'event'
  );
  const [movieId, setMovieId] = useState<number | ''>(
    bannerToEdit && bannerToEdit.movie_id ? bannerToEdit.movie_id : ''
  );
  const [eventId, setEventId] = useState<number | ''>(
    bannerToEdit && bannerToEdit.event_id ? bannerToEdit.event_id : ''
  );
  const [targetUrl, setTargetUrl] = useState(
    bannerToEdit ? bannerToEdit.target_url || bannerToEdit.target_identifier || '' : ''
  );
  const [buttonText, setButtonText] = useState(
    bannerToEdit ? bannerToEdit.button_text : 'Beli Tiket Presale'
  );
  const [orderPriority, setOrderPriority] = useState(
    bannerToEdit ? bannerToEdit.order_priority : totalExistingBanners + 1
  );
  const [isActive, setIsActive] = useState(bannerToEdit ? bannerToEdit.is_active : true);

  const createMutation = useCreateBannerMutation();
  const updateMutation = useUpdateBannerMutation();

  // Handler auto-fill saat admin memilih Film
  const handleMovieSelect = (selectedId: string) => {
    if (!selectedId) {
      setMovieId('');
      return;
    }
    const idNum = Number(selectedId);
    setMovieId(idNum);

    const found = movies.find((m) => m.id === idNum);
    if (found) {
      setTitle(found.title);
      if (found.age_rating) {
        setAgeRating(found.age_rating);
      }
      if (found.genre) {
        setGenre(Array.isArray(found.genre) ? found.genre.join(', ') : String(found.genre));
      }
      if (found.release_year) {
        setReleaseYear(found.release_year);
      }
      if (found.duration_minutes) {
        setDurationMinutes(found.duration_minutes);
      }
      const synopsis =
        found.synopsis_short ||
        (found as unknown as { synopsis?: string }).synopsis ||
        'Tonton Sekarang di Sinemus VoD';
      setSubtitle(synopsis);
      if (!isSpotlight) {
        setBadgeText('SOROTAN FILM');
      }
      if (buttonText === 'Beli Tiket Presale' || !buttonText) {
        setButtonText('Sewa Film Sekarang');
      }
      if (found.backdrop_url && (!imageUrl || imageUrl.includes('unsplash.com'))) {
        setImageUrl(found.backdrop_url);
      }
    }
  };

  // Handler auto-fill saat admin memilih Event
  const handleEventSelect = (selectedId: string) => {
    if (!selectedId) {
      setEventId('');
      return;
    }
    const idNum = Number(selectedId);
    setEventId(idNum);

    const found = events.find((e) => e.id === idNum);
    if (found) {
      setTitle(found.title);
      if (found.age_rating) {
        setAgeRating(found.age_rating);
      }
      if (found.genre) {
        setGenre(Array.isArray(found.genre) ? found.genre.join(', ') : String(found.genre));
      }
      if (found.release_year) {
        setReleaseYear(found.release_year);
      }
      if (found.duration_minutes) {
        setDurationMinutes(found.duration_minutes);
      }
      const synopsis =
        found.synopsis_short ||
        (found.city ? `Penayangan Spesial di ${found.city}` : 'Tiket Presale Terbatas');
      setSubtitle(synopsis);
      if (!isSpotlight) {
        setBadgeText(found.cinema_partner || 'PRESALE CINEMA');
      }
      if (buttonText === 'Sewa Film Sekarang' || !buttonText) {
        setButtonText('Beli Tiket Presale');
      }
      if (found.backdrop_url && (!imageUrl || imageUrl.includes('unsplash.com'))) {
        setImageUrl(found.backdrop_url);
      }
    }
  };

  const isSpotlight =
    displayMode === 'spotlight' || displayMode === 'movie_spotlight' || displayMode === 'sorotan';
  const isImageOnly = displayMode === 'image_only';
  const hasOverlay = !isImageOnly;

  const handleDisplayModeSelect = (mode: AdminBannerDisplayMode) => {
    setDisplayMode(mode);
    const willBeSpotlight =
      mode === 'spotlight' || mode === 'movie_spotlight' || mode === 'sorotan';
    if (willBeSpotlight && linkType === 'url') {
      setLinkType('event');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl.trim()) {
      toast.error('Gambar banner wajib diunggah.');
      return;
    }

    if (isSpotlight) {
      if (linkType === 'event' && !eventId) {
        toast.error('Silakan pilih event bioskop tujuan untuk mode Sorotan.');
        return;
      }
      if (linkType === 'movie' && !movieId) {
        toast.error('Silakan pilih film VoD tujuan untuk mode Sorotan.');
        return;
      }
    } else if (displayMode === 'rich_content') {
      if (!title.trim()) {
        toast.error('Judul banner wajib diisi untuk mode Rich Content.');
        return;
      }
    }

    const resolvedTitle = isSpotlight
      ? title.trim() ||
        (linkType === 'event'
          ? events.find((e) => e.id === Number(eventId))?.title
          : movies.find((m) => m.id === Number(movieId))?.title) ||
        'Sorotan Karya'
      : displayMode === 'rich_content'
        ? title.trim()
        : title.trim() || 'Banner Image';

    const resolvedSubtitle = isSpotlight
      ? subtitle.trim() ||
        (linkType === 'event'
          ? events.find((e) => e.id === Number(eventId))?.synopsis_short
          : (movies.find((m) => m.id === Number(movieId)) as unknown as { synopsis?: string })
              ?.synopsis) ||
        ''
      : displayMode === 'rich_content'
        ? subtitle.trim()
        : '';

    const resolvedBadge = isSpotlight
      ? null
      : displayMode === 'rich_content'
        ? badgeText
          ? badgeText.trim()
          : null
        : null;

    const payload: CreateBannerPayload = {
      title: resolvedTitle,
      subtitle: resolvedSubtitle,
      badge_text: resolvedBadge,
      age_rating: isSpotlight && ageRating ? ageRating.trim() : null,
      genre: isSpotlight && genre ? genre.trim() : null,
      release_year: isSpotlight && releaseYear ? Number(releaseYear) : null,
      duration_minutes: isSpotlight && durationMinutes ? Number(durationMinutes) : null,
      image_url: imageUrl.trim(),
      display_mode: displayMode,
      link_type: isSpotlight ? (linkType === 'movie' ? 'movie' : 'event') : linkType,
      movie_id: linkType === 'movie' && movieId ? Number(movieId) : null,
      event_id: linkType === 'event' && eventId ? Number(eventId) : null,
      target_url: !isSpotlight && linkType === 'url' ? targetUrl.trim() : null,
      button_text: hasOverlay ? buttonText.trim() : '',
      order_priority: Number(orderPriority) || 1,
      is_active: isActive,
    };

    try {
      if (isEditing && bannerToEdit) {
        await updateMutation.mutateAsync({ id: bannerToEdit.id, payload });
        toast.success('Slide banner berhasil diperbarui.');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Slide banner baru berhasil diterbitkan.');
      }
      onClose();
    } catch {
      toast.error('Gagal menyimpan banner. Silakan periksa kembali formulir.');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const selectedTargetTitle = React.useMemo(() => {
    if (linkType === 'event') {
      const foundEvent = events.find((e) => e.id === Number(eventId));
      return foundEvent ? foundEvent.title : '';
    }
    if (linkType === 'movie') {
      const foundMovie = movies.find((m) => m.id === Number(movieId));
      return foundMovie ? foundMovie.title : '';
    }
    return targetUrl;
  }, [linkType, eventId, movieId, targetUrl, events, movies]);

  const resolvedPreviewTitle = isSpotlight
    ? title || selectedTargetTitle || 'Pilih Karya Terkait'
    : hasOverlay
      ? title
      : title || 'Banner Image';

  const resolvedPreviewSubtitle = isSpotlight
    ? subtitle || 'Sinopsis dan deskripsi karya akan tersinkronisasi otomatis dari database.'
    : hasOverlay
      ? subtitle
      : '';

  const resolvedPreviewBadge = isSpotlight ? '' : hasOverlay ? badgeText : '';

  const currentPayload: CreateBannerPayload = {
    title: resolvedPreviewTitle,
    subtitle: resolvedPreviewSubtitle,
    badge_text: resolvedPreviewBadge,
    age_rating: isSpotlight && ageRating ? ageRating : null,
    genre: isSpotlight && genre ? genre : null,
    release_year: isSpotlight && releaseYear ? Number(releaseYear) : null,
    duration_minutes: isSpotlight && durationMinutes ? Number(durationMinutes) : null,
    image_url: imageUrl,
    display_mode: displayMode,
    link_type: isSpotlight ? (linkType === 'movie' ? 'movie' : 'event') : linkType,
    movie_id: movieId ? Number(movieId) : null,
    event_id: eventId ? Number(eventId) : null,
    target_url: !isSpotlight && linkType === 'url' ? targetUrl : '',
    button_text: hasOverlay ? buttonText : '',
    order_priority: Number(orderPriority) || 1,
    is_active: isActive,
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
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0D111A] px-6 py-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-400" />
            <h2 className="font-display text-base font-bold text-white">
              {isEditing
                ? `Edit Banner: ${bannerToEdit?.title || 'Slide'}`
                : 'Tambah Banner Beranda Baru'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body: Split 2 Kolom (Form & Live Preview) */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Form Column */}
            <form id="banner-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Mode Tampilan Switch (3 Pilihan: Sorotan, Rich Content, Image Only) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Mode Tampilan Slide
                </label>
                <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('spotlight')}
                    className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      isSpotlight
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'
                        : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="block text-white">Sorotan</span>
                      <span className="py-0.2 rounded bg-blue-500/20 px-1 text-[8px] font-semibold text-blue-300">
                        Film & Event
                      </span>
                    </div>
                    <span className="mt-0.5 block text-[10px] font-normal text-neutral-400">
                      Metadata usia, genre, tahun, judul & CTA
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDisplayModeSelect('spotlight')}
                    className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      isSpotlight
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'
                        : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="block text-white">Sorotan</span>
                      <span className="py-0.2 rounded bg-blue-500/20 px-1 text-[8px] font-semibold text-blue-300">
                        Film & Event
                      </span>
                    </div>
                    <span className="mt-0.5 block text-[10px] font-normal text-neutral-400">
                      Otomatis dari database film / event
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDisplayModeSelect('rich_content')}
                    className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      displayMode === 'rich_content'
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30'
                        : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="block text-white">Rich Content</span>
                      <span className="py-0.2 rounded bg-indigo-500/20 px-1 text-[8px] font-semibold text-indigo-300">
                        Promo
                      </span>
                    </div>
                    <span className="mt-0.5 block text-[10px] font-normal text-neutral-400">
                      Judul, promo & CTA (tanpa usia/genre)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDisplayModeSelect('image_only')}
                    className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      isImageOnly
                        ? 'border-neutral-400/50 bg-white/5 text-white ring-1 ring-neutral-400/30'
                        : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span className="block text-white">Image Only (16:9)</span>
                    <span className="mt-0.5 block text-[10px] font-normal text-neutral-400">
                      Gambar penuh tanpa overlay teks
                    </span>
                  </button>
                </div>
              </div>

              {/* Upload Gambar Banner Landscape 16:9 */}
              <div>
                <CloudflareImageUpload
                  label="Gambar Banner Landscape (16:9)"
                  aspectRatio="16:9"
                  required
                  value={imageUrl || null}
                  onChange={(url) => setImageUrl(url || '')}
                  recommendedDimensions="1920 × 1080 px"
                  assetType="banner"
                  helperText="Unggah gambar landscape rasio 16:9 (maks 5 MB). Mendukung drag & drop atau URL."
                />
              </div>

              {/* Tipe Link & Target Item */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300">
                    Arah Tujuan Link
                  </label>
                  <select
                    value={linkType}
                    onChange={(e) => {
                      const newType = e.target.value as 'event' | 'movie' | 'url';
                      setLinkType(newType);
                      if (newType === 'event') {
                        setButtonText('Beli Tiket Presale');
                      } else if (newType === 'movie') {
                        setButtonText('Sewa Film Sekarang');
                      } else {
                        setButtonText('Lihat Detail');
                      }
                    }}
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="event">Event Penayangan Bioskop</option>
                    <option value="movie">Film VoD Streaming</option>
                    {!isSpotlight && <option value="url">URL Eksternal Bebas</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300">
                    {linkType === 'movie'
                      ? 'Pilih Film Terkait'
                      : linkType === 'event'
                        ? 'Pilih Event Terkait'
                        : 'URL Target'}
                  </label>

                  {linkType === 'movie' ? (
                    <select
                      value={movieId}
                      onChange={(e) => handleMovieSelect(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    >
                      <option value="">-- Pilih Film Katalog --</option>
                      {movies.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.release_year})
                        </option>
                      ))}
                    </select>
                  ) : linkType === 'event' ? (
                    <select
                      value={eventId}
                      onChange={(e) => handleEventSelect(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    >
                      <option value="">-- Pilih Event Bioskop --</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              </div>

              {/* Mode Sorotan: Pengaturan Tombol Aksi (CTA) */}
              {isSpotlight && (
                <div className="rounded-xl border border-neutral-800/80 bg-[#080B10] p-3.5">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Label Tombol CTA
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder={linkType === 'event' ? 'Beli Tiket Presale' : 'Sewa Film Sekarang'}
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                  />
                  <span className="mt-1 block text-[10px] text-neutral-500">
                    Tombol aksi penonton pada carousel beranda.
                  </span>
                </div>
              )}

              {/* Mode Rich Content: Input Judul, Subtitle, Badge, CTA */}
              {displayMode === 'rich_content' && (
                <div className="space-y-3 rounded-xl border border-neutral-800/80 bg-[#080B10] p-3.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-neutral-300">
                      Tipografi & Konten Promosi
                    </label>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[8px] font-semibold text-indigo-300">
                      Rich Content
                    </span>
                  </div>

                  {/* Judul Banner */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300">
                      Judul Slide Utama <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: PROMO SPESIAL AKHIR PEKAN"
                      className="mt-1 w-full rounded-lg border border-neutral-800 bg-[#0D111A] px-3 py-1.5 font-display text-xs font-bold text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Subtitle / Sinopsis Pendek */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300">
                      Subjudul / Deskripsi Singkat
                    </label>
                    <textarea
                      rows={2}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Teks keterangan singkat promosi..."
                      className="mt-1 w-full rounded-lg border border-neutral-800 bg-[#0D111A] px-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Badge Text & Button Text */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300">
                        Teks Badge Promosi
                      </label>
                      <input
                        type="text"
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value.toUpperCase())}
                        placeholder="Contoh: PROMO SPESIAL"
                        className="mt-1 w-full rounded-lg border border-neutral-800 bg-[#0D111A] px-3 py-1.5 text-xs uppercase text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300">
                        Label Tombol CTA
                      </label>
                      <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Contoh: Klaim Promo"
                        className="mt-1 w-full rounded-lg border border-neutral-800 bg-[#0D111A] px-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Prioritas Urutan & Status */}
              <div className="grid grid-cols-2 items-center gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300">
                    Prioritas Urutan Slide
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="is_active_banner"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active_banner" className="text-xs text-neutral-300">
                    Tampilkan di Beranda
                  </label>
                </div>
              </div>
            </form>

            {/* Live Preview Column */}
            <div className="flex flex-col justify-start">
              <BannerLivePreview
                banner={currentPayload}
                targetTitle={selectedTargetTitle}
                className="sticky top-0"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-neutral-800 bg-[#0D111A] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="banner-form"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isEditing ? 'Simpan Slide' : 'Terbitkan Slide'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function BannerFormModal(props: BannerFormModalProps): React.JSX.Element | null {
  if (!props.isOpen) return null;
  return <BannerFormModalContent key={props.bannerToEdit?.id ?? 'new'} {...props} />;
}
