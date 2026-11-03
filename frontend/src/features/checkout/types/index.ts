/**
 * Checkout & Payment Domain Types
 * Sinkron 100% dengan contracts/checkout.contract.json
 */

export interface ReserveSeatsPayload {
  schedule_id: number;
  seat_ids?: number[];
  quantity?: number;
  voucher_code?: string | null;
}

export interface ReserveSeatsResponseData {
  order_id: string;
  snap_token: string;
  event_title: string;
  locked_seats: string[];
  gross_amount: number;
  service_fee?: number;
  discount_amount: number;
  net_amount: number;
  expires_at: string;
}

export interface ApplyVoucherPayload {
  voucher_code: string;
  gross_amount: number;
  item_type: 'ticket' | 'movie_rental';
  event_id?: number | null;
  movie_id?: number | null;
}

export interface ApplyVoucherResponseData {
  code: string;
  discount_amount: number;
  net_amount: number;
  description: string;
}

export interface RentMoviePayload {
  voucher_code?: string | null;
}

export interface RentMovieResponseData {
  order_id: string; // Format: SNM-VOD-2026-XXXX
  snap_token: string;
  movie_title: string;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  rental_duration_hours: number;
}

export type PaymentStage =
  'idle' | 'opening' | 'awaiting_customer' | 'verifying' | 'settled' | 'pending' | 'failed';

export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'failed' | 'cancelled';

export interface PaymentStatusResponseData {
  order_id: string;
  item_type: 'ticket' | 'movie_rental';
  status: PaymentStatus;
  payment_type: string | null;
  paid_at: string | null;
}

export interface MidtransSnapResult {
  order_id: string;
  status_code: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  gross_amount?: string;
  finish_redirect_url?: string;
  pdf_url?: string;
}

export interface MidtransSnapCallbacks {
  onSuccess?: (result: MidtransSnapResult) => void;
  onPending?: (result: MidtransSnapResult) => void;
  onError?: (result: MidtransSnapResult) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: MidtransSnapCallbacks) => void;
      embed?: (token: string, options: { embedId: string } & MidtransSnapCallbacks) => void;
    };
  }
}
