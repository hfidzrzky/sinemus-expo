import React from 'react';
import { Clapperboard, MessageCircle, RotateCcw } from 'lucide-react';
import type { PublicSettingsData } from '@/features/admin';

export interface CinemaMaintenanceScreenProps {
  message?: string;
  serverTime?: string;
  publicContact?: PublicSettingsData['public_contact'];
  onRefresh?: () => void;
}

export function CinemaMaintenanceScreen({
  message,
  publicContact,
  onRefresh = () => window.location.reload(),
}: CinemaMaintenanceScreenProps): React.JSX.Element {
  const displayMessage =
    message?.trim() ||
    'Sistem Sinemus sedang dalam pemeliharaan berkala untuk peningkatan performa dan stabilitas layanan pemutaran. Akses penonton sementara waktu dialihkan.';

  const whatsappNumber = publicContact?.whatsapp_admin_number || '6281234567890';
  const cleanPhone = whatsappNumber.replace(/\D/g, '');
  const template =
    publicContact?.whatsapp_prefill_template ||
    'Halo Admin Sinemus, saya ingin menanyakan perihal pemeliharaan sistem...';
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(template)}`;

  const socialMedia = publicContact?.social_media || {};

  return (
    <div
      role="main"
      aria-label="Layar Pemeliharaan Sistem Sinemus"
      className="fixed inset-0 z-[9999] flex h-screen w-screen select-none flex-col justify-between overflow-hidden bg-black text-white selection:bg-[#0066FF] selection:text-white"
    >
      {/* 0. Cinematic Theater Background Image & Atmospheric Vignette */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          src="/images/maintenace/cinema-maintenance-bg.jpg"
          alt=""
          className="h-full w-full scale-105 object-cover object-center opacity-45"
        />
        {/* Balanced dark gradients to ensure background is nicely visible while keeping text legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      {/* 1. Ambient Cinema Lighting & Projector Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[750px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#0066FF]/25 via-[#0066FF]/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/5 blur-3xl" />

      {/* 2. Top Header Brand Bar */}
      <header className="relative z-10 flex w-full items-center justify-center pt-8 sm:pt-10">
        <div className="flex items-center gap-2.5">
          <img src="/sinemus-logo.png" alt="Sinemus Logo" className="h-8 w-8 object-contain" />
          <span className="font-display text-sm font-bold tracking-widest text-white">
            SINEMUS SCREEN
          </span>
        </div>
      </header>

      {/* 3. Hero Center Card: Cinema Intermission View */}
      <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-6 text-center sm:px-6">
        <div className="w-full max-w-xl">
          {/* Cinema Clapperboard Icon (Clean & Minimalist) */}
          <div className="mx-auto mb-4 flex justify-center">
            <Clapperboard className="h-11 w-11 stroke-[1.5] text-amber-400" />
          </div>

          {/* Heading Sinematik */}
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Layar Sedang Dipersiapkan
          </h1>
          <p className="mx-auto mt-2.5 max-w-md font-sans text-xs leading-relaxed text-neutral-400 sm:text-sm">
            Kami sedang menyelaraskan infrastruktur pemutaran dan sistem tiket untuk kenyamanan
            sinematik terbaik Anda.
          </p>

          {/* Admin Custom Message Box (Minimalist Centered Glassmorphism with Newline Preservation) */}
          <div className="my-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center backdrop-blur-md sm:p-6">
            <p className="whitespace-pre-line font-sans text-xs leading-relaxed text-neutral-300 sm:text-sm">
              &ldquo;{displayMessage}&rdquo;
            </p>
          </div>

          {/* Dual Action Buttons */}
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRefresh}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/90 px-5 py-3 font-sans text-xs font-semibold text-white transition-all hover:border-neutral-500 hover:bg-neutral-800 active:scale-95"
            >
              <RotateCcw className="h-4 w-4 text-neutral-400" />
              <span>Periksa Kesiapan Layar</span>
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-sans text-xs font-semibold text-white transition-all hover:bg-emerald-500 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Konsultasi WhatsApp</span>
            </a>
          </div>
        </div>
      </main>

      {/* 4. Bottom Footer: Official Social Links & Copyright */}
      <footer className="relative z-10 flex flex-col items-center justify-center pb-6 text-center text-xs text-neutral-500 sm:pb-8">
        {(socialMedia.instagram || socialMedia.tiktok || socialMedia.youtube) && (
          <div className="mb-3 flex items-center gap-5 font-sans text-xs text-neutral-400">
            {socialMedia.instagram && (
              <a
                href={socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                Instagram
              </a>
            )}
            {socialMedia.tiktok && (
              <a
                href={socialMedia.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                TikTok
              </a>
            )}
            {socialMedia.youtube && (
              <a
                href={socialMedia.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                YouTube
              </a>
            )}
          </div>
        )}

        <p className="font-sans text-[11px] text-neutral-600">
          &copy; {new Date().getFullYear()} Sinemus Screen. Hak Cipta Dilindungi Undang-Undang.
        </p>
      </footer>
    </div>
  );
}
