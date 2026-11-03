import React from 'react';
import { Image as ImageIcon, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import {
  useAdminBannersQuery,
  BannerReorderList,
  BannerSliderPreview,
  type AdminBannerItem,
} from '@/features/admin';

export interface AdminBannersPageProps {
  onNavigate?: (path: string) => void;
}

export function AdminBannersPage({ onNavigate }: AdminBannersPageProps): React.JSX.Element {
  const { data: banners = [], isLoading, isError, refetch, isFetching } = useAdminBannersQuery();

  const handleOpenCreate = () => {
    if (onNavigate) {
      onNavigate('/admin/banners/new');
    }
  };

  const handleOpenEdit = (banner: AdminBannerItem) => {
    if (onNavigate) {
      onNavigate(`/admin/banners/${banner.id}/edit`);
    }
  };

  const activeBanners = banners.filter((b) => b.is_active);
  const displayBanners = activeBanners.length > 0 ? activeBanners : banners;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Manajemen Banner Beranda
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Kelola slide banner promosi, pengumuman premiere, dan sorotan film/event pada Hero
            Carousel beranda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50"
            title="Segarkan data banner"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Slide Banner</span>
          </button>
        </div>
      </div>

      {/* Interactive Carousel Live Preview Section */}
      {banners.length > 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3.5 shadow-xl sm:p-4">
          <BannerSliderPreview banners={displayBanners} onEditBanner={handleOpenEdit} />
        </div>
      )}

      {/* Table & Reorder Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <ImageIcon className="h-4 w-4 text-blue-400" />
            <span>Daftar Slide & Atur Prioritas Tampil</span>
          </h2>
          <span className="text-[11px] text-neutral-400">
            Tarik & geser (drag & drop) pada nomor / baris, atau gunakan tombol panah ▲ / ▼ untuk
            mengubah urutan.
          </span>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14] p-12 text-center text-neutral-500">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-xs">Memuat slide banner...</span>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-300">
            <AlertCircle className="mx-auto mb-2 h-6 w-6" />
            <span className="text-xs font-semibold">Gagal memuat daftar banner</span>
          </div>
        )}

        {!isLoading && !isError && (
          <BannerReorderList banners={banners} onEditBanner={handleOpenEdit} />
        )}
      </div>
    </div>
  );
}
