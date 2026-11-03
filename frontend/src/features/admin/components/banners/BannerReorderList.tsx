import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  GripVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  Loader2,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatMovieDuration } from '@/features/events';
import { useReorderBannersMutation, useDeleteBannerMutation } from '../../api';
import { AdminConfirmModal } from '../common';
import type { AdminBannerItem } from '../../types';

export interface BannerReorderListProps {
  banners: AdminBannerItem[];
  onEditBanner: (banner: AdminBannerItem) => void;
}

export function BannerReorderList({
  banners,
  onEditBanner,
}: BannerReorderListProps): React.JSX.Element {
  const [prevBanners, setPrevBanners] = useState(banners);
  const [orderedBanners, setOrderedBanners] = useState<AdminBannerItem[]>(() =>
    [...banners].sort((a, b) => a.order_priority - b.order_priority)
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<AdminBannerItem | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (prevBanners !== banners) {
    setPrevBanners(banners);
    setOrderedBanners([...banners].sort((a, b) => a.order_priority - b.order_priority));
    setHasChanges(false);
  }

  const reorderMutation = useReorderBannersMutation();
  const deleteMutation = useDeleteBannerMutation();

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedBanners.length) return;

    const updated = [...orderedBanners];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Re-assign priorities sequentially 1..n
    const withNewPriorities = updated.map((item, idx) => ({
      ...item,
      order_priority: idx + 1,
    }));

    setOrderedBanners(withNewPriorities);
    setHasChanges(true);
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...orderedBanners];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const withNewPriorities = updated.map((item, idx) => ({
      ...item,
      order_priority: idx + 1,
    }));

    setOrderedBanners(withNewPriorities);
    setHasChanges(true);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveOrder = async () => {
    try {
      const items = orderedBanners.map((b, idx) => ({
        id: b.id,
        order_priority: idx + 1,
      }));
      const bannerIds = orderedBanners.map((b) => b.id);
      await reorderMutation.mutateAsync({
        items,
        banner_ids: bannerIds,
      });
      toast.success('Urutan slide banner beranda berhasil disimpan.');
      setHasChanges(false);
    } catch {
      toast.error('Gagal menyimpan urutan banner.');
    }
  };

  const handleDelete = (banner: AdminBannerItem) => {
    setBannerToDelete(banner);
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;

    try {
      setDeletingId(bannerToDelete.id);
      await deleteMutation.mutateAsync(bannerToDelete.id);
      toast.success('Slide banner berhasil dihapus.');
      setBannerToDelete(null);
    } catch {
      toast.error('Gagal menghapus banner.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Save Order Bar if Changes Made */}
      {hasChanges && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400" />
            <span>Ada perubahan urutan slide carousel yang belum disimpan!</span>
          </div>
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={reorderMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 font-bold text-neutral-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {reorderMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Simpan Urutan Slide</span>
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 bg-[#0D111A] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="w-24 px-4 py-4 text-center">Urutan</th>
                <th className="w-36 px-4 py-4">Gambar (16:9)</th>
                <th className="px-4 py-4">Judul & Mode</th>
                <th className="px-4 py-4">Tautan Target</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {orderedBanners.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    Belum ada slide banner yang terdaftar.
                  </td>
                </tr>
              )}

              {orderedBanners.map((banner, index) => {
                const isFirst = index === 0;
                const isLast = index === orderedBanners.length - 1;

                return (
                  <tr
                    key={banner.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group transition-all duration-150 ${
                      draggedIndex === index
                        ? 'bg-blue-950/30 opacity-40'
                        : dragOverIndex === index
                          ? 'bg-blue-600/20 ring-2 ring-inset ring-blue-500'
                          : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    {/* Up/Down Handle & Priority */}
                    <td className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div
                          className="flex cursor-grab items-center gap-1 rounded-lg border border-neutral-800 bg-[#0D111A] px-2 py-1.5 text-neutral-400 transition hover:border-blue-500/60 hover:bg-neutral-800 hover:text-white active:cursor-grabbing group-hover:border-neutral-700"
                          title="Tahan dan geser untuk memindahkan urutan slide"
                        >
                          <GripVertical className="h-3.5 w-3.5 text-neutral-500 transition group-hover:text-blue-400" />
                          <span className="font-mono text-xs font-bold text-white">
                            #{banner.order_priority}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveItem(index, 'up');
                            }}
                            className="rounded p-0.5 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-20"
                            title="Geser Naik"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveItem(index, 'down');
                            }}
                            className="rounded p-0.5 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-20"
                            title="Geser Turun"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Thumbnail 16:9 */}
                    <td className="px-4 py-4">
                      <div className="relative aspect-[16/9] w-28 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
                        <img
                          src={banner.image_url}
                          alt={banner.title || 'Thumbnail'}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80';
                          }}
                        />
                      </div>
                    </td>

                    {/* Judul & Mode */}
                    <td className="px-4 py-4">
                      <strong className="block font-bold text-white">
                        {banner.title || '(Mode Gambar Penuh)'}
                      </strong>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            banner.display_mode === 'spotlight' ||
                            banner.display_mode === 'movie_spotlight' ||
                            banner.display_mode === 'sorotan'
                              ? 'bg-blue-500/20 text-blue-300'
                              : banner.display_mode === 'rich_content'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {banner.display_mode === 'spotlight' ||
                          banner.display_mode === 'movie_spotlight' ||
                          banner.display_mode === 'sorotan'
                            ? 'Sorotan'
                            : banner.display_mode === 'rich_content'
                              ? 'Rich Content'
                              : 'Image Only'}
                        </span>
                        {banner.display_mode === 'rich_content' && banner.badge_text && (
                          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                            {banner.badge_text}
                          </span>
                        )}
                        {banner.display_mode !== 'rich_content' &&
                          banner.display_mode !== 'image_only' && (
                            <>
                              {banner.age_rating && (
                                <span className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm">
                                  {banner.age_rating}
                                </span>
                              )}
                              {banner.release_year && (
                                <span className="font-mono text-[10px] text-neutral-400">
                                  {banner.release_year}
                                </span>
                              )}
                              {banner.duration_minutes && (
                                <span className="font-mono text-[10px] text-neutral-400">
                                  • {formatMovieDuration(banner.duration_minutes)}
                                </span>
                              )}
                              {banner.genre && (
                                <span className="max-w-[150px] truncate text-[10px] text-neutral-400">
                                  • {banner.genre}
                                </span>
                              )}
                            </>
                          )}
                      </div>
                    </td>

                    {/* Target Link */}
                    <td className="px-4 py-4 text-neutral-400">
                      <span className="font-mono text-[11px] text-neutral-200">
                        {banner.link_type.toUpperCase()}: {banner.target_identifier || '-'}
                      </span>
                      <span className="block text-[10px] text-neutral-500">
                        Tombol: {banner.button_text}
                      </span>
                    </td>

                    {/* Status Aktif */}
                    <td className="px-4 py-4">
                      {banner.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>TAMPIL</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-0.5 text-[10px] font-bold text-neutral-400">
                          <XCircle className="h-3 w-3" />
                          <span>DISEMBUNYIKAN</span>
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditBanner(banner)}
                          className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                          title="Edit Slide"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-blue-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(banner)}
                          disabled={deletingId === banner.id}
                          className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-rose-400"
                          title="Hapus Slide"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup Konfirmasi Hapus Banner (Revisi 6) */}
      <AdminConfirmModal
        isOpen={Boolean(bannerToDelete)}
        title="Hapus Slide Banner?"
        description={
          <p>
            Apakah Anda yakin ingin menghapus slide banner{' '}
            <strong className="text-white">
              "{bannerToDelete?.title || `Slide #${bannerToDelete?.id}`}"
            </strong>{' '}
            dari carousel beranda? Tindakan ini tidak dapat dibatalkan.
          </p>
        }
        confirmLabel="Ya, Hapus Banner"
        cancelLabel="Batal"
        isLoading={deleteMutation.isPending}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setBannerToDelete(null)}
      />
    </div>
  );
}
