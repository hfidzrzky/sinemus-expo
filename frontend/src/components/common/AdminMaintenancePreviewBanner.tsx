import React from 'react';
import { Shield, Power, Loader2 } from 'lucide-react';

export interface AdminMaintenancePreviewBannerProps {
  onNavigateToAdmin?: () => void;
  onDisableMaintenance?: () => void;
  isDisabling?: boolean;
}

export function AdminMaintenancePreviewBanner({
  onNavigateToAdmin,
  onDisableMaintenance,
  isDisabling = false,
}: AdminMaintenancePreviewBannerProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Mode Pratinjau Super Admin saat Pemeliharaan"
      className="relative w-full border-b border-amber-500/50 bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 px-4 py-2 text-amber-200 shadow-md sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
        {/* Sisi Kiri: Badge Live Preview & Keterangan */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="shadow-xs inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
            LIVE PREVIEW ADMIN
          </span>

          <p className="line-clamp-1 min-w-0 flex-1 text-xs font-medium leading-snug text-neutral-300 sm:line-clamp-none">
            <span className="font-semibold text-amber-300">Mode Pemeliharaan Aktif:</span> Publik
            saat ini diblokir (HTTP 503). Anda dapat memvalidasi seluruh konten penonton sebelum
            sistem dibuka.
          </p>
        </div>

        {/* Sisi Kanan: Aksi Cepat Admin */}
        <div className="flex shrink-0 items-center gap-2">
          {onNavigateToAdmin && (
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800/90 px-2.5 py-1 text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-700 hover:text-white"
            >
              <Shield className="h-3.5 w-3.5 text-neutral-400" />
              <span>Dashboard Admin</span>
            </button>
          )}

          {onDisableMaintenance && (
            <button
              type="button"
              onClick={onDisableMaintenance}
              disabled={isDisabling}
              className="shadow-xs inline-flex items-center gap-1.5 rounded-md border border-emerald-600/50 bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isDisabling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Power className="h-3.5 w-3.5" />
              )}
              <span>Buka Akses Publik</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
