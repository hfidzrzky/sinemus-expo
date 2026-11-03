import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Ticket,
  User as UserIcon,
  Shield,
  LogOut,
  ChevronDown,
  Menu,
  Lock,
} from 'lucide-react';
import type { User } from '@/features/auth';
import { cn, maskPhoneNumber } from '@/lib/utils';

interface NavbarProps {
  currentUser?: User | null;
  activeTicketCount?: number;
  totalActiveCount?: number;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onOpenSearch: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileDrawer?: () => void;
  onLogout?: () => void;
  onToggleMobileMenu: () => void;
  topBanner?: React.ReactNode;
}

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Streaming Film', path: '/movies' },
  { label: 'Event Screening', path: '/events' },
];

export function Navbar({
  currentUser,
  activeTicketCount = 0,
  totalActiveCount,
  currentPath = '/',
  onNavigate = (path) => {
    window.location.pathname = path;
  },
  onOpenSearch,
  onOpenAuthModal,
  onLogout,
  onToggleMobileMenu,
  topBanner,
}: NavbarProps): React.JSX.Element {
  const badgeCount = totalActiveCount ?? activeTicketCount;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track window scroll position for dynamic navbar background & smooth shadow transition
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = Math.max(0, window.scrollY);
          // Transisi perlahan dan halus dalam rentang 0 s/d 90px sesuai kecepatan scroll pengguna
          const progress = Math.min(1, Math.max(0, currentY / 90));
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sinkronkan status scroll navbar seketika saat rute berpindah halaman
  useEffect(() => {
    const currentY = typeof window !== 'undefined' ? window.scrollY : 0;
    const rAF = window.requestAnimationFrame(() =>
      setScrollProgress(Math.min(1, Math.max(0, currentY / 90)))
    );
    return () => window.cancelAnimationFrame(rAF);
  }, [currentPath]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Animated sliding indicator for active navigation link
  const navRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [hasInitialized, setHasInitialized] = useState(false);

  const updateIndicator = useCallback(() => {
    const activeIndex = NAV_LINKS.findIndex((link) => {
      if (link.path === '/') return currentPath === '/';
      return currentPath.startsWith(link.path);
    });

    const activeTextEl = textRefs.current[activeIndex];
    const navEl = navRef.current;

    if (activeIndex !== -1 && activeTextEl && navEl) {
      const navRect = navEl.getBoundingClientRect();
      const textRect = activeTextEl.getBoundingClientRect();
      if (textRect.width > 0) {
        setIndicator({
          left: Math.round(textRect.left - navRect.left),
          width: Math.round(textRect.width),
          opacity: 1,
        });
        return;
      }
    }
    setIndicator((prev) => ({ ...prev, opacity: 0 }));
  }, [currentPath]);

  useEffect(() => {
    updateIndicator();

    let raf2: number;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        updateIndicator();
        setHasInitialized(true);
      });
    });

    const timer = setTimeout(() => {
      updateIndicator();
    }, 100);

    if ('fonts' in document) {
      document.fonts.ready.then(updateIndicator);
    }

    window.addEventListener('resize', updateIndicator);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  return (
    <header
      className="fixed left-0 right-0 top-0 z-40 w-full border-none transition-[background-color,box-shadow] duration-200 ease-out will-change-[background-color,box-shadow]"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${scrollProgress})`,
        boxShadow: `0 10px 30px -5px rgba(0, 0, 0, ${scrollProgress * 0.85})`,
      }}
    >
      {/* Dynamic gradient overlay yang memudar perlahan seiring scroll dengan transisi yang sinkron */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/95 via-black/75 to-transparent transition-opacity duration-200 ease-out"
        style={{ opacity: 1 - scrollProgress }}
      />
      {topBanner}
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* SISI KIRI: Brand Logo & Desktop Nav Links */}
        <div className="flex items-center space-x-8">
          {/* Logo Sinemus */}
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex select-none items-center text-left outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            aria-label="Beranda Sinemus"
          >
            <img src="/sinemus-logo.png" alt="Sinemus Logo" className="h-8 w-8 object-contain" />
          </button>

          {/* Desktop Navigation Links with Smooth Sliding Indicator */}
          <nav ref={navRef} className="relative hidden h-9 items-center gap-1 md:flex">
            {NAV_LINKS.map((link, idx) => {
              const isActive =
                link.path === '/' ? currentPath === '/' : currentPath.startsWith(link.path);
              return (
                <button
                  key={link.path}
                  ref={(el) => {
                    buttonRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => onNavigate(link.path)}
                  className={cn(
                    'relative flex h-9 select-none items-center justify-center border-none px-3 text-sm outline-none transition-colors duration-200 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0',
                    isActive ? 'font-bold text-white' : 'font-medium text-white/80 hover:text-white'
                  )}
                >
                  <span
                    ref={(el) => {
                      textRefs.current[idx] = el;
                    }}
                    className="inline-block"
                  >
                    {link.label}
                  </span>
                </button>
              );
            })}

            {/* Smooth Sliding Underline Indicator - Tepat rapat presisi di bawah teks tanpa blur */}
            <span
              className={cn(
                'pointer-events-none absolute bottom-0.5 m-0 h-[2.5px] rounded-full bg-[#0066FF] shadow-none',
                hasInitialized ? 'transition-all duration-300 ease-out' : 'transition-none'
              )}
              style={{
                left: `${indicator.left}px`,
                width: `${indicator.width}px`,
                opacity: indicator.opacity,
              }}
            />
          </nav>
        </div>

        {/* SISI KANAN: Search, Tiket Saya, & Auth / User State */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Tombol Pencarian Cepat */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="group flex h-9 w-9 items-center justify-center gap-2.5 rounded-xl p-2 text-neutral-400 transition-all hover:text-white sm:w-32 sm:justify-start sm:border sm:border-neutral-800 sm:bg-neutral-900/90 sm:px-3.5"
            aria-label="Search"
          >
            <Search className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-white" />
            <span className="hidden text-sm text-neutral-400 group-hover:text-neutral-200 sm:inline">
              Search
            </span>
          </button>

          {/* KONDISI GUEST: Tombol Masuk & Hamburger */}
          {!currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black shadow-sm transition-all hover:bg-neutral-200 active:scale-95 sm:px-4 sm:text-sm"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-300 transition-colors hover:text-white md:hidden"
                aria-label="Buka menu navigasi mobile"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          ) : (
            /* KONDISI AUTHENTICATED: Avatar & Profile Dropdown */
            <div className="flex items-center space-x-3">
              {/* Desktop Avatar & Profile Dropdown (Hanya di layar md ke atas) */}
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 rounded-lg border border-neutral-800 bg-neutral-900 p-1 pl-2 pr-2.5 text-sm transition-all hover:border-neutral-700"
                >
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.name}
                      className="h-6 w-6 rounded-full border border-neutral-700 object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-500/30 bg-blue-600/20 text-xs font-bold text-blue-400">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate text-xs font-medium text-white">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                </button>

                {/* Dropdown Menu Popover */}
                {isDropdownOpen && (
                  <div className="animate-in fade-in zoom-in-95 absolute right-0 mt-2 w-64 space-y-1 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl duration-150">
                    {/* Header: User Info */}
                    <div className="mb-1 border-b border-neutral-900 px-3 py-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {currentUser.name}
                      </p>
                      <p className="truncate text-xs text-neutral-400">{currentUser.email}</p>
                      {currentUser.is_phone_locked && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded border border-neutral-700 bg-neutral-800/60 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                          <Lock className="h-2.5 w-2.5" />
                          <span>{maskPhoneNumber(currentUser.phone_number)}</span>
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigate('/profile');
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
                    >
                      <UserIcon className="h-4 w-4 text-neutral-400" />
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigate('/tickets');
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Ticket className="h-4 w-4 text-neutral-400" />
                        <span>My Tickets & Films</span>
                      </div>
                      {Boolean(badgeCount && badgeCount > 0) && (
                        <span className="rounded-full bg-[#0066FF] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {badgeCount}
                        </span>
                      )}
                    </button>

                    {/* Menu Khusus Super Admin */}
                    {currentUser.role === 'super_admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onNavigate('/admin');
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Shield className="h-4 w-4 text-blue-400" />
                          <span>Admin Studio</span>
                        </div>
                        <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                          Admin
                        </span>
                      </button>
                    )}

                    <div className="my-1 border-t border-neutral-900" />

                    {/* Tombol Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <LogOut className="h-4 w-4 text-rose-400" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Avatar Button (Pemicu Sidebar Drawer di mobile) */}
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 py-1 pl-1.5 pr-2 transition-all hover:border-neutral-700 active:scale-95 md:hidden"
                aria-label="Buka menu navigasi & profil"
              >
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name}
                    className="h-6 w-6 rounded-full border border-neutral-700 object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-500/30 bg-blue-600/20 text-xs font-bold text-blue-400">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
