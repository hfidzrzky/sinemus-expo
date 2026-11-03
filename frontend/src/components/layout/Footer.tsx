import React, { useState, useEffect } from 'react';
import { Instagram, Youtube, X, MessageCircle } from 'lucide-react';
import { usePublicSettingsQuery } from '@/features/admin';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

type InfoModalType = 'terms' | 'privacy' | 'ticket-guide' | null;

interface InfoModalContent {
  title: string;
  category: string;
  paragraphs: string[];
}

function getModalContent(
  type: NonNullable<InfoModalType>,
  seatLockMinutes: number,
  vodRentalHours: number
): InfoModalContent {
  switch (type) {
    case 'terms':
      return {
        category: 'Ketentuan Layanan',
        title: 'Syarat & Ketentuan Pemesanan',
        paragraphs: [
          `Pemesanan tiket pemutaran film di Sinemus bersifat final setelah pembayaran terkonfirmasi. Setiap reservasi kursi memiliki batas waktu checkout ${seatLockMinutes} menit sebelum kuota dilepas kembali ke publik.`,
          `Akses pemutaran film digital (Video on Demand) berlaku selama ${vodRentalHours} jam terhitung sejak transaksi terkonfirmasi, dengan kualitas tayang beresolusi tinggi.`,
          'Tiket dan hak akses yang telah dibeli tidak dapat ditukar atau diuangkan kembali, kecuali terjadi pembatalan pemutaran secara sepihak oleh penyelenggara venue.',
        ],
      };
    case 'privacy':
      return {
        category: 'Privasi & Data',
        title: 'Kebijakan Privasi Pengguna',
        paragraphs: [
          'Sinemus menjaga keamanan data pengguna dengan membatasi penyimpanan informasi pada identitas dasar dari Google OAuth (nama dan email) serta nomor WhatsApp yang terverifikasi.',
          'Nomor telepon Anda digunakan khusus untuk keperluan validasi identitas pesanan e-tiket dan tidak akan dibagikan kepada pihak manapun untuk keperluan pemasaran tanpa izin.',
          'Seluruh aktivitas transaksi dan riwayat menonton dienkripsi secara privat dan hanya dapat diakses melalui akun Anda yang terautentikasi.',
        ],
      };
    case 'ticket-guide':
      return {
        category: 'Panduan Penonton',
        title: 'Panduan E-Tiket & Pemutaran',
        paragraphs: [
          'Setelah transaksi tiket screening berhasil, e-tiket resmi beserta kode QR terenkripsi akan langsung tersimpan di menu "Tiket & Transaksi".',
          'Tunjukkan kode QR e-tiket dari perangkat seluler Anda kepada petugas venue di pintu masuk untuk proses pemindaian mandiri (check-in).',
          'Pastikan kecerahan layar perangkat Anda mencukupi saat proses pemindaian agar verifikasi tiket berjalan cepat dan lancar.',
        ],
      };
  }
}

