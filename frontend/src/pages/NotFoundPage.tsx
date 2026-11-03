import React from 'react';
import { Film, Home, Calendar, LayoutDashboard, SearchX } from 'lucide-react';

export interface NotFoundPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  scope?: 'customer' | 'admin';
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  currentPath,
  onNavigate,
  scope = 'customer',
}) => {
  const isAdmin = scope === 'admin';
  const displayPath =
    currentPath || (typeof window !== 'undefined' ? window.location.pathname : '/');

  if (isAdmin) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/80 text-amber-500 shadow-inner">
          <SearchX className="h-8 w-8" />
        </div>

        <div className="mt-6 space-y-2">
          <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            404 — Admin Menu Not Found
          </span>
          <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
            Sub-Halaman Admin Tidak Ditemukan
          </h1>
          <p className="mx-auto max-w-md text-sm text-neutral-400">
            Rute administrasi{' '}
            <code className="rounded bg-neutral-800/80 px-1.5 py-0.5 text-xs text-neutral-300">
              {displayPath}
            </code>{' '}
            tidak terdaftar dalam portal kontrol Sinemus.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/admin/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#0052D4]"
          >
            <LayoutDashboard className="h-4 w-4" />
            Kembali ke Dashboard
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/admin/events')}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-medium text-neutral-300 transition-all hover:border-neutral-700 hover:text-white"
          >
            Kelola Screening Bioskop
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-4xl flex-col items-center justify-center px-4 py-20 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/90 text-[#0066FF] shadow-xl">
        <Film className="h-10 w-10 stroke-[1.5]" />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-[10px] font-black text-neutral-400">
          404
        </span>
      </div>

      <div className="space-y-3">
        <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
          Halaman Tidak Ditemukan
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Tayangan yang Anda Cari Tidak Ada
        </h1>
        <p className="mx-auto max-w-lg text-sm text-neutral-400">
          Alamat rute{' '}
          <code className="rounded bg-neutral-800/80 px-2 py-0.5 text-xs text-neutral-300">
            {displayPath}
          </code>{' '}
          tidak terdaftar, sudah dipindahkan, atau tidak dapat diakses langsung sebagai halaman web.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#0052D4]"
        >
          <Home className="h-4 w-4" />
          Kembali ke Beranda
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/events')}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-medium text-neutral-300 transition-all hover:border-neutral-700 hover:text-white"
        >
          <Calendar className="h-4 w-4 text-neutral-400" />
          Jadwal Screening Bioskop
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/movies')}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-medium text-neutral-300 transition-all hover:border-neutral-700 hover:text-white"
        >
          <Film className="h-4 w-4 text-neutral-400" />
          Katalog Film VoD
        </button>
      </div>
    </main>
  );
};

export default NotFoundPage;
