import React, { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateUserRoleMutation } from '../../api';
import type { AdminUserListItem, UserRole } from '../../types';

export interface UserRoleModalProps {
  user: AdminUserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentAdminEmail?: string;
}

interface UserRoleModalContentProps {
  user: AdminUserListItem;
  onClose: () => void;
  currentAdminEmail?: string;
}

function UserRoleModalContent({
  user,
  onClose,
  currentAdminEmail,
}: UserRoleModalContentProps): React.JSX.Element {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const updateRoleMutation = useUpdateUserRoleMutation();

  const isSelf = currentAdminEmail && user.email.toLowerCase() === currentAdminEmail.toLowerCase();
  const isDemotingSelf = isSelf && selectedRole !== 'super_admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDemotingSelf) {
      toast.error(
        'Proteksi Anti-Lockout: Anda tidak dapat mencabut hak Super Admin akun Anda sendiri.'
      );
      return;
    }

    if (user.role === selectedRole) {
      toast.info('Peran pengguna tidak berubah.');
      onClose();
      return;
    }

    try {
      await updateRoleMutation.mutateAsync({
        id: user.id,
        payload: { role: selectedRole },
      });
      toast.success(
        `Peran ${user.name} berhasil diperbarui menjadi ${selectedRole.toUpperCase()}.`
      );
      onClose();
    } catch {
      toast.error('Gagal memperbarui peran pengguna.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0D111A] px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-blue-400" />
            <h2 className="font-display text-base font-bold text-white">
              Kelola Peran & Akses Staf
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-xs">
          {/* User Info Box */}
          <div className="space-y-1 rounded-xl border border-neutral-800 bg-[#0D111A] p-3.5">
            <span className="block text-sm font-bold text-white">{user.name}</span>
            <span className="block font-mono text-[11px] text-neutral-400">{user.email}</span>
            <span className="mt-1 inline-block rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
              Peran Saat Ini: {user.role.toUpperCase()}
            </span>
          </div>

          {/* Role Options */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-neutral-300">
              Pilih Hak Akses (Role):
            </label>

            {/* Customer Option */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                selectedRole === 'customer'
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-neutral-800 bg-[#0D111A] hover:border-neutral-700'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="customer"
                checked={selectedRole === 'customer'}
                onChange={() => setSelectedRole('customer')}
                className="mt-0.5 text-blue-500 focus:ring-blue-500"
              />
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-white">Customer (Penonton)</span>
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Akses standar untuk membeli tiket presale, sewa film VoD streaming, dan riwayat
                  pesanan pribadi.
                </p>
              </div>
            </label>

            {/* Super Admin Option */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                selectedRole === 'super_admin'
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-neutral-800 bg-[#0D111A] hover:border-neutral-700'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="super_admin"
                checked={selectedRole === 'super_admin'}
                onChange={() => setSelectedRole('super_admin')}
                className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="block text-xs font-bold text-white">
                    Super Admin (Staf Operasional)
                  </span>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Akses penuh Super Admin Studio: kelola event penayangan, katalog film, live
                  banner, audit finansial, dan pemindai QR gatekeeper.
                </p>
              </div>
            </label>
          </div>

          {/* Anti-Lockout Warning */}
          {isDemotingSelf && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <span className="block font-bold">Proteksi Anti-Lockout Aktif!</span>
                <span className="text-[11px] text-red-300">
                  Anda sedang login dengan akun ini. Anda dilarang menurunkan peran akun sendiri
                  demi mencegah hilangnya akses admin sistem secara permanen.
                </span>
              </div>
            </div>
          )}

          {/* Double Confirmation Checkbox when promoting to Super Admin */}
          {selectedRole === 'super_admin' && user.role !== 'super_admin' && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-500 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-[11px] leading-relaxed text-amber-200">
                Saya sadar bahwa memberikan hak <strong>Super Admin</strong> memberikan akses penuh
                pengelolaan data platform Sinemus kepada pengguna ini.
              </span>
            </label>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-neutral-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 font-medium text-neutral-300 transition hover:bg-neutral-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                updateRoleMutation.isPending ||
                isDemotingSelf ||
                (selectedRole === 'super_admin' && user.role !== 'super_admin' && !isConfirmed)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2 font-bold text-white transition hover:bg-blue-600 disabled:opacity-40"
            >
              {updateRoleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Peran</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UserRoleModal(props: UserRoleModalProps): React.JSX.Element | null {
  if (!props.isOpen || !props.user) return null;
  return <UserRoleModalContent key={props.user.id} {...props} user={props.user} />;
}
