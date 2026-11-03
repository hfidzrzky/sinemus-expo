import React, { useEffect } from 'react';
import {
  X,
  Home,
  Clapperboard,
  Calendar,
  Ticket,
  User as UserIcon,
  Shield,
  LogOut,
  LogIn,
  Lock,
} from 'lucide-react';
import type { User } from '@/features/auth';
import { cn, maskPhoneNumber } from '@/lib/utils';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  activeTicketCount?: number;
  totalActiveCount?: number;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onOpenAuthModal: () => void;
  onOpenProfileDrawer?: () => void;
  onLogout?: () => void;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  currentUser,
  activeTicketCount = 0,
  totalActiveCount,
  currentPath = '/',
  onNavigate = (path) => {
    window.location.pathname = path;
  },
  onOpenAuthModal,
  onLogout,
}: MobileNavDrawerProps): React.JSX.Element | null {
  const badgeCount = totalActiveCount ?? activeTicketCount;
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Streaming Film', path: '/movies', icon: Clapperboard },
    { label: 'Event Screening', path: '/events', icon: Calendar },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="animate-in fade-in fixed inset-0 z-50 bg-black/80 backdrop-blur-sm duration-200 md:hidden"
      onClick={onClose}
    >
      <div
        className="animate-in slide-in-from-right fixed inset-y-0 right-0 flex w-4/5 max-w-sm flex-col justify-between border-l border-neutral-800 bg-neutral-950 p-6 shadow-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Drawer */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/sinemus-logo.png" alt="Sinemus Logo" className="h-8 w-8 object-contain" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
              aria-label="Tutup menu navigasi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Card / Login Banner */}
          {currentUser ? (
            <div
              onClick={() => {
                onClose();
                onNavigate('/profile');
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onClose();
                  onNavigate('/profile');
                }
              }}
              className="cursor-pointer space-y-2 rounded-xl border border-neutral-800 bg-neutral-900 p-3.5 transition-colors hover:border-neutral-700"
            >
              <div className="flex items-center space-x-3">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name}
                    className="h-10 w-10 rounded-full border border-neutral-700 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-600/20 text-sm font-bold text-blue-400">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
                  <p className="truncate text-xs text-neutral-400">{currentUser.email}</p>
                </div>
              </div>

              {currentUser.is_phone_locked && (
                <div className="inline-flex items-center gap-1 rounded border border-neutral-700 bg-neutral-800/60 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                  <Lock className="h-2.5 w-2.5" />
                  <span>{maskPhoneNumber(currentUser.phone_number)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-xs leading-relaxed text-neutral-400">
                Masuk dengan akun Google untuk memesan tiket bioskop & menonton film pilihan.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="flex w-full items-center justify-center space-x-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition-all hover:bg-neutral-200 active:scale-95"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1 pt-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate(link.path);
                  }}
                  className={cn(
                    'flex w-full items-center space-x-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all',
                    isActive
                      ? 'border border-[#0066FF]/30 bg-[#0066FF]/10 font-semibold text-white'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn('h-4 w-4', isActive ? 'text-[#0066FF]' : 'text-neutral-400')}
                  />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {currentUser && (
              <>
                <div className="my-2 border-t border-neutral-900" />

                {/* 1. Profil Saya */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('/profile');
                  }}
                  className={cn(
                    'flex w-full items-center space-x-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all',
                    currentPath === '/profile'
                      ? 'border border-[#0066FF]/30 bg-[#0066FF]/10 font-semibold text-white'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  )}
                >
                  <UserIcon
                    className={cn(
                      'h-4 w-4',
                      currentPath === '/profile' ? 'text-[#0066FF]' : 'text-neutral-400'
                    )}
                  />
                  <span>My Profile</span>
                </button>

                {/* 2. Tiket & Film Saya */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('/tickets');
                  }}
                  className={cn(
                    'flex w-full items-center space-x-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all',
                    currentPath === '/tickets'
                      ? 'border border-[#0066FF]/30 bg-[#0066FF]/10 font-semibold text-white'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  )}
                >
                  <Ticket
                    className={cn(
                      'h-4 w-4',
                      currentPath === '/tickets' ? 'text-[#0066FF]' : 'text-neutral-400'
                    )}
                  />
                  <span>My Tickets & Films</span>
                  {Boolean(badgeCount && badgeCount > 0) && (
                    <span className="ml-auto rounded-full bg-[#0066FF] px-2 py-0.5 text-[10px] font-bold text-white">
                      {badgeCount}
                    </span>
                  )}
                </button>

                {/* 3. Admin Studio (Khusus Super Admin) */}
                {currentUser.role === 'super_admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('/admin');
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-neutral-300 transition-all hover:bg-neutral-900 hover:text-white"
                  >
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span>Admin Studio</span>
                    </div>
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                      Admin
                    </span>
                  </button>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Footer Drawer / Logout Button */}
        {currentUser && (
          <div className="border-t border-neutral-900 pt-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onLogout) onLogout();
              }}
              className="flex w-full items-center justify-center space-x-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/20"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
