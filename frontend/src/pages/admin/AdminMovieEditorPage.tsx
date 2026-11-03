import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { ApiError } from '@/lib/api-client';
import type { ApiErrorResponse } from '@/types/api';
import {
  useAdminMovieDetailQuery,
  useCreateMovieMutation,
  useUpdateMovieMutation,
  MovieTabMetadata,
  MovieTabPricing,
  MovieTabStreamConfig,
  MovieLookFilmsUploader,
  AdminStreamTestModal,
  AdminMediaUploadCard,
  useMultiTabForm,
  usePublicSettingsQuery,
  type CreateMoviePayload,
  type MovieFormTab,
} from '@/features/admin';
import { formatMovieDuration } from '@/features/movies';

export interface AdminMovieEditorPageProps {
  movieId?: number;
  onNavigate: (path: string) => void;
}

const DEFAULT_MOVIE_FORM: CreateMoviePayload = {
  title: '',
  slug: '',
  synopsis: '',
  synopsis_short: '',
  synopsis_full: '',
  director: '',
  cast: [],
  genre: ['Drama'],
  release_year: 2026,
  duration_minutes: 105,
  age_rating: '13+',
  poster_url: '',
  backdrop_url: '',
  look_films: [],
  cloudflare_video_uid: '',
  cloudflare_trailer_uid: null,
  access_model: 'rental',
  rental_price: 25000,
  active_rental_duration_hours: 48,
  is_published: true,
  is_featured: false,
};

const TABS: Array<{ id: MovieFormTab; label: string }> = [
  { id: 'metadata', label: '1. Metadata & Sinopsis' },
  { id: 'pricing', label: '2. Skema & Tarif Sewa' },
  { id: 'stream', label: '3. Video & Streaming' },
  { id: 'looks', label: '4. Looks Film' },
];

interface MovieEditorFormProps {
  initialData: CreateMoviePayload;
  movieId?: number;
  onNavigate: (path: string) => void;
}

const MOVIE_DRAFT_STORAGE_KEY = 'sinemus_admin_movie_form_draft';

