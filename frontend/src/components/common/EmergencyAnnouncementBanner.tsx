import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface EmergencyAnnouncementBannerProps {
  isActive?: boolean;
  message?: string | null;
  type?: 'warning' | 'danger' | 'info';
}

export function EmergencyAnnouncementBanner({
  isActive = false,
  message,
  type = 'warning',
}: EmergencyAnnouncementBannerProps): React.JSX.Element | null {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

  // Jika pesan saat ini sudah di-dismiss oleh pengguna, sembunyikan banner
  const isDismissed = Boolean(message && dismissedMessage === message);

  if (!isActive || !message?.trim() || isDismissed) return null;

  const typeConfig = {
    warning: {
      bg: 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 border-b border-amber-600/40 shadow-sm',
      icon: AlertTriangle,
      iconClass: 'text-neutral-950 fill-neutral-950/20',
      badge: 'PEMBERITAHUAN',
      badgeClass:
        'inline-flex items-center shrink-0 rounded bg-neutral-950 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 shadow-xs',
      textClass: 'text-neutral-950 font-semibold',
      closeBtn:
        'text-neutral-950/70 hover:text-neutral-950 hover:bg-black/10 rounded-full p-1 transition-colors',
    },
    danger: {
      bg: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white border-b border-red-700/40 shadow-sm',
      icon: AlertCircle,
      iconClass: 'text-white fill-white/20',
      badge: 'PENGUMUMAN DARURAT',
      badgeClass:
        'inline-flex items-center shrink-0 rounded bg-black/40 border border-white/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs',
      textClass: 'text-white font-semibold',
      closeBtn:
        'text-white/80 hover:text-white hover:bg-black/20 rounded-full p-1 transition-colors',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-600 via-sky-600 to-blue-600 text-white border-b border-blue-700/40 shadow-sm',
      icon: Info,
      iconClass: 'text-white fill-white/20',
      badge: 'INFORMASI OPERASIONAL',
      badgeClass:
        'inline-flex items-center shrink-0 rounded bg-black/40 border border-white/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs',
      textClass: 'text-white font-semibold',
      closeBtn:
        'text-white/80 hover:text-white hover:bg-black/20 rounded-full p-1 transition-colors',
    },
  }[type];

  const Icon = typeConfig.icon;

  return (
    <div
      role="alert"
      className={`relative w-full px-4 py-2 transition-all duration-200 sm:px-6 ${typeConfig.bg}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Icon className={`h-4 w-4 shrink-0 ${typeConfig.iconClass}`} />
          <span className={typeConfig.badgeClass}>{typeConfig.badge}</span>
          <p
            className={`line-clamp-2 min-w-0 flex-1 text-xs leading-snug sm:line-clamp-1 sm:text-sm ${typeConfig.textClass}`}
          >
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDismissedMessage(message ?? null)}
          className={`shrink-0 ${typeConfig.closeBtn}`}
          aria-label="Tutup pengumuman"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
