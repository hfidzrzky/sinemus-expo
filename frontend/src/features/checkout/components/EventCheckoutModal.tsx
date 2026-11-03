import React from 'react';
import {
  Clock,
  ShieldCheck,
  Ticket,
  Tag,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  TicketPercent,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventDetail, ScheduleItem, SeatItem } from '@/features/events';
import { useEventCheckoutSession } from '../hooks/useEventCheckoutSession';

export interface EventCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetail;
  schedule: ScheduleItem;
  selectedSeats?: SeatItem[];
  gaQuantity?: number;
  onPaymentSuccess?: (orderId: string) => void;
}

const AVAILABLE_VOUCHERS_HINT = ['CORET25K', 'SINEMUSHEMAT', 'NOBARSERU', 'TIKETPERDANA'];

export const EventCheckoutModal: React.FC<EventCheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
  schedule,
  selectedSeats = [],
  gaQuantity = 1,
  onPaymentSuccess,
}) => {
  const isAssignedSeating = event.seating_type === 'assigned_seating';

  const {
    reservation,
    reservationError,
    isLoadingReservation,
    isSuccessPaid,
    completedOrderId,
    paymentStage,
    isSlowNetwork,
    verificationError,
    unitPrice,
    vipUnitPrice,
    vipSeatsCount,
    regularSeatsCount,
    ticketCount,
    initialGrossAmount,
    serviceFee,
    discountAmount,
    netAmount,
    voucherCodeInput,
    setVoucherCodeInput,
    appliedVoucher,
    voucherError,
    isApplyingVoucher,
    handleApplyVoucher,
    handleRemoveVoucher,
    handleRetryReservation,
    handleRetrySync,
    handlePay,
    handleCancelOrder,
    isCancellingOrder,
    isPaying,
    timer,
    seatLockDurationMinutes,
  } = useEventCheckoutSession({
    isOpen,
    event,
    schedule,
    selectedSeats,
    gaQuantity,
    onPaymentSuccess,
    onClose,
  });

  if (!isOpen) return null;

  // Format tanggal tayang
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(schedule.show_time));

  const formattedTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(schedule.show_time));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md sm:items-center sm:justify-center sm:p-4"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-neutral-950 shadow-2xl shadow-black/90 sm:max-h-[85vh] sm:rounded-3xl sm:border sm:border-neutral-800/60">
        {/* Mobile Pull Indicator */}
        <div className="mx-auto mt-2.5 h-1 w-12 rounded-full bg-neutral-800 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-neutral-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold tracking-tight text-white sm:text-base">
                Konfirmasi Tiket
              </h3>
              <p className="text-[11px] text-neutral-400">Pembayaran resmi Sinemus Screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={paymentStage === 'verifying' ? undefined : onClose}
            disabled={paymentStage === 'verifying'}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-neutral-400 transition-colors',
              paymentStage === 'verifying'
                ? 'cursor-not-allowed opacity-30'
                : 'hover:bg-neutral-800 hover:text-white'
            )}
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Loading State saat Memasang Lock Kursi */}
        {isLoadingReservation && (
          <div className="flex flex-col items-center justify-center space-y-4 px-6 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <div className="space-y-1">
              <h4 className="font-sans text-sm font-semibold text-white">Mengamankan Kursi...</h4>
              <p className="text-xs text-neutral-400">
                Sistem sedang mengunci kursi pilihan Anda selama {seatLockDurationMinutes} menit.
              </p>
            </div>
          </div>
        )}

        {/* Error State saat Kursi Sudah Terkunci / Terjadi Konflik / Rate Limited */}
        {reservationError && !isLoadingReservation && (
          <div className="space-y-5 px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-neutral-300">
              <AlertCircle className="h-6 w-6 text-neutral-300" />
            </div>
            <div className="space-y-1">
              <h4 className="font-sans text-base font-semibold text-white">
                {reservationError.includes('Terlalu banyak')
                  ? 'Mohon Tunggu Sejenak'
                  : 'Kursi Tidak Tersedia'}
              </h4>
              <p className="text-xs text-neutral-400">{reservationError}</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-neutral-900 px-4 py-2.5 font-sans text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                Pilih Kursi Lain
              </button>
              <button
                type="button"
                onClick={handleRetryReservation}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 font-sans text-xs font-semibold text-black transition-colors hover:bg-neutral-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Verification State saat Menunggu Konfirmasi Handshake Midtrans */}
        {paymentStage === 'verifying' && !isSuccessPaid && (
          <div className="flex flex-col items-center justify-center space-y-5 px-6 py-14 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-200">
              <ShieldCheck className="h-7 w-7 animate-pulse text-white" />
              <div className="pointer-events-none absolute -inset-1 animate-ping rounded-2xl border border-neutral-700/50 opacity-20" />
            </div>

            <div className="max-w-sm space-y-1.5">
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-0.5 font-mono text-[10px] text-neutral-400">
                {completedOrderId || reservation?.data.order_id || 'VERIFIKASI ORDER'}
              </span>
              <h4 className="font-sans text-base font-semibold text-white">
                Memverifikasi Pembayaran...
              </h4>
              <p className="text-xs leading-relaxed text-neutral-400">
                Menghubungi gateway pembayaran resmi & mengamankan alokasi e-tiket Anda.
              </p>
            </div>

            {/* Slow Network Friendly Notice */}
            {isSlowNetwork && !verificationError && (
              <div className="flex max-w-sm items-center gap-2.5 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3 text-left text-[11px] text-neutral-300">
                <Clock className="h-4 w-4 shrink-0 animate-pulse text-neutral-400" />
                <span>
                  Koneksi internet Anda agak lambat. Mohon tetap di halaman ini selagi sistem
                  mengonfirmasi status ke server resmi...
                </span>
              </div>
            )}

            {/* Verification Error / Retry Option */}
            {verificationError && (
              <div className="max-w-sm space-y-3 pt-1">
                <p className="rounded-xl border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-neutral-300">
                  {verificationError}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleRetrySync}
                    className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 font-sans text-xs font-semibold text-black transition-colors hover:bg-neutral-200"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Coba Verifikasi Lagi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.location.href = '/tickets';
                    }}
                    className="rounded-xl bg-neutral-900 px-4 py-2 font-sans text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                  >
                    Cek Menu Tiket Saya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending State (Transfer Bank / QRIS / GoPay / VA) */}
        {paymentStage === 'pending' && !isSuccessPaid && (
          <div className="space-y-5 px-6 py-10 text-center">
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Clock className="h-7 w-7 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-400" />
                <span className="font-mono text-[11px] font-semibold tracking-wide text-amber-300">
                  MENUNGGU PEMBAYARAN
                </span>
              </div>

              <h4 className="font-sans text-lg font-bold text-white">Selesaikan Pembayaran Anda</h4>

              <p className="mx-auto max-w-sm text-xs leading-relaxed text-neutral-400">
                Pesanan{' '}
                <span className="font-mono font-medium text-white">
                  {completedOrderId || reservation?.data.order_id}
                </span>{' '}
                sedang menunggu penyelesaian pembayaran.
              </p>

              {/* Countdown Timer Penguncian Kursi */}
              <div className="mx-auto flex max-w-xs items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-neutral-400">Sisa waktu penguncian:</span>
                <span
                  className={cn(
                    'font-mono font-bold tabular-nums',
                    timer.isCritical || timer.isWarning ? 'text-rose-400' : 'text-amber-300'
                  )}
                >
                  {timer.formatted}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2 sm:mx-auto sm:max-w-sm">
              {/* Tombol Utama: Buka Kembali Gateway Midtrans Snap */}
              <button
                type="button"
                onClick={handlePay}
                disabled={isPaying || timer.isExpired}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-sans text-xs font-semibold text-black transition-colors hover:bg-neutral-200 disabled:opacity-40"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Lanjutkan Pembayaran</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Tombol Cek Status Server-to-Server */}
                <button
                  type="button"
                  onClick={handleRetrySync}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 font-sans text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Cek Status</span>
                </button>

                {/* Tombol Menuju Halaman Tiket & Pesanan Saya */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.href = '/tickets';
                  }}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 font-sans text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  Ke Pesanan Saya
                </button>
              </div>

              {/* Batalkan Pesanan & Bebaskan Kursi */}
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancellingOrder}
                className="mt-1 text-center font-sans text-[11px] text-neutral-500 transition-colors hover:text-rose-400 hover:underline disabled:opacity-40"
              >
                {isCancellingOrder ? 'Membatalkan pesanan...' : 'Batalkan pesanan & ganti kursi'}
              </button>
            </div>
          </div>
        )}

        {/* Failed State saat Transaksi Batal / Expired */}
        {paymentStage === 'failed' && !isSuccessPaid && (
          <div className="space-y-5 px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-neutral-300">
              <AlertCircle className="h-6 w-6 text-neutral-300" />
            </div>
            <div className="space-y-1.5">
              <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 font-mono text-[10px] font-medium text-neutral-400">
                TRANSAKSI BELUM BERHASIL
              </span>
              <h4 className="font-sans text-base font-semibold text-white">
                Pembayaran Dibatalkan
              </h4>
              <p className="mx-auto max-w-sm text-xs text-neutral-400">
                {verificationError ||
                  'Pembayaran tidak berhasil diselesaikan atau telah dibatalkan.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-neutral-900 px-4 py-2.5 font-sans text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleRetryReservation}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 font-sans text-xs font-semibold text-black transition-colors hover:bg-neutral-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Pesan Ulang</span>
              </button>
            </div>
          </div>
        )}

        {/* Sukses Terbayar View */}
        {isSuccessPaid && (
          <div className="space-y-5 px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-neutral-200">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1.5">
              <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 font-mono text-[10px] font-medium text-neutral-300">
                PEMBAYARAN SUKSES
              </span>
              <h4 className="font-sans text-lg font-semibold text-white">Selamat Menonton!</h4>
              <p className="text-xs text-neutral-400">
                Order <span className="font-mono text-white">{completedOrderId}</span> berhasil
                diterbitkan.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.href = '/tickets';
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-sans text-xs font-semibold text-black transition-colors hover:bg-neutral-200"
              >
                <span>Buka Tiket Saya</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {!isLoadingReservation &&
          !reservationError &&
          !isSuccessPaid &&
          paymentStage !== 'verifying' &&
          paymentStage !== 'pending' &&
          paymentStage !== 'failed' &&
          reservation && (
            <>
              {/* Countdown Lock Ribbon (Calm, non-neon styling) */}
              <div
                className={cn(
                  'px-5 py-2.5 transition-colors sm:px-6',
                  timer.isExpired
                    ? 'bg-neutral-900/80'
                    : timer.isCritical
                      ? 'bg-neutral-900/60'
                      : 'bg-neutral-900/40'
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-[11px] font-medium text-neutral-400">
                      {timer.isExpired ? 'Waktu Habis' : 'Sisa Waktu Pembayaran:'}
                    </span>
                    <span
                      className={cn(
                        'font-mono text-xs font-medium tabular-nums',
                        timer.isExpired
                          ? 'text-neutral-500'
                          : timer.isCritical
                            ? 'font-semibold text-neutral-300'
                            : 'text-neutral-200'
                      )}
                    >
                      {timer.formatted}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-neutral-500">
                    {reservation.data.order_id}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-900">
                  <div
                    className={cn(
                      'h-full transition-all duration-1000',
                      timer.isExpired
                        ? 'bg-neutral-600'
                        : timer.isCritical
                          ? 'bg-neutral-500'
                          : 'bg-neutral-400'
                    )}
                    style={{ width: `${timer.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Scrollable Body (Harmonious typography & calm borders) */}
              <div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4 sm:px-6">
                {/* Event & Seats Combined Card */}
                <div className="space-y-3 rounded-2xl bg-neutral-900/50 p-3.5 sm:p-4">
                  <div className="flex gap-3">
                    <img
                      src={event.poster_url}
                      alt={event.title}
                      className="h-16 w-11 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="truncate font-sans text-xs font-semibold text-white sm:text-sm">
                        {event.title}
                      </h4>
                      <p className="truncate text-[11px] text-neutral-400">
                        {schedule.venue?.venue_name || event.venue_name}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5 text-[10px] text-neutral-400">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span className="font-medium text-neutral-200">{formattedTime} WIB</span>
                        {schedule.studio_name && (
                          <>
                            <span>•</span>
                            <span className="text-neutral-300">{schedule.studio_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selected Seats Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-neutral-800/60 pt-2.5">
                    <span className="mr-1 flex items-center gap-1 text-[11px] font-medium text-neutral-400">
                      <Ticket className="h-3 w-3 text-neutral-400" />
                      <span>{isAssignedSeating ? 'Kursi:' : 'Tiket:'}</span>
                    </span>

                    {isAssignedSeating ? (
                      selectedSeats.map((seat) => (
                        <span
                          key={seat.id}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 font-mono text-[11px] font-medium',
                            seat.seat_type === 'vip'
                              ? 'border border-amber-500/40 bg-amber-500/15 text-amber-300'
                              : 'bg-neutral-800 text-neutral-200'
                          )}
                        >
                          <span>{seat.seat_code}</span>
                          {seat.seat_type === 'vip' && (
                            <span className="py-0.2 rounded bg-amber-500/25 px-1 text-[8px] font-bold uppercase tracking-wider text-amber-300">
                              VIP
                            </span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-md bg-neutral-800 px-2.5 py-0.5 font-sans text-[11px] font-medium text-neutral-200">
                        General Admission ({gaQuantity} Tiket)
                      </span>
                    )}

                    <span className="ml-auto font-mono text-[10px] tabular-nums text-neutral-400">
                      {isAssignedSeating && vipSeatsCount > 0
                        ? regularSeatsCount > 0
                          ? `${regularSeatsCount} Reguler + ${vipSeatsCount} VIP (Rp ${vipUnitPrice.toLocaleString('id-ID')})`
                          : `${vipSeatsCount} VIP x Rp ${vipUnitPrice.toLocaleString('id-ID')}`
                        : `${ticketCount} x Rp ${unitPrice.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>

                {/* Voucher Promo Section */}
                <div className="rounded-2xl bg-neutral-900/40 p-3.5 sm:p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-neutral-300">
                    <Tag className="h-3 w-3 text-neutral-400" />
                    <span>Kupon Promo / Diskon</span>
                  </div>

                  {appliedVoucher ? (
                    <div className="flex items-center justify-between rounded-xl bg-neutral-900 p-2.5">
                      <div className="flex items-center gap-2">
                        <TicketPercent className="h-4 w-4 text-neutral-300" />
                        <div>
                          <span className="font-mono text-xs font-semibold text-white">
                            {appliedVoucher.code}
                          </span>
                          <p className="text-[10px] text-neutral-400">
                            {appliedVoucher.description}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="rounded-lg p-1 text-neutral-400 hover:text-white"
                        title="Hapus Kupon"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <form onSubmit={(e) => handleApplyVoucher(e)} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Kode voucher (e.g. SINEMUSHEMAT)"
                          value={voucherCodeInput}
                          onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                          disabled={isApplyingVoucher}
                          className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 font-mono text-xs uppercase text-white placeholder-neutral-500 outline-none transition-colors focus:ring-1 focus:ring-neutral-700"
                        />
                        <button
                          type="submit"
                          disabled={!voucherCodeInput.trim() || isApplyingVoucher}
                          className="flex items-center gap-1 rounded-xl bg-neutral-800 px-3.5 py-2 font-sans text-xs font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-40"
                        >
                          {isApplyingVoucher ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Pakai'
                          )}
                        </button>
                      </form>

                      {voucherError && (
                        <p className="text-[11px] text-neutral-400">{voucherError}</p>
                      )}

                      {/* Quick Voucher Chips (Hanya dirender saat lingkungan Mock MSW aktif untuk kemudahan pengujian UI) */}
                      {import.meta.env.VITE_ENABLE_MOCK === 'true' && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-neutral-500">Demo Voucher:</span>
                          {AVAILABLE_VOUCHERS_HINT.map((code) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => handleApplyVoucher(undefined, code)}
                              className="rounded-md bg-neutral-900 px-2 py-0.5 font-mono text-[10px] text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
                            >
                              +{code}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-1.5 px-1 py-1 font-sans text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>
                      Subtotal ({ticketCount} Tiket
                      {isAssignedSeating && vipSeatsCount > 0
                        ? `: ${regularSeatsCount} Reguler, ${vipSeatsCount} VIP`
                        : ''}
                      )
                    </span>
                    <span className="font-mono tabular-nums text-neutral-300">
                      Rp {initialGrossAmount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {appliedVoucher && (
                    <div className="flex justify-between text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        <span>Diskon ({appliedVoucher.code})</span>
                        {appliedVoucher.description.toLowerCase().includes('coret') && (
                          <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-400">
                            Coret Harga
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-emerald-400">
                        - Rp {discountAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-400">
                    <span>Biaya Layanan</span>
                    <span className="text-neutral-300">
                      {serviceFee > 0
                        ? `Rp ${serviceFee.toLocaleString('id-ID')}`
                        : 'Gratis (Rp 0)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sticky Modal Bottom Action Bar (Crisp stark white button, zero neon) */}
              <div className="border-t border-neutral-900 bg-neutral-950/95 px-5 py-3.5 backdrop-blur-sm sm:px-6 sm:py-4">
                {timer.isExpired ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-2xl bg-neutral-900 py-3 font-sans text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                  >
                    Waktu Habis • Pilih Kursi Ulang
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                        Total Tagihan
                      </p>
                      <div className="flex items-baseline gap-2">
                        {appliedVoucher && discountAmount > 0 && (
                          <span className="font-mono text-xs tabular-nums text-neutral-500 line-through">
                            Rp {initialGrossAmount.toLocaleString('id-ID')}
                          </span>
                        )}
                        <p className="font-sans text-lg font-bold tabular-nums text-white sm:text-xl">
                          Rp {netAmount.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePay}
                      disabled={isPaying || !reservation || isLoadingReservation}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-sans text-xs font-semibold text-black transition-colors hover:bg-neutral-200 disabled:opacity-40 sm:flex-initial sm:px-8"
                    >
                      {paymentStage === 'opening' ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Membuka Gateway...</span>
                        </>
                      ) : isPaying ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : isLoadingReservation ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Menyiapkan Sesi...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span>Bayar Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
      </div>
    </div>
  );
};
