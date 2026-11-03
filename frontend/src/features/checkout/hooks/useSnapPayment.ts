import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { MidtransSnapCallbacks, MidtransSnapResult, PaymentStage } from '../types';

export interface UseSnapPaymentOptions {
  onSuccess?: (result: MidtransSnapResult) => void;
  onPending?: (result: MidtransSnapResult) => void;
  onError?: (result: MidtransSnapResult) => void;
  onClose?: () => void;
}

export interface UseSnapPaymentReturn {
  isPaying: boolean;
  paymentStage: PaymentStage;
  paymentResult: MidtransSnapResult | null;
  payWithSnap: (token: string, callbacks?: MidtransSnapCallbacks) => void;
  setPaymentStage: (stage: PaymentStage) => void;
  resetPaymentState: () => void;
}

export function useSnapPayment(options?: UseSnapPaymentOptions): UseSnapPaymentReturn {
  const [paymentStage, setPaymentStage] = useState<PaymentStage>('idle');
  const [paymentResult, setPaymentResult] = useState<MidtransSnapResult | null>(null);

  const isPaying =
    paymentStage === 'opening' ||
    paymentStage === 'awaiting_customer' ||
    paymentStage === 'verifying';

  const payWithSnap = useCallback(
    (token: string, customCallbacks?: MidtransSnapCallbacks) => {
      if (!token) {
        toast.error('Token pembayaran tidak valid.');
        return;
      }

      setPaymentStage('opening');

      // Periksa apakah Snap JS SDK sudah terpasang di window
      if (typeof window !== 'undefined' && window.snap && typeof window.snap.pay === 'function') {
        setPaymentStage('awaiting_customer');
        window.snap.pay(token, {
          onSuccess: (result) => {
            // Handshake verification: Pertahankan stage 'verifying' agar UI tidak flashback ke form checkout
            setPaymentStage('verifying');
            setPaymentResult(result);
            customCallbacks?.onSuccess?.(result);
            options?.onSuccess?.(result);
          },
          onPending: (result) => {
            setPaymentStage('pending');
            setPaymentResult(result);
            customCallbacks?.onPending?.(result);
            options?.onPending?.(result);
          },
          onError: (result) => {
            setPaymentStage('failed');
            setPaymentResult(result);
            customCallbacks?.onError?.(result);
            options?.onError?.(result);
          },
          onClose: () => {
            // Jika user menutup pop-up Snap secara sukarela tanpa transaksi selesai
            setPaymentStage('idle');
            customCallbacks?.onClose?.();
            options?.onClose?.();
          },
        });
      } else {
        const isMockEnabled = import.meta.env.VITE_ENABLE_MOCK === 'true';

        if (isMockEnabled) {
          // Simulasi pembayaran lokal khusus lingkungan Mock Service Worker (MSW)
          toast.info('Midtrans Snap Simulator aktif (Mock Mode)', {
            description: `Token: ${token.slice(0, 16)}... Simulasi pembayaran berhasil.`,
          });

          setPaymentStage('awaiting_customer');
          setTimeout(() => {
            setPaymentStage('verifying');
            const mockResult: MidtransSnapResult = {
              order_id: 'SNM-TKT-MOCK',
              status_code: '200',
              transaction_status: 'settlement',
              payment_type: 'qris',
            };
            setPaymentResult(mockResult);
            customCallbacks?.onSuccess?.(mockResult);
            options?.onSuccess?.(mockResult);
          }, 1000);
        } else {
          // Lingkungan Real Backend: Jangan memalsukan data. Beritahu penonton secara transparan
          setPaymentStage('idle');
          toast.error('Gateway Pembayaran Belum Siap', {
            description:
              'SDK Midtrans Snap belum termuat. Periksa koneksi internet atau nonaktifkan ekstensi pemblokir iklan (ad-blocker).',
          });
        }
      }
    },
    [options]
  );

  const resetPaymentState = useCallback(() => {
    setPaymentStage('idle');
    setPaymentResult(null);
  }, []);

  return {
    isPaying,
    paymentStage,
    paymentResult,
    payWithSnap,
    setPaymentStage,
    resetPaymentState,
  };
}
