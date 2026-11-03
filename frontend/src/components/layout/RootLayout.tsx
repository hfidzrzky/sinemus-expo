import React, { useState } from 'react';
import { toast } from 'sonner';
import { Navbar } from './Navbar';
import { MobileNavDrawer } from './MobileNavDrawer';
import { Footer } from './Footer';
import { QuickSearchModal } from '@/components/common/QuickSearchModal';
import { EmergencyAnnouncementBanner } from '@/components/common/EmergencyAnnouncementBanner';
import { AdminMaintenancePreviewBanner } from '@/components/common/AdminMaintenancePreviewBanner';
import { CinemaMaintenanceScreen } from '@/components/common/CinemaMaintenanceScreen';
import { usePublicSettingsQuery, useUpdateEmergencyControlsMutation } from '@/features/admin';
import { cn } from '@/lib/utils';
import type { User } from '@/features/auth';

interface RootLayoutProps {
  children?: React.ReactNode;
  currentUser?: User | null;
  activeTicketCount?: number;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onOpenAuthModal?: () => void;
  onOpenProfileDrawer?: () => void;
  onLogout?: () => void;
  showFooter?: boolean;
}

export function RootLayout({
  children,
  currentUser,
  activeTicketCount = 0,
  currentPath = '/',
  onNavigate = (path) => {
    window.location.pathname = path;
  },
  onOpenAuthModal = () => {},
  onOpenProfileDrawer,
  onLogout,
  showFooter = true,
}: RootLayoutProps): React.JSX.Element {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: publicSettings } = usePublicSettingsQuery();
  const updateEmergencyMutation = useUpdateEmergencyControlsMutation();

  const emergency = publicSettings?.emergency_controls;
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isMaintenanceActive = Boolean(emergency?.is_maintenance_mode && !isSuperAdmin);
  const isAdminPreviewActive = Boolean(emergency?.is_maintenance_mode && isSuperAdmin);
  const alertBanner = emergency?.emergency_alert_banner;
  const isWatchMode = currentPath.startsWith('/watch/');

  const handleDisableMaintenance = () => {
    if (!emergency) return;
    updateEmergencyMutation.mutate(
      {
        is_maintenance_mode: false,
        maintenance_message: emergency.maintenance_message,
        freeze_cinema_ticket_sales: emergency.freeze_cinema_ticket_sales,
        freeze_vod_rentals: emergency.freeze_vod_rentals,
        emergency_alert_banner: emergency.emergency_alert_banner,
      },
      {
        onSuccess: () => {
          toast.success(
            'Mode Pemeliharaan dinonaktifkan. Sistem kini terbuka untuk seluruh penonton!'
          );
        },
        onError: (err) => {
          toast.error(`Gagal menonaktifkan mode pemeliharaan: ${err.message}`);
        },
      }
    );
  };

  // Jika mode pemeliharaan aktif dan pengunjung BUKAN super_admin,
  // alihkan tampilan secara in-place ke layar sinema intermisi penuh (Zero-Scroll & Zero-Leak).
  if (isMaintenanceActive) {
    return (
      <CinemaMaintenanceScreen
        message={emergency?.maintenance_message}
        serverTime={publicSettings?.server_time}
        publicContact={publicSettings?.public_contact}
      />
    );
  }

  // Jika berada di mode pemutar film sinema (/watch/:slug),
  // sembunyikan Navbar & Footer untuk pengalaman nonton bioskop murni (Zero-Distraction Cinema Mode).
  if (isWatchMode) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-black font-sans text-neutral-200">
        <main className="h-full w-full overflow-hidden bg-black">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black font-sans text-neutral-200 selection:bg-[#0066FF] selection:text-white">
      {/* 1. Global Navbar with Top Announcement & Admin Preview Banners */}
      <Navbar
        currentUser={currentUser}
        activeTicketCount={activeTicketCount}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuthModal={onOpenAuthModal}
        onOpenProfileDrawer={onOpenProfileDrawer}
        onLogout={onLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        topBanner={
          <>
            {isAdminPreviewActive && (
              <AdminMaintenancePreviewBanner
                onNavigateToAdmin={() => onNavigate('/admin/settings')}
                onDisableMaintenance={handleDisableMaintenance}
                isDisabling={updateEmergencyMutation.isPending}
              />
            )}
            <EmergencyAnnouncementBanner
              isActive={alertBanner?.is_active}
              message={alertBanner?.message}
              type={alertBanner?.type}
            />
          </>
        }
      />

      {/* 2. Slide Drawer Mobile */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        activeTicketCount={activeTicketCount}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onOpenAuthModal={onOpenAuthModal}
        onOpenProfileDrawer={onOpenProfileDrawer}
        onLogout={onLogout}
      />

      {/* 3. Command Palette Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(type, slugOrId) => {
          if (type === 'movie') {
            onNavigate(`/film/${slugOrId}`);
          } else {
            onNavigate(`/event/${slugOrId}`);
          }
        }}
      />

      {/* 4. Main Page View Container */}
      <main
        className={cn(
          'w-full flex-1',
          currentPath !== '/' &&
            !currentPath.startsWith('/film/') &&
            (isAdminPreviewActive || alertBanner?.is_active ? 'pt-24 sm:pt-28' : 'pt-16')
        )}
      >
        {children}
      </main>

      {/* 5. Global Footer */}
      {showFooter && currentPath !== '/profile' && <Footer onNavigate={onNavigate} />}
    </div>
  );
}
