import React from 'react';
import { Clock } from 'lucide-react';

export interface RateLimitAlertBannerProps {
  /**
   * Sisa detik cooldown. Jika <= 0, banner tidak akan dirender.
   */
  cooldownSeconds: number;
  /**
   * Nama aksi yang sedang dibatasi (contoh: "ekstraksi karcis", "pemesanan tiket", "pencarian data").
   * Default: "permintaan".
   */
  actionName?: string;
  /**
   * ClassName opsional untuk custom layout styling.
   */
  className?: string;
}

/**
 * Komponen Banner Reusable untuk Menampilkan Status Cooldown Rate Limit (SRP).
 * Memberikan visibilitas waktu tunggu yang jelas, menenangkan pengguna, dan mencegah spam klik.
 */
export function RateLimitAlertBanner({
  cooldownSeconds,
  actionName = 'permintaan',
  className = '',
}: RateLimitAlertBannerProps): React.JSX.Element | null {
  if (cooldownSeconds <= 0) return null;

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 transition-all ${className}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
        <Clock className="h-4 w-4 animate-pulse" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">Batas Frekuensi Permintaan Tercapai (Rate Limit)</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-amber-200/90">
          Sistem sedang dalam masa jeda pengamanan (*cooldown*). Anda dapat mengirim ulang{' '}
          {actionName} dalam{' '}
          <span className="font-mono text-xs font-bold text-amber-400">
            {cooldownSeconds} detik
          </span>
          .
        </p>
      </div>
    </div>
  );
}
