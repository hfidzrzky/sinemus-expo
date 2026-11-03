import React from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useGoogleIdentityServices, useEscapeKey } from '../hooks';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleAuthModal({
  isOpen,
  onClose,
}: GoogleAuthModalProps): React.JSX.Element | null {
  const {
    googleBtnContainerRef,
    isGisLoaded,
    isClientIdConfigured,
    authStatus,
    isSlowConnection,
    authErrorMessage,
    resetAuthState,
  } = useGoogleIdentityServices({
    isOpen,
    onSuccess: onClose,
  });

  const handleClose = () => {
    if (authStatus !== 'verifying') {
      resetAuthState();
      onClose();
    }
  };

  // Guard: Cegah tombol ESC menutup dialog saat proses verifikasi sedang aktif
  useEscapeKey(isOpen && authStatus !== 'verifying', handleClose);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Hanya tutup jika klik murni pada backdrop dan bukan sedang proses verifikasi
    if (e.target === e.currentTarget && authStatus !== 'verifying') {
      handleClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity"
    >
      <div
        className="relative flex w-full max-w-[380px] flex-col items-center rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl transition-all sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-label="Masuk ke Sinemus"
      >
        {/* Close Button — Terkunci saat sedang verifikasi token untuk mencegah state desync */}
        <button
          type="button"
          onClick={handleClose}
          disabled={authStatus === 'verifying'}
          className="absolute right-4 top-4 rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white disabled:pointer-events-none disabled:opacity-20"
          aria-label="Tutup Dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ------------------------------------------------------------------ */}
        {/* STATE 1: VERIFYING (Indikator Loading Reaktif & Anti-Stuck)         */}
        {/* ------------------------------------------------------------------ */}
        {authStatus === 'verifying' && (
          <div className="flex w-full flex-col items-center py-3 text-center">
            {/* Animated Brand Squircle with Glowing Spinner */}
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 shadow-lg shadow-blue-500/10">
              <img
                src="/sinemus-logo.png"
                alt="Sinemus Logo"
                className="h-8 w-8 animate-pulse object-contain"
              />
              <div className="absolute inset-0 animate-spin rounded-2xl border-2 border-transparent border-t-[#0066FF]" />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white">
              Memverifikasi Akun Google...
            </h2>
            <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-neutral-400">
              Mohon tunggu sejenak, kami sedang menyiapkan sesi akun Anda.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3.5 py-1.5 text-xs text-neutral-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066FF]" />
              <span>Menghubungkan ke server Sinemus...</span>
            </div>

            {/* Slow Network Warning (> 3 Detik) */}
            {isSlowConnection && (
              <div className="animate-in fade-in slide-in-from-bottom-2 mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left text-xs text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Koneksi jaringan sedang lambat. Mohon tetap menunggu dan jangan menutup jendela
                  ini.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STATE 2: SUCCESS (Micro-feedback Konfirmasi Visual Sebelum Tutup)   */}
        {/* ------------------------------------------------------------------ */}
        {authStatus === 'success' && (
          <div className="animate-in zoom-in-95 flex w-full flex-col items-center py-4 text-center duration-200">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="animate-in zoom-in-50 h-8 w-8 duration-300" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Berhasil Masuk!</h2>
            <p className="mt-1.5 text-xs text-neutral-400">
              Sesi akun Anda telah siap. Mengalihkan...
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STATE 3: ERROR (In-Modal Recovery & Friendly Fallback)             */}
        {/* ------------------------------------------------------------------ */}
        {authStatus === 'error' && (
          <div className="animate-in fade-in flex w-full flex-col items-center py-2 text-center duration-200">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-lg shadow-rose-500/10">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Gagal Masuk</h2>
            <p className="mt-1.5 max-w-[280px] text-xs leading-relaxed text-neutral-400">
              {authErrorMessage ||
                'Terjadi kendala saat memproses akun Google Anda. Silakan coba kembali.'}
            </p>

            <div className="mt-6 flex w-full flex-col gap-2.5">
              <button
                type="button"
                onClick={resetAuthState}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#0052D4]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Coba Masuk Lagi</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 text-xs font-semibold text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STATE 4: IDLE (Standard Google Sign-In Selector)                  */}
        {/* ------------------------------------------------------------------ */}
        {authStatus === 'idle' && (
          <>
            {/* Icon Sinemus in polished dark squircle */}
            <div className="mb-4 mt-1 flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 shadow-inner">
              <img src="/sinemus-logo.png" alt="Sinemus Logo" className="h-7 w-7 object-contain" />
            </div>

            {/* Heading & Context Subtitle */}
            <div className="mb-6 space-y-1.5 text-center">
              <h2 className="text-xl font-bold tracking-tight text-white">Masuk ke Sinemus</h2>
              <p className="max-w-[280px] text-xs leading-relaxed text-neutral-400">
                Akses pemesanan tiket bioskop dan layanan nonton film streaming.
              </p>
            </div>

            {/* Google Bar Area */}
            <div className="w-full">
              {/* Container rendered by GIS SDK if configured */}
              <div ref={googleBtnContainerRef} className="flex min-h-[44px] justify-center" />

              {/* Safe Fail-Closed State if GIS SDK / Client ID is not ready */}
              {!isClientIdConfigured && (
                <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center text-xs text-amber-300">
                  Konfigurasi Google Client ID belum disetel pada aplikasi.
                </div>
              )}

              {isClientIdConfigured && !isGisLoaded && (
                <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-center text-xs text-neutral-400">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                  <span>Memuat layanan Google Sign-In...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
