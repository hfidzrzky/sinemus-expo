import React, { useState } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useAdminMoviesQuery,
  useAdminEventsQuery,
  BannerLivePreview,
  CloudflareImageUpload,
  type AdminBannerItem,
  type AdminBannerDisplayMode,
  type CreateBannerPayload,
} from '@/features/admin';

export interface AdminBannerEditorPageProps {
  bannerId?: number;
  onNavigate: (path: string) => void;
}

export function AdminBannerEditorPage({
  bannerId,
  onNavigate,
}: AdminBannerEditorPageProps): React.JSX.Element {
  const isEditing = Boolean(bannerId);

  const { data: banners = [], isLoading: isLoadingBanners } = useAdminBannersQuery();
  const { data: movies = [], isLoading: isLoadingMovies } = useAdminMoviesQuery();
  const { data: events = [], isLoading: isLoadingEvents } = useAdminEventsQuery();

  const bannerToEdit = isEditing ? banners.find((b) => b.id === bannerId) || null : null;

  return (
    <AdminBannerEditorForm
      key={bannerToEdit?.id ?? (isEditing ? 'loading' : 'new')}
      bannerToEdit={bannerToEdit}
      isEditing={isEditing}
      isLoadingBanner={isEditing && isLoadingBanners && !bannerToEdit}
      totalExistingBanners={banners.length}
      movies={movies}
      events={events}
      isLoadingMovies={isLoadingMovies}
      isLoadingEvents={isLoadingEvents}
      onNavigate={onNavigate}
    />
  );
}

interface AdminBannerEditorFormProps {
  bannerToEdit: AdminBannerItem | null;
  isEditing: boolean;
  isLoadingBanner: boolean;
  totalExistingBanners: number;
  movies: Array<{
    id: number;
    title: string;
    synopsis_short?: string | null;
    synopsis?: string | null;
    age_rating?: string | null;
    genre?: string | string[] | null;
    release_year?: number | null;
    duration_minutes?: number | null;
    backdrop_url?: string | null;
  }>;
  events: Array<{
    id: number;
    title: string;
    cinema_partner?: string | null;
    city?: string | null;
    age_rating?: string | null;
    genre?: string | string[] | null;
    release_year?: number | null;
    duration_minutes?: number | null;
    synopsis_short?: string | null;
    backdrop_url?: string | null;
  }>;
  isLoadingMovies: boolean;
  isLoadingEvents: boolean;
  onNavigate: (path: string) => void;
}

