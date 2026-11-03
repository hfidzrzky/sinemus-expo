import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { ImagePlus, Loader2, Trash2, GripVertical, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateImageDirectUploadMutation, useDeleteCloudflareImageMutation } from '../../api';

export interface MovieLookFilmsUploaderProps {
  lookFilms: string[];
  onChange: (lookFilms: string[]) => void;
  maxCount?: number;
}

export function MovieLookFilmsUploader({
  lookFilms = [],
  onChange,
  maxCount = 10,
}: MovieLookFilmsUploaderProps): React.JSX.Element {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const createUploadMutation = useCreateImageDirectUploadMutation();
  const deleteMutation = useDeleteCloudflareImageMutation();

  const extractImageId = (url: string): string | null => {
    const match = url.match(/imagedelivery\.net\/[^/]+\/([^/]+)/);
    return match ? match[1] : null;
  };

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as
        { message?: string; errors?: Array<{ message?: string; code?: number }> } | undefined;
      if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message;
      }
      if (
        Array.isArray(data?.errors) &&
        data.errors.length > 0 &&
        typeof data.errors[0]?.message === 'string'
      ) {
        return data.errors[0].message;
      }
    }
    return err instanceof Error ? err.message : fallback;
  };

  // Upload single file directly to Cloudflare
  const uploadFile = async (file: File): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`Ukuran file "${file.name}" melebihi batas 5 MB.`);
    }

    const session = await createUploadMutation.mutateAsync({
      asset_type: 'movie_look_film',
    });

    const formData = new FormData();
    formData.append('file', file);

    await axios.post(session.upload_url, formData, {
      onUploadProgress: (e) => {
        if (e.total) {
          const percent = Math.round((e.loaded * 70) / e.total) + 25;
          setUploadProgress(percent);
        }
      },
    });

    return session.delivery_url;
  };

  // Process selected or dropped image files
  const processSelectedFiles = async (files: File[]) => {
    const validImageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      toast.error('Silakan pilih berkas gambar yang valid (JPG, PNG, WebP, AVIF).');
      return;
    }

    if (lookFilms.length + validImageFiles.length > maxCount) {
      toast.error(
        `Maksimal ${maxCount} foto look film. Anda memilih ${validImageFiles.length} foto.`
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const uploadedUrls: string[] = [];
    try {
      for (let i = 0; i < validImageFiles.length; i++) {
        const url = await uploadFile(validImageFiles[i]);
        uploadedUrls.push(url);
      }
      onChange([...lookFilms, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} still foto look film berhasil diunggah.`);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Gagal mengunggah foto look film.');
      toast.error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add new still files
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      void processSelectedFiles(files);
    }
  };

  // Replace existing still file
  const handleReplaceSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replaceIndex === null) return;

    setIsUploading(true);
    setUploadProgress(20);

    try {
      const oldUrl = lookFilms[replaceIndex];
      const newUrl = await uploadFile(file);

      // Delete old image if cloudflare
      const oldId = extractImageId(oldUrl);
      if (oldId) {
        deleteMutation.mutate(oldId);
      }

      const updated = [...lookFilms];
      updated[replaceIndex] = newUrl;
      onChange(updated);
      toast.success(`Look film #${replaceIndex + 1} berhasil diganti.`);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Gagal mengganti foto look film.');
      toast.error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setReplaceIndex(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  // Delete still
  const handleDelete = useCallback(
    (index: number) => {
      const urlToRemove = lookFilms[index];
      const imageId = extractImageId(urlToRemove);
      if (imageId) {
        deleteMutation.mutate(imageId);
      }
      const updated = lookFilms.filter((_, idx) => idx !== index);
      onChange(updated);
      toast.info(`Look film #${index + 1} dihapus.`);
    },
    [lookFilms, onChange, deleteMutation]
  );

  // Drag and drop reordering handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...lookFilms];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, movedItem);

    onChange(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
    toast.success('Urutan galeri look film diperbarui.');
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0D111A] p-5">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-neutral-800/80 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="flex items-center gap-2 text-xs font-bold text-white">
            <Layers className="h-4 w-4 text-blue-400" />
            Galeri Look Film / Still Foto Adegan (Rasio 16:9)
          </h4>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            Unggah still foto adegan film (16:9). Seret untuk mengatur urutan, ganti, atau hapus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[11px] text-neutral-400">
            {lookFilms.length} / {maxCount} Foto
          </span>

          <button
            type="button"
            disabled={isUploading || lookFilms.length >= maxCount}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-40"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            <span>Tambah Look Film</span>
          </button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleReplaceSelected}
        className="hidden"
      />

      {/* Uploading Progress Bar */}
      {isUploading && (
        <div className="space-y-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
          <div className="flex items-center justify-between text-xs text-blue-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Mengunggah aset look film ke Cloudflare Images CDN...
            </span>
            <span className="font-mono text-[11px] font-bold">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Gallery Grid with Drag and Drop */}
      {lookFilms.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {lookFilms.map((url, idx) => {
            const isDragging = draggedIndex === idx;
            const isOver = dragOverIndex === idx;

            return (
              <div
                key={`${url}-${idx}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`group relative aspect-[16/9] cursor-grab overflow-hidden rounded-xl border bg-neutral-900 transition-all duration-200 active:cursor-grabbing ${
                  isDragging ? 'scale-95 border-blue-500 opacity-30' : ''
                } ${isOver ? 'scale-[1.02] border-blue-400 ring-2 ring-blue-500/50' : 'border-neutral-800 hover:border-neutral-700'}`}
              >
                {/* Image View */}
                <img
                  src={url}
                  alt={`Look Film #${idx + 1}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Gradient Shadow Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition group-hover:opacity-100" />

                {/* Badge Number & Drag Handle */}
                <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                  <GripVertical className="h-3 w-3 text-neutral-400" />
                  <span>#{idx + 1}</span>
                </div>

                {/* Hover Action Buttons */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    title="Ganti gambar ini"
                    onClick={() => {
                      setReplaceIndex(idx);
                      replaceInputRef.current?.click();
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900/90 text-neutral-200 backdrop-blur-md transition hover:bg-neutral-800 hover:text-white"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>

                  <button
                    type="button"
                    title="Hapus foto ini"
                    onClick={() => handleDelete(idx)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/40 bg-red-950/80 text-red-300 backdrop-blur-md transition hover:bg-red-900 hover:text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State / Dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const droppedFiles = Array.from(e.dataTransfer.files || []);
            if (droppedFiles.length > 0) {
              void processSelectedFiles(droppedFiles);
            }
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-[#070A0F]/60 p-8 text-center transition hover:border-neutral-700 hover:bg-[#070A0F]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-[#0D111A] text-blue-400">
            <ImagePlus className="h-6 w-6" />
          </div>
          <p className="mt-3 text-xs font-semibold text-neutral-200">
            Belum ada still foto look film
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">
            Klik di sini untuk mengunggah still foto resolusi 16:9 (Rekomendasi: 1920 × 1080 px).
          </p>
        </div>
      )}
    </div>
  );
}
