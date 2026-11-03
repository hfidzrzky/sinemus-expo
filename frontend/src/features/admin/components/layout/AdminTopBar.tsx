import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import type { User } from '@/features/auth';

export interface AdminTopBarProps {
  currentPath: string;
  currentUser: User | null;
  onOpenMobileMenu: () => void;
  onLogout?: () => void;
}

export function AdminTopBar({
  currentPath,
  currentUser: _currentUser,
  onOpenMobileMenu,
  onLogout,
}: AdminTopBarProps): React.JSX.Element {
  // Format breadcrumb title based on path
  const getBreadcrumbTitle = (path: string) => {
    if (path === '/admin' || path === '/admin/dashboard') return 'Dashboard & Analitik';
    if (path.startsWith('/admin/events')) return 'Manajemen Event & Screening';
    if (path.startsWith('/admin/movies')) return 'Katalog Film (VoD)';
    if (path.startsWith('/admin/movie-access')) return 'Entitlement Hak Tonton Film';
    if (path.startsWith('/admin/banners')) return 'Manajemen Banner Beranda';
    if (path.startsWith('/admin/vouchers')) return 'Manajemen Voucher & Promo';
    if (path.startsWith('/admin/orders')) return 'Riwayat Transaksi & Audit';
    if (path.startsWith('/admin/scanner')) return 'Mobile QR Scanner Pintu Masuk';
    if (path.startsWith('/admin/users')) return 'Data Pengguna & Peran';
    if (path.startsWith('/admin/settings')) return 'Pengaturan Sistem';
    return 'Admin Studio';
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-800 bg-[#0B0E14]/90 px-3 backdrop-blur-md sm:h-16 sm:px-6">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          title="Buka Menu"
          className="shrink-0 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-neutral-400">
          <span className="hidden text-neutral-500 sm:inline">Admin Studio</span>
          <span className="hidden sm:inline">/</span>
          <span className="max-w-[130px] truncate font-bold text-white sm:max-w-none">
            {getBreadcrumbTitle(currentPath)}
          </span>
        </div>
      </div>

      {/* Right: Authenticated Admin Action */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Keluar dari Admin Studio"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        )}
      </div>
    </header>
  );
}
