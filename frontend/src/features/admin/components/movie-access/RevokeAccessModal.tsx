import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useRevokeMovieAccessMutation,
  type AdminMovieAccessItem,
  type RevokeMovieAccessPayload,
} from '@/features/admin';

export interface RevokeAccessModalProps {
  accessItem: AdminMovieAccessItem | null;
  onClose: () => void;
}

export function RevokeAccessModal({
  accessItem,
  onClose,
}: RevokeAccessModalProps): React.JSX.Element | null {
  const [reason, setReason] = useState<RevokeMovieAccessPayload['revoke_reason']>('manual_admin');
  const [notes, setNotes] = useState('');

  const revokeMutation = useRevokeMovieAccessMutation();

  if (!accessItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await revokeMutation.mutateAsync({
        id: accessItem.id,
        payload: {
          revoke_reason: reason,
          admin_notes: notes || null,
        },
      });

      toast.success(`Hak akses film untuk "${accessItem.user_email}" berhasil dicabut.`);
      onClose();
    } catch {
      toast.error('Gagal mencabut hak akses film.');
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-white">
                Cabut Hak Akses Film (Revoke)
              </h3>
              <p className="text-[11px] text-neutral-400">
                Akses streaming penonton akan langsung dinonaktifkan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1 rounded-xl border border-neutral-800 bg-[#0D111A] p-3 text-xs">
            <p className="text-neutral-400">
              Pengguna: <strong className="text-white">{accessItem.user_name}</strong> (
              {accessItem.user_email})
            </p>
            <p className="text-neutral-400">
              Film: <strong className="text-white">{accessItem.movie_title}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300">
              Alasan Pencabutan Akses <span className="text-red-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as typeof reason)}
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
            >
              <option value="manual_admin">
                Penarikan Manual Kebijakan Admin (Admin Decision)
              </option>
              <option value="refund">Refund Pembayaran Transaksi</option>
              <option value="violation">Pelanggaran Syarat & Ketentuan / Pembajakan</option>
              <option value="system_error">Kesalahan Sistem / Duplikasi Akses</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300">
              Catatan Internal Admin
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan verifikasi audit..."
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#0D111A] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-neutral-800/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={revokeMutation.isPending}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {revokeMutation.isPending ? 'Mencabut...' : 'Konfirmasi Cabut Akses'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
