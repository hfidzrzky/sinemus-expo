import React from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Lock,
  ShieldCheck,
  LogOut,
  Save,
  Loader2,
  ChevronLeft,
  LogIn,
} from 'lucide-react';
import { useAuth, useUserProfileForm } from '@/features/auth';
import { tokenStorage } from '@/lib/token-storage';
import { cn } from '@/lib/utils';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { currentUser, isLoading, logout, openAuthModal, openPhoneCompletionModal } = useAuth();
  const { name, setName, birthDate, setBirthDate, isSaving, hasChanges, handleSave } =
    useUserProfileForm();

  // Sesi sedang di-load ulang (re-hydrating) dari token storage: jangan tampilkan unauthenticated view
  if (isLoading && tokenStorage.hasToken()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-neutral-800/60" />
          <div className="h-4 w-60 animate-pulse rounded-lg bg-neutral-800/40" />
          <div className="h-48 w-full animate-pulse rounded-2xl border border-neutral-800/60 bg-neutral-900/40" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-[#0066FF] shadow-lg">
          <UserIcon className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white">
          Masuk untuk Melihat Profil
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          Silakan masuk dengan akun Google Anda untuk mengakses data diri, pengaturan akun, dan
          riwayat tiket.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={openAuthModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-md transition-all hover:bg-neutral-200 active:scale-95"
          >
            <LogIn className="h-4 w-4" />
            <span>Masuk Akun</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition-all hover:bg-neutral-800 hover:text-white"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* 1. Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>

      {/* 2. Page Header */}
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Profil Akun Saya
        </h1>
        <p className="text-sm text-neutral-400">
          Kelola informasi data diri, verifikasi nomor WhatsApp, dan preferensi akun Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: Avatar & Overview Card */}
        <div className="space-y-6 md:col-span-1">
          <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="mx-auto h-24 w-24 rounded-full border-2 border-neutral-700 object-cover shadow-lg"
              />
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-3xl font-bold text-white shadow-lg">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1">
              <h2 className="truncate text-lg font-bold text-white">{currentUser.name}</h2>
              <p className="truncate text-xs text-neutral-400">{currentUser.email}</p>
            </div>

            <div className="pt-2">
              {currentUser.role === 'super_admin' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Super Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300">
                  Penonton Sinemus
                </span>
              )}
            </div>
          </div>

          {/* Logout Button (Desktop) */}
          <div className="hidden md:block">
            <button
              type="button"
              onClick={() => {
                logout();
                onNavigate('/');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/20 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="space-y-6 md:col-span-2">
          <div className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
            <div className="border-b border-neutral-800 pb-4">
              <h2 className="font-display text-lg font-bold text-white">Informasi Data Diri</h2>
              <p className="text-xs text-neutral-400">
                Data diri digunakan untuk identifikasi tiket dan akses konten sinematik Anda.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Nama Lengkap */}
              <div className="space-y-2 text-left">
                <label
                  htmlFor="profile_page_name"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="profile_page_name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving}
                    placeholder="Masukkan nama lengkap Anda"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-3.5 text-sm text-white outline-none transition-all focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  />
                </div>
              </div>

              {/* Email Akun Google */}
              <div className="space-y-2 text-left">
                <label
                  htmlFor="profile_page_email"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Email Akun Google
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="profile_page_email"
                    type="email"
                    value={currentUser.email}
                    readOnly
                    disabled
                    className="w-full cursor-not-allowed select-none rounded-xl border border-neutral-800/80 bg-neutral-950 py-2.5 pl-10 pr-3.5 text-sm text-neutral-400"
                  />
                </div>
              </div>

              {/* Nomor WhatsApp (Permanen Locked Guard) */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="profile_page_phone"
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
                    id="profile_page_phone"
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
                    Nomor WhatsApp belum terdaftar. Silakan lengkapi nomor Anda untuk verifikasi
                    identitas tiket.
                  </p>
                )}
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-2 text-left">
                <label
                  htmlFor="profile_page_birthdate"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Tanggal Lahir
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    id="profile_page_birthdate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-3.5 text-sm text-white outline-none [color-scheme:dark] focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={!hasChanges || isSaving || !name.trim()}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all',
                    hasChanges && name.trim() && !isSaving
                      ? 'bg-[#0066FF] text-white shadow-md hover:bg-[#0052D4] active:scale-95'
                      : 'cursor-not-allowed bg-neutral-800 text-neutral-500 opacity-60'
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan Perubahan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Logout Button (Mobile) */}
          <div className="block md:hidden">
            <button
              type="button"
              onClick={() => {
                logout();
                onNavigate('/');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/20 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