function AdminBannerEditorForm({
  bannerToEdit,
  isEditing,
  isLoadingBanner,
  totalExistingBanners,
  movies,
  events,
  isLoadingMovies,
  isLoadingEvents,
  onNavigate,
}: AdminBannerEditorFormProps): React.JSX.Element {
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

  // Auto-fill saat memilih referensi Film
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

  // Auto-fill saat memilih referensi Event
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
        toast.error('Pilih Event Bioskop tujuan untuk mode Sorotan.');
        return;
      }
      if (linkType === 'movie' && !movieId) {
        toast.error('Pilih Film VoD tujuan untuk mode Sorotan.');
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
      target_url: !isSpotlight && linkType === 'url' ? targetUrl.trim() : '',
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
      onNavigate('/admin/banners');
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

  if (isLoadingBanner) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman & Navigasi */}
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/admin/banners')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-[#0B0E14] text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
            title="Kembali ke Daftar Banner"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-xl font-extrabold text-white sm:text-2xl">
              {isEditing
                ? `Edit: ${bannerToEdit?.title || 'Slide Banner'}`
                : 'Tambah Banner Beranda'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('/admin/banners')}
            disabled={isPending}
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="banner-editor-form"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isEditing ? 'Simpan Slide' : 'Terbitkan Slide'}</span>
          </button>
        </div>
      </div>

      {/* Grid Konten: 2 Kolom di Desktop (Formulir & Live Preview Sticky), 1 Kolom di Mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Formulir Pengaturan Banner (Kolom Kiri - 7 Kolom) */}
        <div className="lg:col-span-7">
          <form
            id="banner-editor-form"
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5 sm:p-6"
          >
            {/* Mode Tampilan Switch (3 Pilihan: Sorotan, Rich Content, Image Only) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Mode Tampilan Slide
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleDisplayModeSelect('spotlight')}
                  className={`rounded-xl border p-3 text-left transition ${
                    isSpotlight
                      ? 'border-blue-500 bg-blue-500/10 text-white shadow-sm ring-1 ring-blue-500/50'
                      : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold text-blue-400">Sorotan</span>
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-blue-300">
                      Film & Event
                    </span>
                  </div>
                  <span className="mt-1 block text-[11px] leading-relaxed text-neutral-400">
                    Otomatis mengambil judul, sinopsis, badge, dan metadata sinematik langsung dari
                    karya.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDisplayModeSelect('rich_content')}
                  className={`rounded-xl border p-3 text-left transition ${
                    displayMode === 'rich_content'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm ring-1 ring-indigo-500/50'
                      : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold text-indigo-400">Rich Content</span>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300">
                      Promo
                    </span>
                  </div>
                  <span className="mt-1 block text-[11px] leading-relaxed text-neutral-400">
                    Menampilkan judul, subtitle, badge promosi, dan CTA (tanpa usia, genre, dan
                    tahun).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDisplayModeSelect('image_only')}
                  className={`rounded-xl border p-3 text-left transition ${
                    isImageOnly
                      ? 'border-neutral-400 bg-white/5 text-white shadow-sm ring-1 ring-neutral-400/50'
                      : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <span className="block text-xs font-bold text-neutral-200">Image Only</span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-neutral-400">
                    Banner grafis penuh 16:9 yang sudah memiliki tipografi/artwork terpadu tanpa
                    overlay teks.
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
                helperText="Unggah gambar landscape resmi rasio 16:9 (maks 5 MB). Mendukung drag & drop berkas atau input URL langsung."
              />
            </div>

            {/* Hubungkan ke Film / Event (Aksi Navigasi) */}
            <div className="space-y-4 rounded-xl border border-neutral-800/80 bg-[#080B10] p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Target Klik & Integrasi Data
              </label>

              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Tipe Tujuan Klik
                </label>
                <div className={`mt-1.5 grid ${isSpotlight ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                  {(isSpotlight
                    ? (['event', 'movie'] as const)
                    : (['event', 'movie', 'url'] as const)
                  ).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLinkType(type)}
                      className={`rounded-lg border py-2 text-xs font-semibold transition ${
                        linkType === type
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-neutral-800 bg-[#0D111A] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {type === 'event'
                        ? 'Event Bioskop'
                        : type === 'movie'
                          ? 'Film VoD'
                          : 'URL Kustom'}
                    </button>
                  ))}
                </div>
              </div>

              {linkType === 'event' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300">
                    Pilih Event Bioskop Tujuan
                  </label>
                  <select
                    value={eventId}
                    onChange={(e) => handleEventSelect(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-blue-500"
                  >
                    <option value="">-- Pilih Event Bioskop --</option>
                    {isLoadingEvents ? (
                      <option disabled>Memuat daftar event...</option>
                    ) : (
                      events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} {ev.city ? `(${ev.city})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="mt-1 block text-[11px] text-neutral-500">
                    Memilih event akan otomatis menyinkronkan judul, sinopsis, badge, dan metadata.
                  </span>
                </div>
              )}

              {linkType === 'movie' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300">
                    Pilih Film VoD Tujuan
                  </label>
                  <select
                    value={movieId}
                    onChange={(e) => handleMovieSelect(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-blue-500"
                  >
                    <option value="">-- Pilih Film VoD --</option>
                    {isLoadingMovies ? (
                      <option disabled>Memuat daftar film...</option>
                    ) : (
                      movies.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} {m.release_year ? `(${m.release_year})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="mt-1 block text-[11px] text-neutral-500">
                    Memilih film akan otomatis menyinkronkan judul, sinopsis, usia, genre, dan tahun
                    rilis.
                  </span>
                </div>
              )}

              {!isSpotlight && linkType === 'url' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300">
                    Target URL / Path Tujuan
                  </label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://... atau /events/slug"
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Mode Sorotan: Pengaturan Tombol Aksi (CTA) */}
            {isSpotlight && (
              <div className="rounded-xl border border-neutral-800/80 bg-[#080B10] p-4">
                <label className="block text-xs font-semibold text-neutral-300">
                  Teks Tombol Aksi (CTA)
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder={linkType === 'event' ? 'Beli Tiket Presale' : 'Sewa Film Sekarang'}
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition focus:border-blue-500"
                />
                <span className="mt-1 block text-[11px] text-neutral-500">
                  Label tombol aksi pada pratinjau carousel beranda publik.
                </span>
              </div>
            )}

            {/* Mode Rich Content: Input Judul, Badge, Subtitle, dan CTA */}
            {displayMode === 'rich_content' && (
              <div className="space-y-4 rounded-xl border border-neutral-800/80 bg-[#080B10] p-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Tipografi & Konten Promosi
                  </label>
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                    Mode Rich Content
                  </span>
                </div>

                {/* Judul & Badge */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300">
                      Judul Banner <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Promo Spesial Akhir Pekan"
                      className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300">
                      Teks Badge Promo
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="Contoh: DISKON EKSKLUSIF"
                      className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300">
                    Deskripsi Ringkas (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Contoh: Dapatkan voucher sewa film hingga 50% untuk film pilihan."
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300">
                    Teks Tombol Aksi (CTA)
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Contoh: Klaim Promo Sekarang"
                    className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Prioritas & Status Aktif */}
            <div className="grid grid-cols-1 gap-4 border-t border-neutral-800 pt-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300">
                  Prioritas Urutan Slide (Urutan Tampil)
                </label>
                <input
                  type="number"
                  min={1}
                  value={orderPriority}
                  onChange={(e) => setOrderPriority(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-blue-500"
                />
                <span className="mt-1 block text-[11px] text-neutral-500">
                  Angka lebih kecil tampil lebih awal pada carousel.
                </span>
              </div>

              <div className="flex flex-col justify-center pt-2 sm:pt-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active_banner_page"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-neutral-200">
                      Tampilkan di Beranda Publik
                    </span>
                    <span className="block text-[11px] text-neutral-400">
                      Aktifkan slide agar langsung dapat dilihat penonton.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Live Preview Sticky (Kolom Kanan - 5 Kolom) */}
        <div className="lg:col-span-5">
          <BannerLivePreview banner={currentPayload} targetTitle={selectedTargetTitle} />
        </div>
      </div>
    </div>
  );
}
