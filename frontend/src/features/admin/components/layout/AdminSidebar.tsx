import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Film,
  KeyRound,
  Image,
  Tag,
  CreditCard,
  QrCode,
  Users,
  Settings,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { User } from '@/features/auth';

export interface NavItem {
  name: string;
  path: string;
  aliases: string[];
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export interface AdminSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser: User | null;
  onCloseMobileMenu?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({
  currentPath,
  onNavigate,
  currentUser,
  onCloseMobileMenu,
  isCollapsed = false,
  onToggleCollapse,
}: AdminSidebarProps): React.JSX.Element {
  const handleNav = (path: string) => {
    onNavigate(path);
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  const navGroups: NavGroup[] = [
    {
      group: 'UTAMA',
      items: [
        {
          name: 'Dashboard & Analitik',
          path: '/admin/dashboard',
          aliases: ['/admin'],
          icon: LayoutDashboard,
        },
      ],
    },
    {
      group: 'MANAJEMEN EVENT & SCREENING',
      items: [
        {
          name: 'Daftar Event & Screening',
          path: '/admin/events',
          aliases: ['/admin/events/create'],
          icon: Calendar,
        },
      ],
    },
    {
      group: 'MANAJEMEN FILM (VoD)',
      items: [
        {
          name: 'Katalog Film VoD',
          path: '/admin/movies',
          aliases: [],
          icon: Film,
        },
        {
          name: 'Entitlement Manual',
          path: '/admin/movie-access',
          aliases: [],
          icon: KeyRound,
        },
      ],
    },
    {
      group: 'KONTEN & PROMOSI',
      items: [
        {
          name: 'Banner Beranda',
          path: '/admin/banners',
          aliases: [],
          icon: Image,
        },
        {
          name: 'Voucher & Diskon',
          path: '/admin/vouchers',
          aliases: [],
          icon: Tag,
        },
      ],
    },
    {
      group: 'TRANSAKSI & KEUANGAN',
      items: [
        {
          name: 'Riwayat Transaksi',
          path: '/admin/orders',
          aliases: [],
          icon: CreditCard,
        },
      ],
    },
    {
      group: 'OPERASIONAL VENUE',
      items: [
        {
          name: 'Mobile QR Scanner',
          path: '/admin/scanner',
          aliases: [],
          icon: QrCode,
          badge: 'Live',
        },
      ],
    },
    {
      group: 'PENGGUNA & PENGATURAN',
      items: [
        {
          name: 'Data Pengguna (Users)',
          path: '/admin/users',
          aliases: [],
          icon: Users,
        },
        {
          name: 'Pengaturan Sistem',
          path: '/admin/settings',
          aliases: [],
          icon: Settings,
        },
      ],
    },
  ];

  const isCurrentActive = (itemPath: string, aliases: string[]) => {
    const basePath = currentPath.split('?')[0];
    if (currentPath === itemPath || basePath === itemPath) return true;
    if (aliases.includes(currentPath) || aliases.includes(basePath)) return true;
    if (itemPath === '/admin/events' && basePath.startsWith('/admin/events/')) {
      return true;
    }
    if (itemPath === '/admin/movies' && basePath.startsWith('/admin/movies/')) {
      return true;
    }
    return false;
  };

  return (
    <aside
      className={`flex h-full flex-col justify-between border-r border-neutral-800 bg-[#0B0E14] text-neutral-200 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Section */}
      <div className="admin-sidebar-scrollbar flex-1 overflow-y-auto overflow-x-hidden">
        {/* Brand & User Header */}
        <div
          className={`flex items-center border-b border-neutral-800/80 py-4 transition-all duration-300 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => handleNav('/admin')}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left outline-none transition-opacity hover:opacity-90 focus:outline-none"
              aria-label="Beranda Admin Sinemus"
              title={currentUser?.email || 'Admin Sinemus'}
            >
              <img
                src="/sinemus-logo.png"
                alt="Sinemus Logo"
                className="h-7 w-7 shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-bold text-white">
                    {currentUser?.name || 'Admin'}
                  </p>
                  <span className="shrink-0 rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">
                    Super Admin
                  </span>
                </div>
                <p className="truncate text-[10px] text-neutral-400">
                  {currentUser?.email || 'admin@sinemus.id'}
                </p>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNav('/admin')}
              className="flex items-center justify-center outline-none transition-opacity hover:opacity-90 focus:outline-none"
              aria-label="Beranda Admin Sinemus"
              title={`${currentUser?.name || 'Super Admin'} (${currentUser?.email || 'Admin'})`}
            >
              <img src="/sinemus-logo.png" alt="Sinemus Logo" className="h-7 w-7 object-contain" />
            </button>
          )}

          {/* Desktop Toggle/Close Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
              className="hidden items-center justify-center rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white lg:flex"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Mobile Close Button */}
          {onCloseMobileMenu && (
            <button
              type="button"
              onClick={onCloseMobileMenu}
              title="Tutup Menu"
              className="flex items-center justify-center rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-4 px-2.5 pb-2 pt-3">
          {navGroups.map((group) => (
            <div key={group.group}>
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold tracking-wider text-neutral-500">
                  {group.group}
                </p>
              )}
              <div className={`${!isCollapsed ? 'mt-1.5' : ''} space-y-1`}>
                {group.items.map((item) => {
                  const active = isCurrentActive(item.path, item.aliases);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleNav(item.path)}
                      title={isCollapsed ? item.name : undefined}
                      className={`group flex w-full items-center rounded-xl text-xs font-semibold transition-all ${
                        isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                      } ${
                        active
                          ? 'bg-[#0066FF] text-white'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      <div
                        className={`flex min-w-0 items-center ${
                          isCollapsed ? 'justify-center' : 'gap-3'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 flex-shrink-0 ${
                            active ? 'text-white' : 'text-neutral-500 group-hover:text-white'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Switch to Customer View */}
      <div className="border-t border-neutral-800/80 p-3">
        <button
          type="button"
          onClick={() => handleNav('/')}
          title={isCollapsed ? 'Kembali ke Website Penonton' : undefined}
          className={`flex w-full items-center rounded-xl border border-neutral-700 bg-neutral-900/80 text-xs font-bold text-neutral-300 transition-all hover:border-neutral-600 hover:bg-neutral-800 hover:text-white ${
            isCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 px-3 py-2.5'
          }`}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Kembali ke Website Penonton</span>}
        </button>
      </div>
    </aside>
  );
}
