import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import type { User } from '@/features/auth';

export interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser: User | null;
  onLogout?: () => void;
}

export function AdminLayout({
  children,
  currentPath,
  onNavigate,
  currentUser,
  onLogout,
}: AdminLayoutProps): React.JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#07090E] text-neutral-100">
      {/* Desktop Persistent Sidebar */}
      <div
        className={`hidden transition-all duration-300 lg:block lg:flex-shrink-0 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="sticky top-0 h-screen">
          <AdminSidebar
            currentPath={currentPath}
            onNavigate={onNavigate}
            currentUser={currentUser}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 max-w-full flex-col border-r border-neutral-800 bg-[#0B0E14]">
            <AdminSidebar
              currentPath={currentPath}
              onNavigate={onNavigate}
              currentUser={currentUser}
              onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Navbar */}
        <AdminTopBar
          currentPath={currentPath}
          currentUser={currentUser}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onLogout={onLogout}
        />

        {/* Authorized Content Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