function MovieEditorForm({
  initialData,
  movieId,
  onNavigate,
}: MovieEditorFormProps): React.JSX.Element {
  const isEditMode = Boolean(movieId);

  // Inisialisasi form: Jika create mode dan ada draf di sessionStorage, pulihkan draf tersebut
  const [formData, setFormData] = useState<CreateMoviePayload>(() => {
    if (!isEditMode) {
      try {
        const savedDraft = sessionStorage.getItem(MOVIE_DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft) as CreateMoviePayload;
          return { ...initialData, ...parsed };
        }
      } catch {
        // Abaikan jika corrupt
      }
    }
    return initialData;
  });

  // Sinkronkan perubahan form ke sessionStorage saat mode tambah film baru
  useEffect(() => {
    if (!isEditMode) {
      try {
        sessionStorage.setItem(MOVIE_DRAFT_STORAGE_KEY, JSON.stringify(formData));
      } catch {
        // Kuota / SSR safe
      }
    }
  }, [formData, isEditMode]);

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testStreamConfig, setTestStreamConfig] = useState<{ uid: string; title: string }>({
    uid: '',
    title: '',
  });

  const handleOpenTestModal = (uid?: string, title?: string) => {
    setTestStreamConfig({
      uid: uid || formData.cloudflare_video_uid,
      title: title || `${formData.title || 'Film'} (Full Movie)`,
    });
    setIsTestModalOpen(true);
  };

  const { activeTab, setActiveTab, goToNextTab, goToPreviousTab, hasNext, hasPrevious } =
    useMultiTabForm(TABS, 'metadata');

  const createMutation = useCreateMovieMutation();
  const updateMutation = useUpdateMovieMutation(movieId);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleUpdateField = (updates: Partial<CreateMoviePayload>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Metadata & Sinopsis (Tab 1)
    if (!formData.title.trim()) {
      toast.error('Judul film wajib diisi.');
      setActiveTab('metadata');
      return;
    }

    if (!formData.director?.trim()) {
      toast.error('Nama sutradara film wajib diisi.');
      setActiveTab('metadata');
      return;
    }

    const releaseYear = Number(formData.release_year);
    if (!releaseYear || releaseYear < 1900 || releaseYear > 2099) {
      toast.error('Tahun rilis film harus antara 1900 hingga 2099.');
      setActiveTab('metadata');
      return;
    }

    const durationMinutes = Number(formData.duration_minutes);
    if (!durationMinutes || durationMinutes < 1 || durationMinutes > 600) {
      toast.error('Durasi film harus di antara 1 hingga 600 menit.');
      setActiveTab('metadata');
      return;
    }

    if (!formData.genre || formData.genre.length === 0) {
      toast.error('Genre film wajib dipilih minimal 1 kategori.');
      setActiveTab('metadata');
      return;
    }

    if (!formData.cast || formData.cast.length === 0) {
      toast.error('Daftar pemeran utama film wajib diisi minimal 1 orang.');
      setActiveTab('metadata');
      return;
    }

    const synopsisText = (formData.synopsis || formData.synopsis_full || '').trim();
    if (!synopsisText) {
      toast.error('Sinopsis film wajib diisi.');
      setActiveTab('metadata');
      return;
    }
    if (synopsisText.length < 20) {
      toast.error('Sinopsis film minimal 20 karakter.');
      setActiveTab('metadata');
      return;
    }

    // 2. Validasi Skema & Tarif Sewa (Tab 2)
    if (
      formData.access_model === 'rental' &&
      (formData.rental_price === undefined ||
        formData.rental_price === null ||
        Number(formData.rental_price) < 1000)
    ) {
      toast.error('Tarif sewa film berbayar wajib diisi (minimal Rp 1.000).');
      setActiveTab('pricing');
      return;
    }

    // 3. Validasi Video & Streaming HLS (Tab 3)
    const videoUid = (formData.cloudflare_video_uid || '').trim();
    if (!videoUid) {
      toast.error('Cloudflare Stream Video UID (Full Movie) wajib diisi.');
      setActiveTab('stream');
      return;
    }
    const hex32Regex = /^[a-f0-9]{32}$/i;
    if (!hex32Regex.test(videoUid)) {
      toast.error(
        'Format Cloudflare Stream Video UID harus berupa 32 karakter heksadesimal (0-9, a-f).'
      );
      setActiveTab('stream');
      return;
    }

    const trailerUid = (formData.cloudflare_trailer_uid || '').trim();
    if (trailerUid && !hex32Regex.test(trailerUid)) {
      toast.error(
        'Format Cloudflare Stream Trailer UID harus berupa 32 karakter heksadesimal (0-9, a-f).'
      );
      setActiveTab('stream');
      return;
    }

    // 4. Validasi Visual Media Assets (Poster portrait 2:3 & Backdrop banner 16:9)
    if (!formData.poster_url?.trim()) {
      toast.error(
        'Poster portrait resmi film (2:3) wajib diunggah pada kartu Aset Visual & Media.'
      );
      return;
    }

    if (!formData.backdrop_url?.trim()) {
      toast.error(
        'Backdrop banner lanskap film (16:9) wajib diunggah pada kartu Aset Visual & Media.'
      );
      return;
    }

    const payload: CreateMoviePayload = {
      ...formData,
      synopsis: synopsisText,
      synopsis_full: synopsisText,
      synopsis_short: synopsisText.slice(0, 120),
    };

    try {
      if (isEditMode && movieId) {
        await updateMutation.mutateAsync({ id: movieId, data: payload });
        toast.success(`Film "${formData.title}" berhasil diperbarui.`);
      } else {
        await createMutation.mutateAsync(payload);
        try {
          sessionStorage.removeItem(MOVIE_DRAFT_STORAGE_KEY);
        } catch {
          // ignore
        }
        toast.success(`Film baru "${formData.title}" berhasil ditambahkan.`);
      }
      onNavigate('/admin/movies');
    } catch (error: unknown) {
      let responseErrors: Record<string, string[]> | undefined;
      let errorMsg: string | undefined;

      if (error instanceof ApiError) {
        const raw = error.rawData as ApiErrorResponse | undefined;
        responseErrors = raw?.errors;
        errorMsg = error.message;
      } else if (isAxiosError(error) && error.response?.data) {
        const raw = error.response.data as ApiErrorResponse;
        responseErrors = raw?.errors;
        errorMsg = raw?.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      if (responseErrors && Object.keys(responseErrors).length > 0) {
        const firstField = Object.keys(responseErrors)[0];
        const fieldErrorMsg = responseErrors[firstField]?.[0] || 'Data formulir tidak valid.';

        // Auto-switch ke tab yang relevan dengan letak kesalahan field
        if (firstField.startsWith('cloudflare')) {
          setActiveTab('stream');
        } else if (
          ['price', 'rental_price', 'access_model', 'rental_duration_hours'].includes(firstField)
        ) {
          setActiveTab('pricing');
        } else if (['look_films', 'look_films.*'].includes(firstField)) {
          setActiveTab('looks');
        } else if (
          ['poster_path', 'poster_url', 'backdrop_path', 'backdrop_url'].includes(firstField)
        ) {
          toast.error(`Media Visual Diperlukan: ${fieldErrorMsg}`);
          return;
        } else {
          setActiveTab('metadata');
        }

        toast.error(`Validasi gagal (${firstField}): ${fieldErrorMsg}`);
        return;
      }

      toast.error(errorMsg || 'Gagal menyimpan film. Periksa kelengkapan formulir.');
    }
  };

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 border-b border-neutral-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/admin/movies')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-[#0D111A] text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              title="Kembali ke Katalog Film"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-lg font-extrabold text-white sm:text-xl">
                {isEditMode
                  ? `Edit Film: ${formData.title || '#' + movieId}`
                  : 'Tambah Film VoD Baru'}
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400">
                Kelola metadata, skema monetisasi & tarif sewa, serta konfigurasi video streaming
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigate('/admin/movies')}
              className="flex-1 rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white sm:flex-none"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-50 sm:flex-none"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Terbitkan Film'}
            </button>
          </div>
        </div>

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
          {/* Left Form (7 Cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Tab Pill Nav */}
            <div className="no-scrollbar flex overflow-x-auto rounded-xl border border-neutral-800 bg-[#0B0E14] p-1 text-xs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#0066FF] text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Panels */}
            <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 sm:p-6">
              {activeTab === 'metadata' && (
                <MovieTabMetadata formData={formData} onChange={handleUpdateField} />
              )}

              {activeTab === 'pricing' && (
                <MovieTabPricing formData={formData} onChange={handleUpdateField} />
              )}

              {activeTab === 'stream' && (
                <MovieTabStreamConfig
                  formData={formData}
                  onChange={handleUpdateField}
                  onOpenTestModal={handleOpenTestModal}
                />
              )}

              {activeTab === 'looks' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-sm font-bold text-white">
                      Galeri Foto Adegan (Looks Film)
                    </h3>
                    <p className="mt-1 text-xs text-neutral-400">
                      Unggah foto adegan film (rasio 16:9). Foto yang diunggah di sini akan otomatis
                      tampil pada seksi &quot;Looks Film&quot; di halaman publik film.
                    </p>
                  </div>

                  <MovieLookFilmsUploader
                    lookFilms={formData.look_films || []}
                    onChange={(look_films) => handleUpdateField({ look_films })}
                  />
                </div>
              )}

              {/* Stepper Buttons */}
              <div className="mt-8 flex items-center justify-between border-t border-neutral-800/80 pt-4">
                <button
                  type="button"
                  onClick={goToPreviousTab}
                  disabled={!hasPrevious}
                  className="rounded-xl border border-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white disabled:opacity-30"
                >
                  ← Sebelumnya
                </button>

                {hasNext ? (
                  <button
                    type="button"
                    onClick={goToNextTab}
                    className="rounded-xl bg-neutral-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-neutral-700"
                  >
                    Lanjut →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-[#0066FF] px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-600"
                  >
                    {isSaving ? 'Menyimpan...' : 'Selesai & Simpan'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Upload Studio & Preview (5 Cols) */}
          <div className="space-y-5 lg:col-span-5">
            <div className="sticky top-6 space-y-5">
              {/* Media Upload Card */}
              <AdminMediaUploadCard
                posterUrl={formData.poster_url || null}
                backdropUrl={formData.backdrop_url || null}
                onPosterChange={(url) => handleUpdateField({ poster_url: url || '' })}
                onBackdropChange={(url) => handleUpdateField({ backdrop_url: url || '' })}
                assetTypePrefix="movie"
              />

              {/* Live Preview Card - Revisi 3: Sesuai output asli kartu film di beranda & katalog (Rasio 2:3 vertical) */}
              <div className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0B0E14] p-5 shadow-lg">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Eye className="h-4 w-4 text-blue-400" />
                    <span>Pratinjau Kartu Film (Katalog & Beranda)</span>
                  </div>
                  <span className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                    Poster 2:3 Asli
                  </span>
                </div>

                {/* Vertical Movie Poster Card (Representasi 100% Akurat MovieCard Beranda) */}
                <div className="mx-auto flex max-w-[200px] flex-col items-start rounded-2xl border border-neutral-800 bg-[#0D111A] p-3 shadow-md transition-all hover:-translate-y-1 sm:max-w-[220px]">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-900 shadow-inner">
                    {formData.poster_url ? (
                      <img
                        src={formData.poster_url}
                        alt={formData.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                        <ImageIcon className="h-8 w-8 text-neutral-600" />
                        <p className="mt-2 text-[11px] font-semibold text-neutral-400">
                          Poster Belum Diunggah
                        </p>
                        <p className="mt-0.5 text-[9px] text-neutral-500">
                          Unggah poster 2:3 di bagian atas
                        </p>
                      </div>
                    )}

                    {/* Age Rating Badge LSF */}
                    <div className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                      {formData.age_rating || '13+'}
                    </div>

                    {/* Access Model Badge */}
                    <div className="absolute right-2 top-2 rounded bg-blue-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-md">
                      {formData.access_model === 'free'
                        ? 'Gratis'
                        : `${formData.active_rental_duration_hours || 48} Jam`}
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="mt-2.5 w-full space-y-1">
                    <h4 className="truncate font-display text-xs font-bold text-white">
                      {formData.title || 'Judul Film VoD'}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="truncate">
                        {(formData.genre || []).slice(0, 2).join(', ') || 'Drama'}
                      </span>
                      <span>{formatMovieDuration(formData.duration_minutes) || '0m'}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-800/80 pt-1 text-[11px]">
                      <span className="text-[10px] text-neutral-500">
                        {formData.release_year || 2026}
                      </span>
                      <strong className="text-blue-400">
                        {formData.access_model === 'free'
                          ? 'Akses Bebas'
                          : `Rp ${Number(formData.rental_price || 0).toLocaleString('id-ID')}`}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Sub-preview: Backdrop Landscape 16:9 untuk Detail Page */}
                {formData.backdrop_url && (
                  <div className="space-y-1.5 border-t border-neutral-800/80 pt-3">
                    <p className="text-[10px] font-semibold text-neutral-400">
                      Tampilan Banner Latar Detail Film:
                    </p>
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                      <img
                        src={formData.backdrop_url}
                        alt="Backdrop preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-preview: Looks Film (16:9 Stills Gallery) */}
                {formData.look_films && formData.look_films.length > 0 && (
                  <div className="space-y-1.5 border-t border-neutral-800/80 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-neutral-400">
                        Looks Film ({formData.look_films.length} foto):
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('looks')}
                        className="text-[10px] font-bold text-blue-400 hover:underline"
                      >
                        Kelola
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {formData.look_films.slice(0, 3).map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          className="relative aspect-[16/9] overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900"
                        >
                          <img
                            src={url}
                            alt={`Look ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Stream Test Modal */}
      <AdminStreamTestModal
        key={`${testStreamConfig.uid || formData.cloudflare_video_uid}-${isTestModalOpen}`}
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title={testStreamConfig.title || formData.title}
        streamUid={testStreamConfig.uid || formData.cloudflare_video_uid}
      />
    </>
  );
}

export function AdminMovieEditorPage({
  movieId,
  onNavigate,
}: AdminMovieEditorPageProps): React.JSX.Element {
  const isEditMode = Boolean(movieId);

  const { data: existingMovie, isLoading: isFetchingMovie } = useAdminMovieDetailQuery(
    movieId,
    isEditMode
  );
  const { data: publicSettings } = usePublicSettingsQuery();
  const defaultRentalDuration = publicSettings?.business_policies.vod_rental_duration_hours ?? 48;

  if (isEditMode && isFetchingMovie) {
    return (
      <div className="py-20 text-center text-xs text-neutral-400">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        Memuat data film VoD...
      </div>
    );
  }

  const initialData: CreateMoviePayload = existingMovie
    ? {
        title: existingMovie.title,
        slug: existingMovie.slug,
        synopsis: existingMovie.synopsis || existingMovie.synopsis_full || '',
        synopsis_short: existingMovie.synopsis_short || '',
        synopsis_full: existingMovie.synopsis_full || existingMovie.synopsis || '',
        director: existingMovie.director,
        cast: existingMovie.cast,
        genre: existingMovie.genre,
        release_year: existingMovie.release_year,
        duration_minutes: existingMovie.duration_minutes,
        age_rating: existingMovie.age_rating,
        poster_url: existingMovie.poster_url,
        backdrop_url: existingMovie.backdrop_url,
        look_films: existingMovie.look_films || [],
        cloudflare_video_uid: existingMovie.cloudflare_video_uid,
        cloudflare_trailer_uid: existingMovie.cloudflare_trailer_uid || null,
        access_model: existingMovie.access_model || 'rental',
        rental_price: existingMovie.rental_price,
        active_rental_duration_hours: existingMovie.active_rental_duration_hours,
        is_published: existingMovie.is_published,
        is_featured: existingMovie.is_featured,
      }
    : { ...DEFAULT_MOVIE_FORM, active_rental_duration_hours: defaultRentalDuration };

  return (
    <MovieEditorForm
      key={movieId ?? 'new'}
      initialData={initialData}
      movieId={movieId}
      onNavigate={onNavigate}
    />
  );
}

export default AdminMovieEditorPage;
