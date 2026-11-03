import React, { useState } from 'react';
import { Clock, ShieldCheck, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn, formatDateIndonesia } from '@/lib/utils';
import {
  useCountdownTimer,
  useSnapPayment,
  useSyncOrderMutation,
  useCancelOrderMutation,
} from '@/features/checkout';
import type { TicketItem } from '../types';
import { MY_TICKETS_QUERY_KEY } from '../api/useMyTicketsQuery';

export interface PendingPaymentBannerProps {
  ticket: TicketItem;
  onPaymentSuccess?: () => void;
  className?: string;
}

export const PendingPaymentBanner: React.FC<PendingPaymentBannerProps> = ({
  ticket,
  onPaymentSuccess,
  className,
}) => {
  const queryClient = useQueryClient();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  // Hook Countdown Timer Penguncian Kursi (15 Menit)
  const timer = useCountdownTimer({
    expiresAt: ticket.expires_at ?? null,
    onExpire: () => {
      queryClient.invalidateQueries({ queryKey: MY_TICKETS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.error('Batas waktu pembayaran telah habis', {
        description: 'Alokasi kursi untuk pesanan Anda telah dilepaskan kembali.',
      });
    },
  });

  const syncOrderMutation = useSyncOrderMutation();
  const cancelOrderMutation = useCancelOrderMutation();

  // Integrasi Midtrans Snap untuk Melanjutkan Pembayaran
  const { payWithSnap, isPaying } = useSnapPayment({
    onSuccess: (result) => {
      const orderId = result.order_id || ticket.order_id;
      syncOrderMutation.mutate(
        { order_id: orderId },
        {
          onSuccess: (data) => {
            if (data.status === 'paid') {
              queryClient.invalidateQueries({ queryKey: MY_TICKETS_QUERY_KEY });
              queryClient.invalidateQueries({ queryKey: ['events'] });
              toast.success('Pembayaran Berhasil Dikonfirmasi!', {
                description: `Order ID: ${orderId}. E-tiket Anda telah terbit di bawah.`,
              });
              onPaymentSuccess?.();
            }
          },
        }
      );
    },
    onPending: () => {
      toast.info('Menunggu penyelesaian pembayaran', {
        description: `Selesaikan pembayaran Anda untuk Order ID: ${ticket.order_id}`,
      });
    },
    onError: () => {
      toast.error('Pembayaran tidak berhasil diselesaikan.');
    },
  });

  const handlePayNow = () => {
    if (!ticket.snap_token) {
      toast.error('Token pembayaran tidak ditemukan. Silakan periksa kembali jadwal penayangan.');
      return;
    }
    payWithSnap(ticket.snap_token);
  };

  const handleCheckStatus = () => {
    syncOrderMutation.mutate(
      { order_id: ticket.order_id },
      {
        onSuccess: (data) => {
          if (data.status === 'paid') {
            queryClient.invalidateQueries({ queryKey: MY_TICKETS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Pembayaran Terverifikasi!', {
              description: 'E-tiket Anda telah resmi terbit dan siap digunakan.',
            });
            onPaymentSuccess?.();
          } else if (data.status === 'pending') {
            toast.info('Menunggu Pembayaran', {
              description:
                'Pembayaran belum terdeteksi. Selesaikan tagihan di aplikasi bank/e-wallet Anda.',
            });
          } else {
            queryClient.invalidateQueries({ queryKey: MY_TICKETS_QUERY_KEY });
            toast.error('Pesanan Tidak Berhasil', {
              description: `Status: ${data.status}. Kursi telah dilepaskan.`,
            });
          }
        },
        onError: () => {
          toast.error('Gagal memeriksa status ke server. Coba beberapa saat lagi.');
        },
      }
    );
  };

  const handleCancel = () => {
    cancelOrderMutation.mutate(
      { order_id: ticket.order_id },
      {
        onSuccess: () => {
          setIsConfirmingCancel(false);
          queryClient.invalidateQueries({ queryKey: MY_TICKETS_QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: ['events'] });
          toast.success('Pesanan Dibatalkan', {
            description:
              'Kunci kursi telah dibebaskan. Anda dapat memilih kembali jadwal atau kursi lain.',
          });
        },
        onError: () => {
          toast.error('Gagal membatalkan pesanan.');
        },
      }
    );
  };

  if (timer.isExpired) {
    return null;
  }

  const formattedAmount = (ticket.net_amount || ticket.gross_amount || 0).toLocaleString('id-ID');

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-neutral-900/60 to-neutral-900/80 p-4 shadow-xl shadow-amber-950/10 sm:p-5',
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Kolom Informasi Tagihan & Waktu */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-400" />
              MENUNGGU PEMBAYARAN
            </span>

            <span className="font-mono text-xs text-neutral-400">{ticket.order_id}</span>

            {/* Live Countdown Badge */}
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium tabular-nums',
                timer.isCritical || timer.isWarning
                  ? 'animate-pulse border border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border border-neutral-700/60 bg-neutral-800/80 text-amber-200'
              )}
            >
              <Clock className="h-3 w-3" />
              <span>Sisa: {timer.formatted}</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-white sm:text-lg">{ticket.event_title}</h3>
            <p className="text-xs text-neutral-400">
              {ticket.venue_name}, {ticket.city} &bull; {formatDateIndonesia(ticket.show_time)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
            {ticket.seat_codes && ticket.seat_codes.length > 0 ? (
              <span>
                Kursi:{' '}
                <span className="font-mono font-semibold text-white">
                  {ticket.seat_codes.join(', ')}
                </span>
              </span>
            ) : (
              <span>General Admission</span>
            )}
            <span>&bull;</span>
            <span>
              Total: <span className="font-mono font-bold text-white">Rp {formattedAmount}</span>
            </span>
          </div>
        </div>

        {/* Kolom Tombol Aksi */}
        <div className="flex flex-col gap-2 sm:items-end">
          {isConfirmingCancel ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2">
              <span className="text-xs text-rose-200">Batalkan pesanan ini?</span>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelOrderMutation.isPending}
                className="rounded-lg bg-rose-500 px-3 py-1 font-sans text-xs font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-40"
              >
                {cancelOrderMutation.isPending ? 'Memproses...' : 'Ya, Batalkan'}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingCancel(false)}
                className="rounded-lg bg-neutral-800 px-2.5 py-1 font-sans text-xs font-medium text-neutral-300 hover:bg-neutral-700"
              >
                Batal
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol Utama: Bayar Sekarang (Buka Snap) */}
              <button
                type="button"
                onClick={handlePayNow}
                disabled={isPaying || !ticket.snap_token}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 font-sans text-xs font-semibold text-black transition-colors hover:bg-neutral-200 disabled:opacity-40"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Bayar Sekarang</span>
              </button>

              {/* Tombol Cek Status */}
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={syncOrderMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2.5 font-sans text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-700 hover:text-white"
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5', syncOrderMutation.isPending && 'animate-spin')}
                />
                <span>Cek Status</span>
              </button>

              {/* Tombol Batalkan */}
              <button
                type="button"
                onClick={() => setIsConfirmingCancel(true)}
                className="rounded-xl border border-neutral-800 bg-neutral-900/80 px-2.5 py-2.5 font-sans text-xs font-medium text-neutral-400 transition-colors hover:border-rose-900/50 hover:text-rose-400"
                title="Batalkan pesanan dan lepaskan kursi"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          <p className="text-[11px] text-neutral-500">
            Selesaikan pembayaran sebelum batas waktu berakhir agar kursi tidak dilepas.
          </p>
        </div>
      </div>
    </div>
  );
};
