import React from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Lock,
  ShieldCheck,
  LogOut,
  Save,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useAuth, useUserProfileForm, useEscapeKey } from '../hooks';
import { cn } from '@/lib/utils';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDrawer({
  isOpen,
  onClose,
}: UserProfileDrawerProps): React.JSX.Element | null {
  const { currentUser, logout, openPhoneCompletionModal } = useAuth();
  const { name, setName, birthDate, setBirthDate, isSaving, hasChanges, handleSave } =
    useUserProfileForm();

  useEscapeKey(isOpen, onClose);

  if (!isOpen || !currentUser) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          className="flex w-screen max-w-md flex-col justify-between overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-6 shadow-2xl sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Profil Pengguna"
        >
          {/* Top Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2 font-display text-lg font-bold text-white">
                <UserIcon className="h-5 w-5 text-[#0066FF]" />
                <span>Profil Akun Saya</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-neutral-400 transition-all hover:bg-neutral-900 hover:text-white"
                aria-label="Tutup Profil"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="h-14 w-14 rounded-full border border-neutral-700 object-cover shadow-md"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-xl font-bold text-white shadow-md">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1 overflow-hidden">
                <h3 className="truncate text-base font-bold text-white">{currentUser.name}</h3>
                <p className="truncate text-xs text-neutral-400">{currentUser.email}</p>
                <div className="pt-0.5">
                  {currentUser.role === 'super_admin' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400">
                      <ShieldCheck className="h-3 w-3" />
                      Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-0.5 text-[11px] font-medium text-neutral-300">
                      Penonton Sinemus
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSave} className="space-y-4">
              {/* Nama Lengkap */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="profile_name_input"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Nama Lengkap
                </label>
                <input
                  id="profile_name_input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSaving}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-sm text-white outline-none transition-all focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                />
              </div>

              {/* Email Akun Google */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="profile_email_input"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Email Akun Google
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="profile_email_input"
                    type="email"
                    value={currentUser.email}
                    readOnly
                    disabled
                    className="w-full cursor-not-allowed select-none rounded-xl border border-neutral-800/80 bg-neutral-950 py-2.5 pl-10 pr-3.5 text-sm text-neutral-400"
                  />
                </div>
              </div>

              {/* Nomor WhatsApp (Permanen Locked Guard) */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="profile_phone_input"
                    className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
                  >
                    Nomor WhatsApp
                  </label>
                  {currentUser.is_phone_locked ? (
                    <span className="inline-flex items-center gap-1 rounded border border-neutral-700 bg-neutral-800/60 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                      <Lock className="h-2.5 w-2.5" />
                      <span>Secured</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={openPhoneCompletionModal}
                      className="text-[11px] font-semibold text-amber-400 hover:underline"
                    >
                      Lengkapi Sekarang
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="profile_phone_input"
                    type="tel"
                    value={currentUser.phone_number || 'Belum diisi'}
                    readOnly
                    disabled
                    className={cn(
                      'w-full cursor-not-allowed select-none rounded-xl border py-2.5 pl-10 pr-3.5 text-sm',
                      currentUser.is_phone_locked
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-300'
                        : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
                    )}
                  />
                </div>
                {!currentUser.is_phone_locked && (
                  <p className="text-[11px] text-neutral-400">
                    Nomor WhatsApp belum terdaftar. Harap lengkapi nomor Anda.
                  </p>
                )}
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="profile_birthdate_input"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Tanggal Lahir
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    id="profile_birthdate_input"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-3.5 text-sm text-white outline-none [color-scheme:dark] focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  />
                </div>
              </div>

              {/* Save Button */}
              {hasChanges && (
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="active:scale-98 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0052D4] disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan Perubahan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Simpan Perubahan Profil</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </div>

          {/* Bottom Footer Actions */}
          <div className="space-y-3 border-t border-neutral-800 pt-6">
            {currentUser.role === 'super_admin' && (
              <a
                href="/admin"
                className="flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/70 p-3 text-xs font-semibold text-neutral-200 transition-all hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  Buka Admin Studio Dashboard
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="active:scale-98 flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 p-2.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-950/30 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar dari Akun Sinemus</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
