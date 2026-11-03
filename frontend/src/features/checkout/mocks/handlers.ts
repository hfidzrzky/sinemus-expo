/**
 * Mock Handlers untuk Domain Checkout & Payment
 * Memenuhi seluruh spesifikasi contracts/checkout.contract.json
 */

import { http, HttpResponse } from 'msw';
import { mockVouchersList } from './fixtures';
import { MOCK_EVENT_DETAILS } from '@/features/events';
import type { ApplyVoucherPayload, RentMoviePayload, ReserveSeatsPayload } from '../types';

export const checkoutHandlers = [
  // 1. applyVoucher: POST /api/v1/checkout/voucher/apply
  http.post('*/api/v1/checkout/voucher/apply', async ({ request }) => {
    const body = (await request.json()) as ApplyVoucherPayload;
    const now = new Date();

    if (!body.voucher_code || typeof body.gross_amount !== 'number') {
      return HttpResponse.json(
        {
          success: false,
          message: 'Data kupon tidak lengkap.',
          error_code: 'INVALID_PAYLOAD',
          server_time: now.toISOString(),
        },
        { status: 400 }
      );
    }

    const voucher = mockVouchersList.find(
      (v) => v.code.toUpperCase() === body.voucher_code.trim().toUpperCase()
    );

    if (!voucher) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Kode voucher tidak valid atau tidak ditemukan.',
          error_code: 'VOUCHER_NOT_FOUND',
          server_time: now.toISOString(),
        },
        { status: 422 }
      );
    }

    // Validasi kesesuaian kategori item (tiket vs rental VoD)
    if (voucher.item_type !== 'all' && voucher.item_type !== body.item_type) {
      const targetLabel = body.item_type === 'ticket' ? 'tiket bioskop' : 'sewa film VoD';
      return HttpResponse.json(
        {
          success: false,
          message: `Kupon voucher ini tidak dapat digunakan untuk ${targetLabel}.`,
          error_code: 'ITEM_TYPE_MISMATCH',
          server_time: now.toISOString(),
        },
        { status: 422 }
      );
    }

    // Validasi batas minimal pembelian
    if (body.gross_amount < voucher.min_purchase) {
      return HttpResponse.json(
        {
          success: false,
          message: `Minimal pembelian untuk voucher ini adalah Rp ${voucher.min_purchase.toLocaleString('id-ID')}.`,
          error_code: 'MIN_PURCHASE_NOT_MET',
          server_time: now.toISOString(),
        },
        { status: 422 }
      );
    }

    const discountAmount =
      voucher.discount_type === 'percentage'
        ? voucher.max_discount
          ? Math.min((body.gross_amount * voucher.discount_value) / 100, voucher.max_discount)
          : (body.gross_amount * voucher.discount_value) / 100
        : voucher.discount_type === 'slashed_price'
          ? Math.max(0, body.gross_amount - voucher.discount_value)
          : Math.min(voucher.discount_value, body.gross_amount);

    const netAmount = Math.max(0, body.gross_amount - discountAmount);

    return HttpResponse.json({
      success: true,
      message: 'Kupon voucher berhasil diterapkan.',
      data: {
        code: voucher.code,
        discount_amount: discountAmount,
        net_amount: netAmount,
        description: voucher.description,
      },
      server_time: now.toISOString(),
    });
  }),

  // 2. rentMovie: POST /api/v1/movies/:id/rent
  http.post('*/api/v1/movies/:id/rent', async ({ request, params }) => {
    const { id } = params;
    let voucherCode: string | null = null;
    try {
      const body = (await request.json()) as RentMoviePayload;
      voucherCode = body?.voucher_code || null;
    } catch {
      // Body opsional
    }

    const now = new Date();
    const orderId = `SNM-VOD-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const baseRentalPrice = 25000;
    let discountAmount = 0;

    if (voucherCode) {
      const voucher = mockVouchersList.find(
        (v) => v.code.toUpperCase() === voucherCode?.toUpperCase()
      );
      if (
        voucher &&
        (voucher.item_type === 'all' || voucher.item_type === 'movie_rental') &&
        baseRentalPrice >= voucher.min_purchase
      ) {
        if (voucher.discount_type === 'percentage') {
          const raw = (baseRentalPrice * voucher.discount_value) / 100;
          discountAmount = voucher.max_discount ? Math.min(raw, voucher.max_discount) : raw;
        } else {
          discountAmount = Math.min(voucher.discount_value, baseRentalPrice);
        }
      }
    }

    const netAmount = Math.max(0, baseRentalPrice - discountAmount);

    return HttpResponse.json(
      {
        success: true,
        message: 'Sewa film VoD berhasil diinisialisasi. Silakan selesaikan pembayaran.',
        data: {
          order_id: orderId,
          snap_token: `SNAP-MOCK-VOD-${Math.random().toString(36).substring(2, 10)}`,
          movie_title: `Film Digital Sinemus #${id}`,
          gross_amount: baseRentalPrice,
          discount_amount: discountAmount,
          net_amount: netAmount,
          rental_duration_hours: 48,
        },
        server_time: now.toISOString(),
      },
      { status: 201 }
    );
  }),

  // 3. reserveEventSeats: POST /api/v1/bookings/reserve
  http.post('*/api/v1/bookings/reserve', async ({ request }) => {
    const body = (await request.json()) as ReserveSeatsPayload;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 menit masa lock
    const orderId = `SNM-TKT-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let eventTitle = 'Screening Sinemus Cinema Premiere';
    let unitPrice = 50000;

    if (body.schedule_id) {
      for (const evt of MOCK_EVENT_DETAILS) {
        const sch = evt.schedules.find((s) => s.id === body.schedule_id);
        if (sch) {
          eventTitle = evt.title;
          unitPrice = sch.ticket_price;
          break;
        }
      }
    }

    const seatCount = body.seat_ids?.length || body.quantity || 1;
    const grossAmount = seatCount * unitPrice;

    let discountAmount = 0;
    if (body.voucher_code) {
      const voucher = mockVouchersList.find(
        (v) => v.code.toUpperCase() === body.voucher_code?.toUpperCase()
      );
      if (
        voucher &&
        (voucher.item_type === 'all' || voucher.item_type === 'ticket') &&
        grossAmount >= voucher.min_purchase
      ) {
        if (voucher.discount_type === 'percentage') {
          const rawDiscount = (grossAmount * voucher.discount_value) / 100;
          discountAmount = voucher.max_discount
            ? Math.min(rawDiscount, voucher.max_discount)
            : rawDiscount;
        } else {
          discountAmount = Math.min(voucher.discount_value, grossAmount);
        }
      }
    }

    const netAmount = Math.max(0, grossAmount - discountAmount);
    const lockedSeats = body.seat_ids
      ? body.seat_ids.map((id) => `Kursi #${id}`)
      : [`General Admission (${seatCount} Tiket)`];

    return HttpResponse.json(
      {
        success: true,
        message: 'Kursi berhasil dikunci. Silakan selesaikan pembayaran.',
        data: {
          order_id: orderId,
          snap_token: `SNAP-MOCK-TKT-${Math.random().toString(36).substring(2, 10)}`,
          event_title: eventTitle,
          locked_seats: lockedSeats,
          gross_amount: grossAmount,
          discount_amount: discountAmount,
          net_amount: netAmount,
          expires_at: expiresAt.toISOString(),
        },
        server_time: now.toISOString(),
      },
      { status: 201 }
    );
  }),

  // 4. getPaymentStatus: GET /api/v1/checkout/orders/:order_id/status
  http.get('*/api/v1/checkout/orders/:order_id/status', ({ params }) => {
    const { order_id } = params;
    const orderIdStr = String(order_id);
    const isVod = orderIdStr.startsWith('SNM-VOD-');
    const now = new Date();

    return HttpResponse.json({
      success: true,
      message: 'Status pembayaran berhasil diambil.',
      data: {
        order_id: orderIdStr,
        item_type: isVod ? 'movie_rental' : 'ticket',
        status: 'paid',
        payment_type: 'qris',
        paid_at: now.toISOString(),
      },
      server_time: now.toISOString(),
    });
  }),

  // 5. syncOrder: POST /api/v1/checkout/orders/:order_id/sync
  http.post('*/api/v1/checkout/orders/:order_id/sync', ({ params }) => {
    const { order_id } = params;
    const orderIdStr = String(order_id);
    const isVod = orderIdStr.startsWith('SNM-VOD-');
    const now = new Date();

    return HttpResponse.json({
      success: true,
      message: 'Status pembayaran berhasil disinkronkan.',
      data: {
        order_id: orderIdStr,
        item_type: isVod ? 'movie_rental' : 'ticket',
        status: 'paid',
        payment_type: 'qris',
        paid_at: now.toISOString(),
      },
      server_time: now.toISOString(),
    });
  }),

  // 6. cancelOrder: POST /api/v1/checkout/orders/:order_id/cancel
  http.post('*/api/v1/checkout/orders/:order_id/cancel', ({ params }) => {
    const { order_id } = params;
    const orderIdStr = String(order_id);
    const isVod = orderIdStr.startsWith('SNM-VOD-');
    const now = new Date();

    return HttpResponse.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan dan alokasi kursi telah dibebaskan.',
      data: {
        order_id: orderIdStr,
        item_type: isVod ? 'movie_rental' : 'ticket',
        status: 'cancelled',
        payment_type: null,
        paid_at: null,
      },
      server_time: now.toISOString(),
    });
  }),

  // 7. midtransWebhook: POST /api/v1/webhooks/midtrans
  http.post('*/api/v1/webhooks/midtrans', () => {
    return HttpResponse.json({
      success: true,
      message: 'Notifikasi webhook Midtrans berhasil diproses.',
    });
  }),
];
