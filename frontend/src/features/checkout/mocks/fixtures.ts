/**
 * Dummy Fixtures untuk Domain Checkout & Payment
 * Sinkron 100% dengan skema contracts/checkout.contract.json
 */

import type {
  ApplyVoucherResponseData,
  PaymentStatusResponseData,
  RentMovieResponseData,
  ReserveSeatsResponseData,
} from '../types';

export interface MockVoucherItem {
  code: string;
  discount_type: 'percentage' | 'fixed' | 'slashed_price';
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  item_type: 'all' | 'ticket' | 'movie_rental';
  description: string;
}

export const mockVouchersList: MockVoucherItem[] = [
  {
    code: 'CORET25K',
    discount_type: 'slashed_price',
    discount_value: 25000,
    min_purchase: 30000,
    max_discount: null,
    item_type: 'ticket',
    description: 'Coret harga tiket menjadi Rp 25.000',
  },
  {
    code: 'SINEMUSHEMAT',
    discount_type: 'percentage',
    discount_value: 20,
    min_purchase: 40000,
    max_discount: 20000,
    item_type: 'all',
    description: 'Diskon 20% (Maks. Rp 20.000) untuk seluruh pesanan',
  },
  {
    code: 'TIKETXXI25K',
    discount_type: 'fixed',
    discount_value: 25000,
    min_purchase: 50000,
    max_discount: null,
    item_type: 'ticket',
    description: 'Potongan Langsung Rp 25.000 khusus Tiket Bioskop XXI',
  },
  {
    code: 'NOBARSERU',
    discount_type: 'fixed',
    discount_value: 15000,
    min_purchase: 50000,
    max_discount: null,
    item_type: 'ticket',
    description: 'Potongan Langsung Rp 15.000 khusus Tiket Bioskop',
  },
  {
    code: 'TIKETPERDANA',
    discount_type: 'fixed',
    discount_value: 10000,
    min_purchase: 30000,
    max_discount: null,
    item_type: 'ticket',
    description: 'Potongan Rp 10.000 untuk Screening Perdana',
  },
  {
    code: 'STREAMINGHEMAT',
    discount_type: 'fixed',
    discount_value: 5000,
    min_purchase: 20000,
    max_discount: null,
    item_type: 'movie_rental',
    description: 'Potongan Rp 5.000 khusus Sewa Film VoD',
  },
];

export const mockReservationFixture: ReserveSeatsResponseData = {
  order_id: 'SNM-TKT-2026-881A',
  snap_token: 'SNAP-MOCK-TKT-2026-881A',
  event_title: 'CINTA DAN SEJARAH (Special Cinema Premiere)',
  locked_seats: ['B3', 'B4'],
  gross_amount: 100000,
  discount_amount: 20000,
  net_amount: 80000,
  expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
};

export const mockVoucherAppliedFixture: ApplyVoucherResponseData = {
  code: 'SINEMUSHEMAT',
  discount_amount: 20000,
  net_amount: 80000,
  description: 'Diskon 20% (Maks. Rp 20.000) untuk seluruh pesanan',
};

export const mockRentMovieFixture: RentMovieResponseData = {
  order_id: 'SNM-VOD-2026-773C',
  snap_token: 'SNAP-MOCK-VOD-2026-773C',
  movie_title: 'MENGEJAR EMBUN KE UJUNG SENJA',
  gross_amount: 25000,
  discount_amount: 0,
  net_amount: 25000,
  rental_duration_hours: 48,
};

export const mockPaymentStatusFixture: PaymentStatusResponseData = {
  order_id: 'SNM-TKT-2026-881A',
  item_type: 'ticket',
  status: 'paid',
  payment_type: 'qris',
  paid_at: new Date().toISOString(),
};
