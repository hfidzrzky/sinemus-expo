import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  type EventDetail,
  type ScheduleItem,
  type SeatItem,
  SCHEDULE_SEATS_QUERY_KEY,
} from '@/features/events';
import { useReserveSeatsMutation, type ReserveSeatsResult } from '../api/useReserveSeatsMutation';
import { useApplyVoucherMutation } from '../api/useApplyVoucherMutation';
import { useSyncOrderMutation } from '../api/useSyncOrderMutation';
import { useCancelOrderMutation } from '../api/useCancelOrderMutation';
import { useCountdownTimer, type CountdownTimerState } from './useCountdownTimer';
import { useSnapPayment } from './useSnapPayment';
import { usePublicSettingsQuery } from '@/features/admin';
import type { ApplyVoucherResponseData, PaymentStage } from '../types';

export interface UseEventCheckoutSessionProps {
  isOpen: boolean;
  event: EventDetail;
  schedule: ScheduleItem;
  selectedSeats?: SeatItem[];
  gaQuantity?: number;
  onPaymentSuccess?: (orderId: string) => void;
  onClose?: () => void;
}

export interface UseEventCheckoutSessionReturn {
  // Status & Data
  reservation: ReserveSeatsResult | null;
  reservationError: string | null;
  isLoadingReservation: boolean;
  isSuccessPaid: boolean;
  completedOrderId: string | null;
  paymentStage: PaymentStage;
  isSlowNetwork: boolean;
  verificationError: string | null;

  // Finansial & Kupon
  unitPrice: number;
  vipUnitPrice: number;
  vipSeatsCount: number;
  regularSeatsCount: number;
  ticketCount: number;
  initialGrossAmount: number;
  serviceFee: number;
  discountAmount: number;
  netAmount: number;
  voucherCodeInput: string;
  setVoucherCodeInput: (code: string) => void;
  appliedVoucher: ApplyVoucherResponseData | null;
  voucherError: string | null;
  isApplyingVoucher: boolean;

  // Actions
  handleApplyVoucher: (e?: React.FormEvent, customCode?: string) => void;
  handleRemoveVoucher: () => void;
  handleRetryReservation: () => void;
  handleRetrySync: () => void;
  handlePay: () => void;
  handleCancelOrder: () => void;
  isCancellingOrder: boolean;

  // Snap & Timer
  isPaying: boolean;
  timer: CountdownTimerState;
  seatLockDurationMinutes: number;
}

function getFriendlyErrorMessage(error: unknown, defaultMessage: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const err = error as { response?: { data?: { message?: string } } };
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
  }
  return defaultMessage;
}

