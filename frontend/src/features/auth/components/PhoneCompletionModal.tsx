import React from 'react';
import { AlertTriangle, Lock, Phone, Calendar, Loader2, X } from 'lucide-react';
import { UI_COPY } from '@/constants/ui-copy';
import { usePhoneCompletionForm, useEscapeKey } from '../hooks';

interface PhoneCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhoneCompletionModal({
  isOpen,
  onClose,
}: PhoneCompletionModalProps): React.JSX.Element | null {
  const {
    phoneNumber,
    handlePhoneChange,
    birthDate,
    handleBirthDateChange,
    phoneError,
    birthDateError,
    isSubmitting,
    isPhoneLocked,
    canDismiss,
    handleSubmit,
  } = usePhoneCompletionForm({ onSuccess: onClose });

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-[#0B0E14] p-6 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-completion-title"
      >
        {/* Optional Close Button if dismissible */}
        {canDismiss && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
            aria-label="Tutup Dialog"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="space-y-1.5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-amber-400">
            <Lock className="h-5 w-5" />
          </div>
          <h2
            id="phone-completion-title"
            className="font-display text-lg font-extrabold tracking-tight text-white sm:text-xl"
          >
            {UI_COPY.AUTH.PROFILE_COMPLETE_TITLE}
          </h2>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-neutral-400">
            {UI_COPY.AUTH.PROFILE_COMPLETE_SUBTITLE}
          </p>
        </div>

        {/* Banner Peringatan Kunci Permanen */}
        <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-left">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Peringatan Kunci Permanen</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-200/90">
            {UI_COPY.AUTH.PHONE_LOCK_NOTICE}
          </p>
        </div>

        {/* Form Pengisian Data */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
          {/* Input No WhatsApp */}
          <div className="space-y-1.5">
            <label
              htmlFor="phone_number_input"
              className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300"
            >
              Nomor WhatsApp (Aktif)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <Phone className="h-4 w-4" />
              </div>
              <input
                id="phone_number_input"
                type="tel"
                placeholder="Contoh: 081234567890 atau +62812..."
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                disabled={isPhoneLocked || isSubmitting}
                className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-500 outline-none transition-all focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              />
            </div>
            {phoneError && <p className="pl-1 text-xs font-medium text-red-400">{phoneError}</p>}
            <p className="pl-1 text-[10px] text-neutral-400 sm:text-[11px]">
              Gunakan format nasional (08xx) atau internasional (+628xx).
            </p>
          </div>

          {/* Input Tanggal Lahir */}
          <div className="space-y-1.5">
            <label
              htmlFor="birth_date_input"
              className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300"
            >
              Tanggal Lahir
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                id="birth_date_input"
                type="date"
                value={birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-500 outline-none transition-all [color-scheme:dark] focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] sm:text-sm"
              />
            </div>
            {birthDateError && (
              <p className="pl-1 text-xs font-medium text-red-400">{birthDateError}</p>
            )}
            <p className="pl-1 text-[10px] text-neutral-400 sm:text-[11px]">
              Dibutuhkan untuk validasi batasan usia penonton (SU, 13+, 17+, 21+).
            </p>
          </div>

          {/* Tombol Aksi Submit */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="active:scale-98 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-50 sm:py-3 sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengunci & Menyimpan...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Kunci Nomor & Simpan Profil</span>
                </>
              )}
            </button>

            {canDismiss && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full py-2 text-xs font-semibold text-neutral-400 transition-colors hover:text-white"
              >
                Nanti Saja
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