export function Footer({
  onNavigate = (path) => {
    window.location.pathname = path;
  },
}: FooterProps): React.JSX.Element {
  const [activeModal, setActiveModal] = useState<InfoModalType>(null);
  const { data: publicSettings } = usePublicSettingsQuery();

  const seatLockMinutes = publicSettings?.business_policies?.seat_lock_duration_minutes ?? 15;
  const vodRentalHours = publicSettings?.business_policies?.vod_rental_duration_hours ?? 48;

  const waNumber =
    publicSettings?.public_contact?.whatsapp_admin_number.replace(/\D/g, '') || '6281234567890';
  const waTemplate =
    publicSettings?.public_contact?.whatsapp_prefill_template ||
    'Halo Sinemus, saya mengalami kendala terkait pemesanan tiket/pemutaran...';
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waTemplate)}`;
  const instagramUrl =
    publicSettings?.public_contact?.social_media?.instagram || 'https://instagram.com/sinemus.id';
  const tiktokUrl =
    publicSettings?.public_contact?.social_media?.tiktok || 'https://tiktok.com/@sinemus.id';
  const youtubeUrl =
    publicSettings?.public_contact?.social_media?.youtube || 'https://youtube.com/@sinemusscreen';
  const supportEmail = publicSettings?.public_contact?.support_email || 'support@sinemus.id';
  const operatingHours = publicSettings?.public_contact?.operating_hours;

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModal]);

  return (
    <>
      <footer className="relative z-30 mt-auto w-full border-t border-neutral-900 bg-black text-neutral-400">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          {/* Main Grid: 12 Columns */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 lg:gap-12">
            {/* Kolom 1: Brand & Tagline Sinematik (4 Cols) */}
            <div className="flex flex-col gap-4 md:col-span-5 lg:col-span-4">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="group flex w-max items-center gap-3 text-left focus:outline-none"
                aria-label="Beranda Sinemus"
              >
                <img
                  src="/sinemus-logo.png"
                  alt="Sinemus Logo"
                  className="h-8 w-8 object-contain transition-transform duration-200 group-hover:scale-105"
                />
                <span className="font-display text-lg font-bold tracking-widest text-white">
                  SINEMUS SCREEN
                </span>
              </button>

              <p className="max-w-sm text-xs leading-relaxed text-neutral-400 sm:text-sm">
                Platform bioskop alternatif dan kurasi film independen Indonesia. Menghubungkan
                karya sineas langsung ke layar bioskop dan ruang penonton.
              </p>
            </div>

            {/* Kolom 2: Navigasi & Jelajah (2 Cols) */}
            <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-2">
              <h3 className="w-max border-b border-neutral-800 pb-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-300">
                Navigasi
              </h3>
              <nav className="flex flex-col gap-2.5 text-xs text-neutral-400 sm:text-sm">
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="w-max text-left transition-colors duration-150 hover:text-white"
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/movies')}
                  className="w-max text-left transition-colors duration-150 hover:text-white"
                >
                  Streaming Film
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/events')}
                  className="w-max text-left transition-colors duration-150 hover:text-white"
                >
                  Event Screening
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/tickets')}
                  className="w-max text-left transition-colors duration-150 hover:text-white"
                >
                  Tickets & Films
                </button>
              </nav>
            </div>

            {/* Kolom 3: Ketentuan & Panduan (3 Cols) */}
            <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-3">
              <h3 className="w-max border-b border-neutral-800 pb-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-300">
                Informasi
              </h3>
              <nav className="flex flex-col gap-2.5 text-xs text-neutral-400 sm:text-sm">
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  className="w-max text-left transition-colors duration-150 hover:text-white"
                >
                  Syarat & Ketentuan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="w-max text-left transition-colors duration-150 hover:text-white"
                >
                  Kebijakan Privasi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('ticket-guide')}
                  className="w-max text-left transition-colors duration-150 hover:text-white"
                >
                  Panduan Masuk & Tiket
                </button>
              </nav>
            </div>

            {/* Kolom 4: Layanan Pengguna & Ikuti Kami (3 Cols) */}
            <div className="flex flex-col gap-4 md:col-span-3 lg:col-span-3">
              <div className="flex flex-col gap-2.5">
                <h3 className="w-max border-b border-neutral-800 pb-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-300">
                  Layanan Pengguna
                </h3>
                <p className="text-xs leading-relaxed text-neutral-400">
                  Mengalami kendala pemesanan tiket atau pemutaran film?
                </p>
                {supportEmail && (
                  <p className="text-xs text-neutral-400">
                    Email:{' '}
                    <a
                      href={`mailto:${supportEmail}`}
                      className="text-neutral-300 transition-colors hover:text-white"
                    >
                      {supportEmail}
                    </a>
                  </p>
                )}
                {operatingHours && <p className="text-[11px] text-neutral-500">{operatingHours}</p>}
                {/* CTA WhatsApp Button yang proporsional & elegan */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-max items-center gap-2 rounded-lg border border-neutral-700/80 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-200 shadow-sm transition-all duration-200 hover:border-emerald-500/60 hover:bg-neutral-800 hover:text-emerald-400 active:scale-95"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>Hubungi via WhatsApp</span>
                </a>
              </div>

              {/* Keterangan "Ikuti kami di:" */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs font-medium text-neutral-400">Ikuti kami di:</span>
                <div className="flex items-center gap-3 text-neutral-400">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram Sinemus"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800/80 bg-neutral-900/60 transition-colors duration-200 hover:border-neutral-700 hover:text-white"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {tiktokUrl && (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok Sinemus"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800/80 bg-neutral-900/60 transition-colors duration-200 hover:border-neutral-700 hover:text-white"
                    >
                      <svg
                        fill="currentColor"
                        height="14"
                        viewBox="0 0 16 16"
                        width="14"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z" />
                      </svg>
                    </a>
                  )}
                  {youtubeUrl && (
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube Sinemus"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800/80 bg-neutral-900/60 transition-colors duration-200 hover:border-neutral-700 hover:text-white"
                    >
                      <Youtube className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Locale */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-900 pt-8 text-xs text-neutral-500 sm:flex-row">
            <p>© {new Date().getFullYear()} PT Sinemus Indonesia. Seluruh hak cipta dilindungi.</p>
            <div className="flex items-center gap-3">
              <span>Indonesia</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Clean Minimalist Informational Modal for Legal & Ticket Guide */}
      {activeModal &&
        (() => {
          const modalInfo = getModalContent(activeModal, seatLockMinutes, vodRentalHours);
          return (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={() => setActiveModal(null)}
              />

              {/* Modal Container */}
              <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#0066FF]">
                      {modalInfo.category}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-white">{modalInfo.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white focus:outline-none"
                    aria-label="Tutup modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 space-y-3 text-xs leading-relaxed text-neutral-300 sm:text-sm">
                  {modalInfo.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
                  >
                    Mengerti
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
}
