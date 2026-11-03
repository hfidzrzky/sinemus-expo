import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Film,
  Clock,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import {
  useApplyVoucherMutation,
  useSnapPayment,
  useSyncOrderMutation,
  type ApplyVoucherResponseData,
} from '@/features/checkout';
import { usePublicSettingsQuery } from '@/features/admin';
import { cn } from '@/lib/utils';
import { useRentMovieMutation } from '../api/useRentMovieMutation';
import { MOVIE_DETAIL_QUERY_KEY } from '../api/useMovieDetailQuery';
import { MOVIE_STREAM_QUERY_KEY } from '../api/useMovieStreamQuery';
import type { MovieDetail } from '../types';

export interface MovieRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: MovieDetail;
  onRentalSuccess?: (orderId: string) => void;
}

export const MovieRentalModal: React.FC<MovieRentalModalProps> = ({
  isOpen,
  onClose,
  movie,
  onRentalSuccess,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { data: publicSettings } = usePublicSettingsQuery();

  const queryClient = useQueryClient();
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<ApplyVoucherResponseData | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isSuccessFinished, setIsSuccessFinished] = useState<boolean>(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState<boolean>(false);

  const applyVoucherMutation = useApplyVoucherMutation();
  const rentMovieMutation = useRentMovieMutation();
  const syncOrderMutation = useSyncOrderMutation();

  const rentalDurationHours =
    movie.rental_duration_hours ||
    publicSettings?.business_policies?.vod_rental_duration_hours ||
    48;

  const grossAmount = Number(movie.price);
  const discountAmount = appliedVoucher ? Number(appliedVoucher.discount_amount) : 0;
  const netAmount = Math.max(0, appliedVoucher ? Number(appliedVoucher.net_amount) : grossAmount);

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Integrasi Headless Snap Payment dengan Handshake Verification Aktif
  const { isPaying, paymentStage, payWithSnap, resetPaymentState } = useSnapPayment({
    onSuccess: async (result) => {
      setIsVerifyingPayment(true);
      try {
        // Handshake verification: Konfirmasi status pembayaran secara aktif ke backend
        const syncResponse = await syncOrderMutation.mutateAsync({
          order_id: result.order_id,
        });

        if (syncResponse.status === 'paid') {
          // Invalidate seluruh cache query terkait agar akses tonton langsung aktif seketika
          queryClient.invalidateQueries({ queryKey: MOVIE_DETAIL_QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: [...MOVIE_DETAIL_QUERY_KEY, movie.slug] });
          queryClient.invalidateQueries({ queryKey: [...MOVIE_DETAIL_QUERY_KEY, movie.id] });
          queryClient.invalidateQueries({ queryKey: MOVIE_STREAM_QUERY_KEY(movie.id) });
          queryClient.invalidateQueries({ queryKey: ['user', 'films'] });
          queryClient.invalidateQueries({ queryKey: ['my-films'] });

          toast.success('Pembayaran Berhasil Dikonfirmasi!', {
            description: `Order ID: ${result.order_id}. Hak streaming aktif selama ${rentalDurationHours} jam.`,
          });
          setIsSuccessFinished(true);
          setTimeout(() => {
            onRentalSuccess?.(result.order_id);
            handleClose();
          }, 1500);
        } else if (syncResponse.status === 'pending') {
          toast.info('Menunggu Konfirmasi Pembayaran', {
            description: `Order ID: ${result.order_id}. Transaksi Anda sedang diproses oleh penyedia pembayaran.`,
          });
          handleClose();
        } else {
          toast.error('Pembayaran Gagal', {
            description: `Status pesanan: ${syncResponse.status}. Silakan coba sewa kembali.`,
          });
          handleClose();
        }
      } catch {
        // Fallback resilience jika jaringan timeout saat polling sync: paksa refresh cache
        queryClient.invalidateQueries({ queryKey: MOVIE_DETAIL_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: [...MOVIE_DETAIL_QUERY_KEY, movie.slug] });
        queryClient.invalidateQueries({ queryKey: ['user', 'films'] });
        toast.info('Pembayaran Sedang Diverifikasi', {
          description: `Order ID: ${result.order_id}. Sistem sedang memproses hak sewa Anda.`,
        });
        setIsSuccessFinished(true);
        setTimeout(() => {
          onRentalSuccess?.(result.order_id);
          handleClose();
        }, 1500);
      } finally {
        setIsVerifyingPayment(false);
      }
    },
    onPending: (result) => {
      toast.info('Menunggu Pembayaran', {
        description: `Order ID: ${result.order_id}. Silakan selesaikan pembayaran Anda sebelum batas waktu habis.`,
      });
      handleClose();
    },
    onError: (result) => {
      toast.error('Pembayaran Gagal', {
        description: `Transaksi dengan status '${result.transaction_status || 'failed'}' tidak dapat diselesaikan.`,
      });
    },
    onClose: () => {
      toast.warning('Pembayaran Ditunda', {
        description: 'Anda menutup pop-up Midtrans sebelum transaksi selesai.',
      });
    },
  });

  const handleClose = useCallback(() => {
    if (isPaying || isVerifyingPayment) return;
    setVoucherCodeInput('');
    setAppliedVoucher(null);
    setVoucherError(null);
    setIsSuccessFinished(false);
    resetPaymentState();
    onClose();
  }, [isPaying, isVerifyingPayment, onClose, resetPaymentState]);

  // Tangani penekanan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPaying) {
        handleClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isPaying, handleClose]);

  // Validasi & Terapkan Kupon Voucher
  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = voucherCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setVoucherError(null);
    try {
      const response = await applyVoucherMutation.mutateAsync({
        voucher_code: cleanCode,
        gross_amount: grossAmount,
        item_type: 'movie_rental',
        movie_id: movie.id,
      });

      setAppliedVoucher(response);
      toast.success('Voucher Berhasil Diterapkan', {
        description: `Hemat ${formatCurrency(response.discount_amount)} (${response.description})`,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Kode voucher tidak valid atau sudah kedaluwarsa.';
      setVoucherError(errorMsg);
      setAppliedVoucher(null);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    setVoucherError(null);
  };

  // Eksekusi Pemesanan & Pemanggilan Snap Midtrans
  const handleProceedPayment = async () => {
    if (!isAuthenticated) {
      toast.info('Login Diperlukan', {
        description: 'Silakan masuk dengan akun Google terlebih dahulu untuk menyewa film.',
      });
      openAuthModal();
      return;
    }

    try {
      const rentalResult = await rentMovieMutation.mutateAsync({
        movieId: movie.id,
        payload: {
          voucher_code: appliedVoucher?.code,
        },
      });

      // Jika kupon 100% (bebas bayar), langsung tuntas tanpa Snap
      if (rentalResult.net_amount <= 0) {
        queryClient.invalidateQueries({ queryKey: MOVIE_DETAIL_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: [...MOVIE_DETAIL_QUERY_KEY, movie.slug] });
        queryClient.invalidateQueries({ queryKey: [...MOVIE_DETAIL_QUERY_KEY, movie.id] });
        queryClient.invalidateQueries({ queryKey: MOVIE_STREAM_QUERY_KEY(movie.id) });
        queryClient.invalidateQueries({ queryKey: ['user', 'films'] });
        queryClient.invalidateQueries({ queryKey: ['my-films'] });
        toast.success('Penyewaan Berhasil Terkonfirmasi!', {
          description: `Voucher diskon 100% diterapkan. Hak streaming aktif selama ${rentalDurationHours} jam.`,
        });
        setIsSuccessFinished(true);
        setTimeout(() => {
          onRentalSuccess?.(rentalResult.order_id);
          handleClose();
        }, 1500);
        return;
      }

      // Buka Snap Payment Dialog
      payWithSnap(rentalResult.snap_token);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menginisiasi sewa film. Silakan coba lagi.';
      toast.error('Gagal Memulai Sewa', { description: msg });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rental-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-blue-500" />
            <h3
              id="rental-modal-title"
              className="font-display text-base font-bold text-white sm:text-lg"
            >
              Sewa Film VoD
            </h3>
          </div>
          <button
            type="button"
            disabled={isPaying || isVerifyingPayment}
            onClick={handleClose}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-40"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-6 p-6">
          {/* Status Sedang Memverifikasi Pembayaran (Handshake Active) */}
          {isVerifyingPayment ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <h4 className="font-display text-base font-bold text-white sm:text-lg">
                Memverifikasi Pembayaran ke Gateway...
              </h4>
              <p className="max-w-xs text-xs text-neutral-400 sm:text-sm">
                Menghubungkan ke server & menerbitkan hak akses sewa streaming {rentalDurationHours}{' '}
                jam
              </p>
            </div>
          ) : isSuccessFinished ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="font-display text-lg font-bold text-white">Pembayaran Berhasil!</h4>
              <p className="text-xs text-neutral-300 sm:text-sm">
                Hak akses streaming film <strong>{movie.title}</strong> aktif selama{' '}
                <strong>{rentalDurationHours} jam</strong>. Memperbarui status penonton...
              </p>
            </div>
          ) : (
            <>
              {/* Ringkasan Item Film */}
              <div className="flex items-center gap-4 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3.5">
                <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 sm:w-16">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-600">
                      <Film className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="truncate font-display text-sm font-bold text-white sm:text-base">
                    {movie.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <span className="flex items-center gap-1 text-blue-400">
                      <Clock className="h-3 w-3" />
                      Masa Sewa: {rentalDurationHours} Jam
                    </span>
                    <span>•</span>
                    <span>{movie.genre}</span>
                  </div>
                </div>
              </div>

              {/* Form Input Voucher Promo */}
              <div className="space-y-2">
                <label
                  htmlFor="voucher-code-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-300"
                >
                  Kupon Promo / Diskon (Opsional)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <input
                      id="voucher-code-input"
                      type="text"
                      disabled={isPaying || Boolean(appliedVoucher)}
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode voucher"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 py-2.5 pl-9 pr-3 text-xs uppercase tracking-wider text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 sm:text-sm"
                    />
                  </div>
                  {appliedVoucher ? (
                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={handleRemoveVoucher}
                      className="rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    >
                      Hapus
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        isPaying || !voucherCodeInput.trim() || applyVoucherMutation.isPending
                      }
                      onClick={handleApplyVoucher}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-40"
                    >
                      {applyVoucherMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        'Gunakan'
                      )}
                    </button>
                  )}
                </div>

                {/* Voucher Success / Error feedback */}
                {appliedVoucher && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Kupon <strong>{appliedVoucher.code}</strong> aktif — Hemat{' '}
                    {formatCurrency(appliedVoucher.discount_amount)}
                  </p>
                )}
                {voucherError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {voucherError}
                  </p>
                )}
              </div>

              {/* Rincian Harga Sewa */}
              <div className="space-y-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 text-xs sm:text-sm">
                <div className="flex justify-between text-neutral-400">
                  <span>Biaya Sewa ({rentalDurationHours} Jam)</span>
                  <span>{formatCurrency(grossAmount)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between font-medium text-emerald-400">
                    <span>Diskon Kupon Promo</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-800 pt-2 font-display text-sm font-bold text-white sm:text-base">
                  <span>Total Tagihan</span>
                  <span className="text-blue-400">{formatCurrency(netAmount)}</span>
                </div>
              </div>

              {/* Jaminan Layanan */}
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-500" />
                <span>
                  Pembayaran resmi & aman dienkripsi oleh <strong>Midtrans Payment Gateway</strong>.
                </span>
              </div>

              {/* Tombol Lanjut ke Pembayaran */}
              <button
                type="button"
                disabled={isPaying || rentMovieMutation.isPending}
                onClick={handleProceedPayment}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-700',
                  isPaying || rentMovieMutation.isPending
                    ? 'cursor-wait bg-blue-700'
                    : 'bg-blue-600 hover:bg-blue-500'
                )}
              >
                {rentMovieMutation.isPending || paymentStage === 'opening' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyiapkan Transaksi...
                  </>
                ) : paymentStage === 'verifying' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memverifikasi Pembayaran...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Bayar Sekarang — {formatCurrency(netAmount)}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
