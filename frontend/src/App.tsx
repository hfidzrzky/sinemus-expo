import React, { useState, useEffect } from 'react';
import { RootLayout } from '@/components/layout';
import { ErrorBoundary } from '@/components/common';
import {
  HomePage,
  EventsCataloguePage,
  MoviesCataloguePage,
  EventDetailPage,
  MovieDetailPage,
  WatchPage,
  ProfilePage,
  MyTicketsPage,
  NotFoundPage,
  AdminDashboardPage,
  AdminEventsPage,
  AdminEventEditorPage,
  AdminMoviesPage,
  AdminMovieEditorPage,
  AdminMovieAccessPage,
  AdminOrdersPage,
  AdminVouchersPage,
  AdminVoucherEditorPage,
  AdminBannersPage,
  AdminBannerEditorPage,
  AdminUsersPage,
  AdminSettingsPage,
  AdminScannerPage,
} from '@/pages';
import { useAuth, GoogleAuthModal, PhoneCompletionModal, UserProfileDrawer } from '@/features/auth';
import { useMyTicketsQuery } from '@/features/tickets';
import { AdminLayout, AdminRouteGuard } from '@/features/admin';
import { tokenStorage } from '@/lib/token-storage';

export default function App(): React.JSX.Element {
  const {
    currentUser,
    isAuthenticated,
    isAuthModalOpen,
    isPhoneCompletionModalOpen,
    isProfileDrawerOpen,
    openAuthModal,
    closeAuthModal,
    closePhoneCompletionModal,
    openProfileDrawer,
    closeProfileDrawer,
    logout,
  } = useAuth();

  const [currentPath, setCurrentPath] = useState(() => {
    return typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dynamic active tickets count for logged-in user
  const { data: userTickets = [] } = useMyTicketsQuery('upcoming', isAuthenticated);
  const activeTicketCount = isAuthenticated ? userTickets.length : 0;

  const handleNavigate = (path: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------------------------------------------------------------------------
  // Admin Route Handler
  // ---------------------------------------------------------------------------
  if (currentPath.startsWith('/admin')) {
    const renderAdminContent = () => {
      if (currentPath === '/admin' || currentPath === '/admin/dashboard') {
        return <AdminDashboardPage onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/events/new') {
        return <AdminEventEditorPage onNavigate={handleNavigate} />;
      }
      if (currentPath.startsWith('/admin/events/') && currentPath.endsWith('/edit')) {
        const parts = currentPath.split('/');
        const eventId = Number(parts[3]);
        return <AdminEventEditorPage eventId={eventId} onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/events' || currentPath.startsWith('/admin/events/')) {
        return <AdminEventsPage onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/movies/new') {
        return <AdminMovieEditorPage onNavigate={handleNavigate} />;
      }
      if (currentPath.startsWith('/admin/movies/') && currentPath.endsWith('/edit')) {
        const parts = currentPath.split('/');
        const movieId = Number(parts[3]);
        return <AdminMovieEditorPage movieId={movieId} onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/movies' || currentPath.startsWith('/admin/movies/')) {
        return <AdminMoviesPage onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/movie-access') {
        return <AdminMovieAccessPage onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/orders') {
        return <AdminOrdersPage onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/vouchers/new') {
        return <AdminVoucherEditorPage onNavigate={handleNavigate} />;
      }
      if (currentPath.startsWith('/admin/vouchers/') && currentPath.endsWith('/edit')) {
        const parts = currentPath.split('/');
        const voucherId = Number(parts[3]);
        return <AdminVoucherEditorPage voucherId={voucherId} onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/vouchers') {
        return <AdminVouchersPage onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/banners/new') {
        return <AdminBannerEditorPage onNavigate={handleNavigate} />;
      }
      if (currentPath.startsWith('/admin/banners/') && currentPath.endsWith('/edit')) {
        const parts = currentPath.split('/');
        const bannerId = Number(parts[3]);
        return <AdminBannerEditorPage bannerId={bannerId} onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/banners') {
        return <AdminBannersPage onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/users') {
        return <AdminUsersPage onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/settings') {
        return <AdminSettingsPage onNavigate={handleNavigate} />;
      }
      if (currentPath === '/admin/scanner') {
        return <AdminScannerPage onNavigate={handleNavigate} />;
      }

      return <NotFoundPage scope="admin" currentPath={currentPath} onNavigate={handleNavigate} />;
    };

    return (
      <>
        <AdminRouteGuard
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onOpenAuthModal={openAuthModal}
          onLogout={logout}
        >
          <AdminLayout
            currentPath={currentPath}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={logout}
          >
            <ErrorBoundary
              key={currentPath}
              fallbackTitle="Gagal Menampilkan Halaman Admin Ini"
              onReset={() => handleNavigate('/admin/dashboard')}
            >
              {renderAdminContent()}
            </ErrorBoundary>
          </AdminLayout>
        </AdminRouteGuard>

        {/* Global Modals for Admin Scope */}
        <GoogleAuthModal
          isOpen={isAuthModalOpen && !isAuthenticated && !tokenStorage.hasToken()}
          onClose={closeAuthModal}
        />
        <PhoneCompletionModal
          isOpen={isPhoneCompletionModalOpen}
          onClose={closePhoneCompletionModal}
        />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Customer Website Route Handler
  // ---------------------------------------------------------------------------
  const renderCustomerRoute = () => {
    if (currentPath === '/') {
      return <HomePage onNavigate={handleNavigate} />;
    }

    if (currentPath === '/profile') {
      return <ProfilePage onNavigate={handleNavigate} />;
    }

    if (currentPath === '/tickets') {
      return <MyTicketsPage onNavigate={handleNavigate} />;
    }

    if (currentPath === '/events') {
      return <EventsCataloguePage onNavigate={handleNavigate} />;
    }

    if (currentPath === '/movies' || currentPath === '/film') {
      return <MoviesCataloguePage onNavigate={handleNavigate} />;
    }

    if (currentPath.startsWith('/event/')) {
      const slug = currentPath.replace('/event/', '').split('?')[0];
      return <EventDetailPage slug={slug} onNavigate={handleNavigate} />;
    }

    if (currentPath.startsWith('/events/')) {
      const slug = currentPath.replace('/events/', '').split('?')[0];
      return <EventDetailPage slug={slug} onNavigate={handleNavigate} />;
    }

    if (
      currentPath.startsWith('/film/') ||
      currentPath.startsWith('/movie/') ||
      currentPath.startsWith('/movies/')
    ) {
      const slug = currentPath.replace(/^\/(film|movies?)\//, '').split('?')[0];
      return <MovieDetailPage slug={slug} onNavigate={handleNavigate} />;
    }

    if (currentPath.startsWith('/watch/')) {
      const slug = currentPath.replace('/watch/', '').split('?')[0];
      return <WatchPage slug={slug} onNavigate={handleNavigate} />;
    }

    // 404 Route for Unregistered Pages
    return <NotFoundPage scope="customer" currentPath={currentPath} onNavigate={handleNavigate} />;
  };

  return (
    <RootLayout
      currentUser={currentUser}
      activeTicketCount={activeTicketCount}
      currentPath={currentPath}
      onNavigate={handleNavigate}
      onOpenAuthModal={openAuthModal}
      onOpenProfileDrawer={openProfileDrawer}
      onLogout={logout}
    >
      {/* Main Customer Content */}
      {renderCustomerRoute()}

      {/* Global Modals & Drawers */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen && !isAuthenticated && !tokenStorage.hasToken()}
        onClose={closeAuthModal}
      />
      <PhoneCompletionModal
        isOpen={isPhoneCompletionModalOpen}
        onClose={closePhoneCompletionModal}
      />
      <UserProfileDrawer isOpen={isProfileDrawerOpen} onClose={closeProfileDrawer} />
    </RootLayout>
  );
}
