/**
 * Mock Handlers untuk Domain Tiket Saya & Akses Sewa
 * Sinkron 100% dengan contracts/tickets.contract.json
 */

import { http, HttpResponse } from 'msw';
import { mockTicketItems, mockTicketDetails, mockFilmRentals } from './fixtures';

export const ticketsHandlers = [
  // 1. listMyTickets: GET /api/v1/user/tickets
  http.get('*/api/v1/user/tickets', ({ request }) => {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    const now = new Date();

    let filtered = [...mockTicketItems];
    if (statusParam === 'upcoming') {
      filtered = filtered.filter((t) => t.is_upcoming);
    } else if (statusParam === 'past') {
      filtered = filtered.filter((t) => !t.is_upcoming);
    } else if (statusParam === 'pending') {
      filtered = filtered.filter((t) => t.payment_status === 'pending');
    }

    return HttpResponse.json({
      success: true,
      message: 'Daftar tiket berhasil diambil.',
      data: filtered,
      server_time: now.toISOString(),
    });
  }),

  // 2. getTicketDetail: GET /api/v1/user/tickets/:ticket_code
  http.get('*/api/v1/user/tickets/:ticket_code', ({ params }) => {
    const ticketCode = String(params.ticket_code);
    const now = new Date();

    const detail = mockTicketDetails[ticketCode];
    if (!detail) {
      // Cari di mockTicketItems jika tidak ada di dict detail
      const item = mockTicketItems.find((t) => t.ticket_code === ticketCode);
      if (item) {
        return HttpResponse.json({
          success: true,
          message: 'Detail tiket berhasil diambil.',
          data: {
            id: item.id,
            order_id: item.order_id,
            event_type: item.event_type,
            ticket_code: item.ticket_code,
            qr_hash: item.qr_hash,
            buyer_name: 'Penonton Sinemus',
            buyer_phone: '081234567890',
            event_title: item.event_title,
            poster_url: item.poster_url,
            venue_name: item.venue_name,
            venue_address: `${item.venue_name}, ${item.city}`,
            city: item.city,
            show_time: item.show_time,
            seat_codes: item.seat_codes,
            paid_amount: 100000,
            formatted_paid_amount: 'Rp 100.000',
            paid_at: item.show_time,
            checkin_status: item.checkin_status || 'pending',
            checkin_at: null,
            fulfillment_status: item.fulfillment_status,
            cinema_ticket: item.cinema_ticket,
          },
          server_time: now.toISOString(),
        });
      }

      return HttpResponse.json(
        {
          success: false,
          message: 'Tiket tidak ditemukan.',
          error_code: 'TICKET_NOT_FOUND',
          server_time: now.toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Detail e-tiket berhasil diambil.',
      data: detail,
      server_time: now.toISOString(),
    });
  }),

  // 3. listMyFilms: GET /api/v1/user/films
  http.get('*/api/v1/user/films', () => {
    const now = new Date();
    return HttpResponse.json({
      success: true,
      message: 'Daftar film sewa aktif berhasil diambil.',
      data: mockFilmRentals,
      server_time: now.toISOString(),
    });
  }),
];
