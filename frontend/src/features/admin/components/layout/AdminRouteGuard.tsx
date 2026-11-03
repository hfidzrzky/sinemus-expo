import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth';

export interface AdminRouteGuardProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

/**
 * Production-ready Middleware & Route Guard untuk Sinemus Admin Studio.
 *
 * Mencegah kebocoran UI Admin (Sidebar, TopBar, menu internal) ke publik:
 * 1. Menangani status loading verifikasi token/sesi backend tanpa flicker.
 * 2. Mengisolasi status 401 Unauthenticated jika belum ada sesi login.
 * 3. Mengisolasi status 403 Forbidden jika akun login bertipe customer (bukan super_admin).
 * 4. Merender layout dan halaman admin HANYA jika currentUser.role === 'super_admin'.
 * 5. Menghilangkan seluruh simulasi/dev mode bypass sisi klien demi kepatuhan keamanan.
 */
export function AdminRouteGuard({
  children,
  currentPath: _currentPath,
  onNavigate,
  onOpenAuthModal,
  onLogout,
}: AdminRouteGuardProps): React.JSX.Element {
  const { currentUser, isAuthenticated, isLoading, openAuthModal, logout } = useAuth();

  const handleLogin = () => {
    if (onOpenAuthModal) {
      onOpenAuthModal();
    } else {
      openAuthModal();
    }
  };

  const handleSwitchAccount = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
    // Buka dialog login agar staf dapat langsung masuk dengan akun berwenang
    handleLogin();
  };

  // ---------------------------------------------------------------------------
  // 1. Loading State (Memverifikasi Sesi & Token Sanctum)
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#07090E] p-6 text-neutral-100">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-2xl">
          <img
            src="/sinemus-logo.png"
            alt="Sinemus Logo"
            className="h-8 w-8 animate-pulse object-contain"
          />
        </div>
        <div className="flex items-center gap-2.5 text-sm font-medium text-neutral-300">
          <Loader2 className="h-4 w-4 animate-spin text-[#0066FF]" />
          <span>Memverifikasi Hak Akses Super Admin...</span>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Memeriksa token sesi dan otorisasi keamanan berbasis peran (RBAC).
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Unauthenticated State (401: Belum Login)
  // Tidak merender AdminLayout/Sidebar demi mencegah kebocoran struktur studio
  // ---------------------------------------------------------------------------
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#07090E] p-6 text-neutral-100">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#0B0E14] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
            <Lock className="h-7 w-7" />
          </div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-400">
            <span>Autentikasi Diperlukan</span>
          </div>
          <h2 className="font-display text-xl font-extrabold text-white">
            Area Khusus Pengelola Bioskop
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-400">
            Halaman Sinemus Admin Studio dilindungi oleh middleware keamanan{' '}
            <code className="font-mono text-neutral-300">role:super_admin</code>. Anda harus masuk
            menggunakan akun Google resmi yang terdaftar sebagai Super Admin.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleLogin}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-600"
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk dengan Google</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-neutral-300 transition-all hover:border-neutral-700 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Beranda Penonton</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Forbidden State (403: Login sebagai Penonton / Non-Super Admin)
  // Menampilkan penolakan otorisasi tanpa tombol simulasi bypass dev mode
  // ---------------------------------------------------------------------------
  if (currentUser.role !== 'super_admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#07090E] p-6 text-neutral-100">
        <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-[#0B0E14] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-400">
            <span>403 Forbidden · Akses Ditolak</span>
          </div>
          <h2 className="font-display text-xl font-extrabold text-white">
            Izin Akses Tidak Memadai
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-400">
            Halaman Sinemus Admin Studio dilindungi oleh middleware keamanan{' '}
            <code className="font-mono text-neutral-300">role:super_admin</code>. Akun Anda saat ini
            tercatat sebagai peran{' '}
            <strong className="capitalize text-white">{currentUser.role}</strong> dan tidak memiliki
            wewenang untuk mengakses konsol manajemen ini.
          </p>

          {/* Kartu Identitas Akun Aktif */}
          <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/80 p-3.5 text-left">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Akun Aktif Saat Ini
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {currentUser.name || 'Pengguna'}
                </p>
                <p className="truncate text-[11px] text-neutral-400">{currentUser.email}</p>
              </div>
              <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold capitalize text-amber-400">
                Peran: {currentUser.role}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-neutral-200 transition-all hover:border-neutral-600 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Ganti Akun Admin</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Authorized State (Telah Lolos Guard: role === 'super_admin')
  // ---------------------------------------------------------------------------
  return <>{children}</>;
}