export function useEventCheckoutSession({
  isOpen,
  event,
  schedule,
  selectedSeats = [],
  gaQuantity = 1,
  onPaymentSuccess,
  onClose,
}: UseEventCheckoutSessionProps): UseEventCheckoutSessionReturn {
  const isAssignedSeating = event.seating_type === 'assigned_seating';
  const ticketCount = isAssignedSeating ? selectedSeats.length : gaQuantity;
  const unitPrice = schedule.ticket_price || 0;
  const vipUnitPrice =
    schedule.vip_ticket_price !== null && schedule.vip_ticket_price !== undefined
      ? schedule.vip_ticket_price
      : unitPrice;

  const vipSeatsCount = useMemo(() => {
    return isAssignedSeating ? selectedSeats.filter((s) => s.seat_type === 'vip').length : 0;
  }, [isAssignedSeating, selectedSeats]);

  const regularSeatsCount = isAssignedSeating ? ticketCount - vipSeatsCount : ticketCount;

  const calculatedInitialGross = useMemo(() => {
    if (!isAssignedSeating) {
      return ticketCount * unitPrice;
    }
    return selectedSeats.reduce((acc, seat) => {
      const seatPrice = seat.seat_type === 'vip' ? vipUnitPrice : unitPrice;
      return acc + seatPrice;
    }, 0);
  }, [isAssignedSeating, ticketCount, unitPrice, vipUnitPrice, selectedSeats]);

  // Stable string key representing sorted seat IDs for safe dependency tracking
  const seatIdsKey = useMemo(() => {
    return (selectedSeats || [])
      .map((s) => s.id)
      .sort((a, b) => a - b)
      .join(',');
  }, [selectedSeats]);

  // Reservation & Voucher State
  const [reservation, setReservation] = useState<ReserveSeatsResult | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<ApplyVoucherResponseData | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isSuccessPaid, setIsSuccessPaid] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  const initialGrossAmount = reservation?.data.gross_amount ?? calculatedInitialGross;

  // Anti-Race Condition & Execution Guard
  const hasRequestedReservationRef = useRef(false);
  const isMountedRef = useRef(true);
  const slowNetworkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verification & Slow Network States
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const reserveSeatsMutation = useReserveSeatsMutation();
  const applyVoucherMutation = useApplyVoucherMutation();
  const syncOrderMutation = useSyncOrderMutation();
  const cancelOrderMutation = useCancelOrderMutation();
  const { data: publicSettings } = usePublicSettingsQuery();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (slowNetworkTimerRef.current) {
        clearTimeout(slowNetworkTimerRef.current);
      }
    };
  }, []);

  /**
   * Eksekusi reservasi kursi (Pessimistic 15m Lock & Idempotent Session Re-entry)
   */
  const executeReservation = useCallback(
    (voucherCodeToApply?: string | null) => {
      if (reserveSeatsMutation.isPending) {
        return;
      }

      const seatIds = isAssignedSeating
        ? seatIdsKey
          ? seatIdsKey.split(',').map((id) => Number(id))
          : []
        : undefined;
      const quantity = !isAssignedSeating ? gaQuantity : undefined;

      setReservationError(null);

      reserveSeatsMutation.mutate(
        {
          schedule_id: schedule.id,
          seat_ids: seatIds,
          quantity,
          voucher_code: voucherCodeToApply || undefined,
        },
        {
          onSuccess: (result) => {
            if (!isMountedRef.current) return;
            setReservation(result);
            setReservationError(null);
          },
          onError: (err) => {
            if (!isMountedRef.current) return;
            const friendly = getFriendlyErrorMessage(
              err,
              'Kursi yang Anda pilih tidak tersedia atau sedang dikunci penonton lain.'
            );
            setReservationError(friendly);
          },
        }
      );
    },
    // Primitive and simple expressions only to adhere strictly to React linter rules
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAssignedSeating, seatIdsKey, gaQuantity, schedule.id]
  );

  // Trigger reservasi otomatis saat modal pertama kali dibuka
  useEffect(() => {
    if (isOpen && !hasRequestedReservationRef.current) {
      hasRequestedReservationRef.current = true;
      executeReservation();
    }

    if (!isOpen) {
      hasRequestedReservationRef.current = false;
    }
  }, [isOpen, executeReservation]);

  const handleRetryReservation = useCallback(() => {
    setReservationError(null);
    setAppliedVoucher(null);
    setVoucherError(null);
    setIsSuccessPaid(false);
    executeReservation();
  }, [executeReservation]);

  // Hook Countdown Timer 15 Menit (Sinkron dengan backend server_time)
  const timer = useCountdownTimer({
    expiresAt: reservation?.data.expires_at ?? null,
    serverTime: reservation?.server_time ?? null,
    onExpire: () => {
      toast.error('Waktu penguncian kursi habis. Silakan pilih kembali kursi Anda.');
    },
  });

  const performSyncVerificationRef = useRef<(orderId: string) => void>(() => {});

  // Integrasi Midtrans Snap
  const { payWithSnap, isPaying, paymentStage, setPaymentStage } = useSnapPayment({
    onSuccess: (result) => {
      // Ambil Order ID sah dari Snap result atau SSOT snapshot reservasi backend
      const resolvedOrderId =
        result.order_id && result.order_id !== 'SNM-TKT-MOCK'
          ? result.order_id
          : reservation?.data.order_id ||
            (import.meta.env.VITE_ENABLE_MOCK === 'true' ? 'SNM-TKT-MOCK' : '');

      if (!resolvedOrderId) {
        toast.error('Gagal mengonfirmasi pembayaran: Sesi nomor pesanan tidak valid.');
        return;
      }

      setCompletedOrderId(resolvedOrderId);
      performSyncVerificationRef.current(resolvedOrderId);
    },
    onPending: (result) => {
      toast.info('Menunggu penyelesaian pembayaran', {
        description: `Selesaikan pembayaran Anda untuk Order ID: ${result.order_id}`,
      });
    },
    onError: (result) => {
      toast.error('Pembayaran gagal atau dibatalkan', {
        description: `Status: ${result.transaction_status || 'Gagal'}`,
      });
    },
  });

  // Eksekusi verifikasi Server-to-Server idempoten dengan mitigasi Slow Network
  const performSyncVerification = useCallback(
    (orderId: string) => {
      if (!isMountedRef.current) return;
      setVerificationError(null);
      setIsSlowNetwork(false);
      setPaymentStage('verifying');

      if (slowNetworkTimerRef.current) {
        clearTimeout(slowNetworkTimerRef.current);
      }
      slowNetworkTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsSlowNetwork(true);
        }
      }, 2500);

      syncOrderMutation.mutate(
        { order_id: orderId },
        {
          onSuccess: (data) => {
            if (!isMountedRef.current) return;
            if (slowNetworkTimerRef.current) clearTimeout(slowNetworkTimerRef.current);
            setIsSlowNetwork(false);

            if (data.status === 'paid') {
              setPaymentStage('settled');
              setIsSuccessPaid(true);
              setCompletedOrderId(orderId);
              // Invalidate cache denah kursi agar kursi langsung ter-render sebagai 'booked'
              queryClient.invalidateQueries({ queryKey: SCHEDULE_SEATS_QUERY_KEY });
              queryClient.invalidateQueries({ queryKey: ['events'] });
              queryClient.invalidateQueries({ queryKey: ['user', 'tickets'] });
              queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
              toast.success('Pembayaran Berhasil Dikonfirmasi!', {
                description: `Order ID: ${orderId}. Tiket Anda siap diakses.`,
              });
              onPaymentSuccess?.(orderId);
            } else if (data.status === 'pending') {
              setPaymentStage('pending');
              toast.info('Menunggu penyelesaian pembayaran', {
                description: `Selesaikan pembayaran Anda untuk Order ID: ${orderId}`,
              });
            } else {
              setPaymentStage('failed');
              const failureDesc =
                data.status === 'expired'
                  ? 'Waktu pembayaran telah kedaluwarsa. Kursi yang Anda pilih telah dilepaskan.'
                  : 'Pembayaran dibatalkan atau ditolak oleh gateway pembayaran.';
              setVerificationError(failureDesc);
              toast.error('Pembayaran tidak berhasil.', {
                description: failureDesc,
              });
            }
          },
          onError: (err) => {
            if (!isMountedRef.current) return;
            if (slowNetworkTimerRef.current) clearTimeout(slowNetworkTimerRef.current);
            setIsSlowNetwork(false);
            const friendly = getFriendlyErrorMessage(
              err,
              'Terjadi kendala saat memeriksa konfirmasi pembayaran ke server. Jangan khawatir, saldo/transaksi Anda aman di Midtrans.'
            );
            setVerificationError(friendly);
            toast.error('Gagal memverifikasi status pembayaran.', {
              description: friendly,
            });
          },
        }
      );
    },
    [syncOrderMutation, queryClient, onPaymentSuccess, setPaymentStage]
  );

  useEffect(() => {
    performSyncVerificationRef.current = performSyncVerification;
  }, [performSyncVerification]);

  const handleRetrySync = useCallback(() => {
    const orderId = completedOrderId || reservation?.data.order_id;
    if (orderId) {
      performSyncVerification(orderId);
    }
  }, [completedOrderId, reservation, performSyncVerification]);

  // Handler Aplikasi Kupon Promo
  const handleApplyVoucher = (e?: React.FormEvent, customCode?: string) => {
    e?.preventDefault();
    const code = (customCode || voucherCodeInput).trim().toUpperCase();
    if (!code) return;

    if (applyVoucherMutation.isPending || reserveSeatsMutation.isPending) return;

    setVoucherError(null);
    applyVoucherMutation.mutate(
      {
        voucher_code: code,
        gross_amount: initialGrossAmount,
        item_type: 'ticket',
        event_id: (schedule as { event_id?: number })?.event_id ?? event.id,
      },
      {
        onSuccess: (res) => {
          setAppliedVoucher(res);
          setVoucherCodeInput('');
          // Sinkronkan Snap Token baru di backend dengan voucher terpasang
          executeReservation(res.code);
          toast.success(`Kupon ${res.code} Berhasil Dipasang!`, {
            description: `Hemat Rp ${res.discount_amount.toLocaleString('id-ID')}`,
          });
        },
        onError: (err) => {
          const friendly = getFriendlyErrorMessage(err, 'Kupon voucher tidak dapat digunakan.');
          setVoucherError(friendly);
        },
      }
    );
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    setVoucherError(null);
    // Kembalikan transaksi ke harga normal (tanpa voucher)
    executeReservation(null);
  };

  // Kalkulasi tagihan (SSOT: snapshot backend jika tersedia)
  const settingServiceFee = publicSettings?.business_policies?.platform_service_fee ?? 0;
  const serviceFee =
    reservation?.data.service_fee !== undefined ? reservation.data.service_fee : settingServiceFee;
  const discountAmount =
    reservation?.data.discount_amount ?? (appliedVoucher ? appliedVoucher.discount_amount : 0);
  const netAmount =
    reservation?.data.net_amount ?? Math.max(0, initialGrossAmount - discountAmount) + serviceFee;

  // Trigger Tombol Bayar
  const handlePay = () => {
    if (!reservation?.data.snap_token) {
      toast.error('Sesi transaksi belum siap. Harap tunggu.');
      return;
    }
    payWithSnap(reservation.data.snap_token);
  };

  // Batalkan Pesanan & Bebaskan Kunci Kursi
  const handleCancelOrder = useCallback(() => {
    const orderId = completedOrderId || reservation?.data.order_id;
    if (!orderId) {
      onClose?.();
      return;
    }

    cancelOrderMutation.mutate(
      { order_id: orderId },
      {
        onSuccess: () => {
          toast.success('Pesanan Dibatalkan', {
            description:
              'Kunci kursi telah dibebaskan. Anda dapat memilih kembali kursi yang diinginkan.',
          });
          onClose?.();
        },
        onError: (err) => {
          const friendly = getFriendlyErrorMessage(err, 'Gagal membatalkan pesanan.');
          toast.error(friendly);
        },
      }
    );
  }, [completedOrderId, reservation, cancelOrderMutation, onClose]);

  return {
    reservation,
    reservationError,
    isLoadingReservation: reserveSeatsMutation.isPending,
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
    isApplyingVoucher: applyVoucherMutation.isPending,

    handleApplyVoucher,
    handleRemoveVoucher,
    handleRetryReservation,
    handleRetrySync,
    handlePay,
    handleCancelOrder,
    isCancellingOrder: cancelOrderMutation.isPending,

    isPaying,
    timer,
    seatLockDurationMinutes: publicSettings?.business_policies.seat_lock_duration_minutes ?? 15,
  };
}
