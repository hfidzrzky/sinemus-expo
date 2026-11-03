import { http, HttpResponse } from 'msw';
import {
  getMockAdminStats,
  mockAdminEvents,
  mockAdminMovies,
  mockAdminMovieAccess,
  mockAdminOrders,
  mockAdminVouchers,
  mockAdminBanners,
  mockAdminUsers,
  mockFulfillmentOrders,
  mockSmartIngestPreview,
  mockScannerValidResponses,
  mockSystemSettings,
} from './admin.fixture';
import type {
  AdminEventItem,
  AdminMovieItem,
  AdminMovieAccessItem,
  AdminVoucherItem,
  AdminBannerItem,
  CreateEventPayload,
  AdminScheduleItem,
  EventVenueFormInput,
  ShowtimeSlotInput,
} from '../types';

let adminEventsState = [...mockAdminEvents];
let adminMoviesState = [...mockAdminMovies];
export function getAdminMoviesState(): AdminMovieItem[] {
  return adminMoviesState;
}
let adminMovieAccessState = [...mockAdminMovieAccess];
let adminVouchersState = [...mockAdminVouchers];
let adminBannersState = [...mockAdminBanners];
const adminUsersState = [...mockAdminUsers];
const adminOrdersState = [...mockAdminOrders];
const fulfillmentOrdersState = [...mockFulfillmentOrders];
const scannedQrRecords = new Set<string>();
let systemSettingsState = { ...mockSystemSettings };

export const adminHandlers = [
  // 1. Dashboard Stats (getDashboardStats)
  http.get('*/api/v1/admin/dashboard/stats', ({ request }) => {
    const url = new URL(request.url);
    const period =
      (url.searchParams.get('period') as 'today' | '7d' | '30d' | 'year' | 'custom') || '7d';
    const startDate = url.searchParams.get('start_date') || undefined;
    const endDate = url.searchParams.get('end_date') || undefined;
    const baseStats = getMockAdminStats(period, startDate, endDate);
    const recentOrders = [...adminOrdersState]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return HttpResponse.json({
      success: true,
      message: 'Statistik eksekutif admin studio berhasil dimuat.',
      data: {
        ...baseStats,
        recent_orders: recentOrders,
      },
      server_time: new Date().toISOString(),
    });
  }),

  // 2. Events List & CRUD
  http.get('*/api/v1/admin/events', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const filterType = url.searchParams.get('event_type') || url.searchParams.get('type') || 'all';
    const filterStatus = url.searchParams.get('status') || 'all';
    const filterCity = url.searchParams.get('city') || 'all';

    let filtered = [...adminEventsState];

    if (search) {
      filtered = filtered.filter(
        (ev) =>
          ev.title.toLowerCase().includes(search) ||
          ev.venue_name.toLowerCase().includes(search) ||
          ev.city.toLowerCase().includes(search)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((ev) => ev.event_type === filterType);
    }

    if (filterCity !== 'all') {
      filtered = filtered.filter((ev) => ev.city.toLowerCase() === filterCity.toLowerCase());
    }

    if (filterStatus === 'published' || filterStatus === 'live') {
      filtered = filtered.filter((ev) => ev.is_published || ev.is_active);
    } else if (filterStatus === 'draft') {
      filtered = filtered.filter((ev) => !ev.is_published && !ev.is_active);
    }

    return HttpResponse.json({
      success: true,
      message: 'Daftar event admin berhasil diambil.',
      data: filtered,
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 20,
        to: filtered.length,
        total: filtered.length,
      },
      server_time: new Date().toISOString(),
    });
  }),

  http.get('*/api/v1/admin/events/:id', ({ params }) => {
    const id = Number(params.id);
    const event = adminEventsState.find((e) => e.id === id);

    if (!event) {
      return HttpResponse.json(
        {
          success: false,
          message: `Event #${id} tidak ditemukan.`,
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Detail event admin berhasil dimuat.',
      data: event,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/events', async ({ request }) => {
    const body = (await request.json()) as CreateEventPayload;
    const newId = Math.max(...adminEventsState.map((e) => e.id), 0) + 1;

    const newEvent: AdminEventItem = {
      id: newId,
      slug:
        body.slug ||
        (body.title ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `event-${newId}`),
      title: body.title || 'Event Baru',
      description: body.description || '',
      synopsis_short: body.synopsis_short || '',
      poster_url:
        body.poster_url ||
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
      backdrop_url:
        body.backdrop_url ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80',
      director: body.director || 'Sutradara Sinemus',
      cast: body.cast || [],
      cloudflare_teaser_uid: body.cloudflare_teaser_uid || null,
      venue_name: body.venues?.[0]?.venue_name || body.venue_name || 'Sinemus Space Jakarta',
      venue_address:
        body.venues?.[0]?.venue_address ||
        body.venue_address ||
        'Jl. Kemang Raya No. 45B, Jakarta Selatan',
      city: body.venues?.[0]?.city || body.city || 'Jakarta Selatan',
      google_maps_url:
        body.venues?.[0]?.google_maps_url || body.google_maps_url || 'https://maps.google.com',
      event_type: body.event_type || 'regular',
      seating_type: body.seating_type || 'assigned_seating',
      cinema_partner: body.cinema_partner || body.venues?.[0]?.cinema_partner || undefined,
      target_screening_month: body.target_screening_month,
      is_published: body.is_published ?? false,
      is_featured: body.is_featured ?? false,
      venues:
        body.venues?.map((v, idx) => ({
          id: v.id || 2000 + idx,
          event_id: newId,
          venue_name: v.venue_name,
          cinema_partner: v.cinema_partner || null,
          venue_address: v.venue_address,
          city: v.city,
          google_maps_url: v.google_maps_url || null,
        })) || [],
      earliest_show_time:
        body.venues?.[0]?.schedules?.[0]?.show_time ||
        body.schedules?.[0]?.show_time ||
        '2026-12-01T19:00:00+07:00',
      starting_price:
        body.venues?.[0]?.schedules?.[0]?.ticket_price ||
        body.schedules?.[0]?.ticket_price ||
        50000,
      formatted_starting_price: `Rp ${(
        body.venues?.[0]?.schedules?.[0]?.ticket_price ||
        body.schedules?.[0]?.ticket_price ||
        50000
      ).toLocaleString('id-ID')}`,
      total_capacity:
        body.venues?.reduce(
          (acc: number, v: EventVenueFormInput) =>
            acc +
            (v.schedules?.reduce((sAcc: number, s: ShowtimeSlotInput) => sAcc + s.total_seats, 0) ||
              0),
          0
        ) ||
        body.schedules?.reduce((acc: number, s: ShowtimeSlotInput) => acc + s.total_seats, 0) ||
        60,
      total_booked: 0,
      occupancy_rate: 0,
      schedules: (() => {
        if (body.venues && body.venues.length > 0) {
          const list: AdminScheduleItem[] = [];
          let schCount = 0;
          body.venues.forEach((v: EventVenueFormInput, vIdx: number) => {
            const vId = v.id || 2000 + vIdx;
            v.schedules?.forEach((s: ShowtimeSlotInput) => {
              schCount++;
              list.push({
                id: s.id || 1000 + schCount,
                event_id: newId,
                event_venue_id: vId,
                venue: {
                  id: vId,
                  event_id: newId,
                  venue_name: v.venue_name,
                  cinema_partner: v.cinema_partner || null,
                  venue_address: v.venue_address,
                  city: v.city,
                  google_maps_url: v.google_maps_url || null,
                },
                show_time: s.show_time,
                ticket_price: s.ticket_price,
                formatted_ticket_price: `Rp ${s.ticket_price.toLocaleString('id-ID')}`,
                total_seats: s.total_seats,
                available_seats_count: s.total_seats,
                booked_seats_count: 0,
                studio_name: s.studio_name || 'Studio 1',
                max_tickets_per_order: s.max_tickets_per_order || 6,
              });
            });
          });
          return list;
        }

        return (
          body.schedules?.map((s: ShowtimeSlotInput, idx: number) => ({
            id: s.id || 1000 + idx,
            event_id: newId,
            show_time: s.show_time,
            ticket_price: s.ticket_price,
            formatted_ticket_price: `Rp ${s.ticket_price.toLocaleString('id-ID')}`,
            total_seats: s.total_seats,
            available_seats_count: s.total_seats,
            booked_seats_count: 0,
            studio_name: s.studio_name || 'Studio Utama',
            max_tickets_per_order: s.max_tickets_per_order || 6,
          })) || []
        );
      })(),
      created_at: new Date().toISOString(),
    };

    adminEventsState = [newEvent, ...adminEventsState];

    return HttpResponse.json(
      {
        success: true,
        message: 'Event penayangan berhasil dibuat.',
        data: newEvent,
        server_time: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.put('*/api/v1/admin/events/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<AdminEventItem>;
    const index = adminEventsState.findIndex((e) => e.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          message: `Event #${id} tidak ditemukan.`,
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const isPublished =
      body.is_published !== undefined
        ? Boolean(body.is_published)
        : body.is_active !== undefined
          ? Boolean(body.is_active)
          : adminEventsState[index].is_published;
    const isFeatured = isPublished
      ? Boolean(body.is_featured ?? adminEventsState[index].is_featured)
      : false;

    const updatedEvent: AdminEventItem = {
      ...adminEventsState[index],
      ...body,
      is_published: isPublished,
      is_active: isPublished,
      is_featured: isFeatured,
      id,
    };
    adminEventsState[index] = updatedEvent;

    return HttpResponse.json({
      success: true,
      message: 'Event penayangan berhasil diperbarui.',
      data: updatedEvent,
      server_time: new Date().toISOString(),
    });
  }),

  http.delete('*/api/v1/admin/events/:id', ({ params }) => {
    const id = Number(params.id);
    const existing = adminEventsState.find((e) => e.id === id);

    if (
      existing &&
      ((existing.total_booked ?? 0) > 0 || (existing.metrics?.total_tickets_sold ?? 0) > 0)
    ) {
      return HttpResponse.json(
        {
          success: false,
          message:
            'Event tidak dapat dihapus karena telah memiliki transaksi tiket terjual. Silakan ubah status event menjadi Draf jika ingin menutup penjualan.',
          error_code: 'EVENT_CANNOT_BE_DELETED',
          server_time: new Date().toISOString(),
        },
        { status: 422 }
      );
    }

    adminEventsState = adminEventsState.filter((e) => e.id !== id);

    return HttpResponse.json({
      success: true,
      message: `Event #${id} berhasil dihapus dari katalog.`,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/events/:id/schedules', async ({ params, request }) => {
    const eventId = Number(params.id);
    const body = (await request.json()) as {
      show_time: string;
      ticket_price: number;
      total_seats: number;
      studio_name?: string;
      max_tickets_per_order?: number;
    };
    const event = adminEventsState.find((e) => e.id === eventId);
    if (!event) {
      return HttpResponse.json(
        {
          success: false,
          message: `Event #${eventId} tidak ditemukan.`,
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const newSchedule = {
      id: Math.max(...event.schedules.map((s) => s.id), 0) + 1,
      event_id: eventId,
      show_time: body.show_time,
      ticket_price: body.ticket_price,
      formatted_ticket_price: `Rp ${body.ticket_price.toLocaleString('id-ID')}`,
      total_seats: body.total_seats,
      available_seats_count: body.total_seats,
      booked_seats_count: 0,
      studio_name: body.studio_name || 'Studio Utama',
      max_tickets_per_order: body.max_tickets_per_order || 6,
    };
    event.schedules.push(newSchedule);

    return HttpResponse.json({
      success: true,
      message: 'Sesi penayangan berhasil ditambahkan.',
      data: newSchedule,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/schedules/:schedule_id/seats/generate', async ({ params, request }) => {
    const scheduleId = Number(params.schedule_id);
    const body = (await request.json()) as {
      rows: number;
      columns: number;
      disabled_seats?: string[];
      vip_seats?: string[];
    };

    return HttpResponse.json({
      success: true,
      message: `Denah kursi ${body.rows}x${body.columns} untuk sesi #${scheduleId} berhasil digenerate.`,
      data: {
        schedule_id: scheduleId,
        generated_count: body.rows * body.columns - (body.disabled_seats?.length || 0),
      },
      server_time: new Date().toISOString(),
    });
  }),

  // 3. Movies VoD List & CRUD
  http.get('*/api/v1/admin/movies', () => {
    return HttpResponse.json({
      success: true,
      message: 'Katalog film VoD admin berhasil diambil.',
      data: adminMoviesState,
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 20,
        to: adminMoviesState.length,
        total: adminMoviesState.length,
      },
      server_time: new Date().toISOString(),
    });
  }),

  http.get('*/api/v1/admin/movies/:id', ({ params }) => {
    const id = Number(params.id);
    const movie = adminMoviesState.find((m) => m.id === id);

    if (!movie) {
      return HttpResponse.json(
        {
          success: false,
          message: `Film #${id} tidak ditemukan.`,
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Detail film VoD berhasil dimuat.',
      data: movie,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/movies', async ({ request }) => {
    const body = (await request.json()) as Partial<AdminMovieItem>;
    const newId = Math.max(...adminMoviesState.map((m) => m.id), 100) + 1;

    const synopsis = body.synopsis || body.synopsis_full || body.synopsis_short || '';
    const isFree = body.access_model === 'free';
    const rentalPrice = isFree
      ? 0
      : body.rental_price && body.rental_price > 0
        ? body.rental_price
        : 25000;
    const newMovie: AdminMovieItem = {
      id: newId,
      slug:
        body.slug ||
        (body.title ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `movie-${newId}`),
      title: body.title || 'Film Baru',
      synopsis,
      synopsis_short: body.synopsis_short || synopsis.slice(0, 120),
      synopsis_full: body.synopsis_full || synopsis,
      director: body.director || 'Sutradara Sinemus',
      cast: body.cast || [],
      genre: body.genre || ['Drama'],
      release_year: body.release_year || new Date().getFullYear(),
      duration_minutes: body.duration_minutes || 90,
      age_rating: body.age_rating || '13+',
      poster_url:
        body.poster_url ||
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
      backdrop_url:
        body.backdrop_url ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80',
      look_films: body.look_films || [],
      cloudflare_video_uid: body.cloudflare_video_uid || 'demo-cf-video-uid',
      cloudflare_trailer_uid: body.cloudflare_trailer_uid || null,
      stream_status: body.stream_status || 'ready',
      access_model: (isFree ? 'free' : 'rental') as 'rental' | 'free',
      rental_price: rentalPrice,
      formatted_rental_price: isFree ? 'Gratis' : `Rp ${rentalPrice.toLocaleString('id-ID')}`,
      active_rental_duration_hours: body.active_rental_duration_hours || 48,
      is_published: body.is_published ?? true,
      is_featured: body.is_featured ?? false,
      active_rentals_count: 0,
      created_at: new Date().toISOString(),
    };

    adminMoviesState = [newMovie, ...adminMoviesState];

    return HttpResponse.json(
      {
        success: true,
        message: 'Film VoD berhasil ditambahkan ke katalog.',
        data: newMovie,
        server_time: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.put('*/api/v1/admin/movies/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<AdminMovieItem>;
    const index = adminMoviesState.findIndex((m) => m.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          message: `Film #${id} tidak ditemukan.`,
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const current = adminMoviesState[index];
    const synopsis = body.synopsis || body.synopsis_full || body.synopsis_short || current.synopsis;

    const effectiveAccessModel = body.access_model ?? current.access_model;
    const isFree = effectiveAccessModel === 'free';
    const rentalPrice = isFree
      ? 0
      : body.rental_price !== undefined
        ? body.rental_price
        : current.rental_price;

    const updatedMovie: AdminMovieItem = {
      ...current,
      ...body,
      id,
      synopsis,
      synopsis_short: body.synopsis_short || synopsis.slice(0, 120),
      synopsis_full: body.synopsis_full || synopsis,
      access_model: effectiveAccessModel,
      rental_price: rentalPrice,
      formatted_rental_price: isFree ? 'Gratis' : `Rp ${rentalPrice.toLocaleString('id-ID')}`,
    };
    adminMoviesState[index] = updatedMovie;

    return HttpResponse.json({
      success: true,
      message: 'Film VoD berhasil diperbarui.',
      data: updatedMovie,
      server_time: new Date().toISOString(),
    });
  }),

  http.delete('*/api/v1/admin/movies/:id', ({ params }) => {
    const id = Number(params.id);
    adminMoviesState = adminMoviesState.filter((m) => m.id !== id);

    return HttpResponse.json({
      success: true,
      message: `Film #${id} berhasil dihapus dari inventaris.`,
      server_time: new Date().toISOString(),
    });
  }),

  // 4. Entitlement (list, grantMovieAccess & revokeMovieAccess)
  http.get('*/api/v1/admin/movie-access', () => {
    return HttpResponse.json({
      success: true,
      message: 'Daftar entitlement hak tonton film berhasil dimuat.',
      data: adminMovieAccessState,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/movie-access/grant', async ({ request }) => {
    const body = (await request.json()) as {
      user_id: number;
      movie_id: number;
      duration_hours?: number;
      admin_notes?: string;
    };

    const targetMovie = adminMoviesState.find((m) => m.id === body.movie_id);
    const targetUser = mockAdminUsers.find((u) => u.id === body.user_id);
    const newId = Math.max(...adminMovieAccessState.map((a) => a.id), 8800) + 1;
    const expiresAt = new Date(
      Date.now() + (body.duration_hours || 48) * 3600 * 1000
    ).toISOString();

    const newEntitlement: AdminMovieAccessItem = {
      id: newId,
      user_id: body.user_id,
      user_email: targetUser?.email || `user${body.user_id}@sinemus.id`,
      user_name: targetUser?.name || `Pengguna #${body.user_id}`,
      movie_id: body.movie_id,
      movie_title: targetMovie?.title || 'Film Sinemus',
      rental_expires_at: expiresAt,
      access_status: 'active',
      granted_by_admin_name: 'Budi Santoso (Super Admin)',
      admin_notes: body.admin_notes || 'Pemberian Akses Khusus',
      created_at: new Date().toISOString(),
    };

    adminMovieAccessState = [newEntitlement, ...adminMovieAccessState];

    return HttpResponse.json({
      success: true,
      message: 'Hak akses sewa film berhasil diberikan kepada penonton.',
      data: {
        access_id: newId,
        user_email: newEntitlement.user_email,
        movie_title: newEntitlement.movie_title,
        rental_expires_at: expiresAt,
        access_status: 'active',
      },
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/movie-access/:id/revoke', ({ params }) => {
    const id = Number(params.id);
    adminMovieAccessState = adminMovieAccessState.map((a) =>
      a.id === id ? { ...a, access_status: 'revoked' as const } : a
    );

    return HttpResponse.json({
      success: true,
      message: 'Hak akses film pengguna berhasil dicabut.',
      server_time: new Date().toISOString(),
    });
  }),

  // 5. Orders Audit (listAdminOrders, getOrderDetail, resendNotification)
  http.get('*/api/v1/admin/orders/:order_id', ({ params }) => {
    const orderId = String(params.order_id);
    const order = adminOrdersState.find((o) => o.order_id.toLowerCase() === orderId.toLowerCase());

    if (!order) {
      return HttpResponse.json(
        {
          success: false,
          message: `Transaksi dengan Order ID ${orderId} tidak ditemukan.`,
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Detail transaksi berhasil dimuat.',
      data: order,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/orders/:order_id/resend', async ({ params, request }) => {
    const orderId = String(params.order_id);
    let channel = 'all';
    try {
      const body = (await request.json()) as { channel?: string };
      if (body?.channel) {
        channel = body.channel;
      }
    } catch {
      // payload might be empty
    }

    const order = adminOrdersState.find((o) => o.order_id.toLowerCase() === orderId.toLowerCase());

    return HttpResponse.json({
      success: true,
      message: `Notifikasi e-tiket & bukti transaksi berhasil dikirim ulang via ${channel.toUpperCase()}.`,
      data: {
        order_id: orderId,
        channel,
        sent_to: {
          email: order?.user_email || 'customer@sinemus.id',
          phone: order?.user_phone || '+62 812-xxxx-xxxx',
        },
        sent_at: new Date().toISOString(),
      },
      server_time: new Date().toISOString(),
    });
  }),

  http.get('*/api/v1/admin/orders', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all';
    const status = url.searchParams.get('status') || 'all';
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const perPage = Math.max(1, parseInt(url.searchParams.get('per_page') || '10', 10));

    let list = [...adminOrdersState];

    if (type !== 'all') {
      list = list.filter((o) => o.order_type === type);
    }

    if (status !== 'all') {
      list = list.filter((o) => o.payment_status === status);
    }

    if (search) {
      list = list.filter(
        (o) =>
          o.order_id.toLowerCase().includes(search) ||
          o.user_name.toLowerCase().includes(search) ||
          o.user_email.toLowerCase().includes(search) ||
          (o.user_phone && o.user_phone.toLowerCase().includes(search)) ||
          o.item_title.toLowerCase().includes(search)
      );
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      list = list.filter((o) => new Date(o.created_at).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      list = list.filter((o) => new Date(o.created_at).getTime() <= end);
    }

    // Urutkan selalu dari transaksi terbaru (created_at desc) sinkron dengan backend Laravel
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = list.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const fromIndex = (page - 1) * perPage;
    const toIndex = Math.min(fromIndex + perPage, total);
    const pagedData = list.slice(fromIndex, toIndex);

    return HttpResponse.json({
      success: true,
      message: 'Riwayat transaksi admin berhasil dimuat.',
      data: pagedData,
      meta: {
        current_page: page,
        from: total > 0 ? fromIndex + 1 : 0,
        last_page: lastPage,
        per_page: perPage,
        to: total > 0 ? toIndex : 0,
        total,
      },
      server_time: new Date().toISOString(),
    });
  }),

  // 6. Vouchers List & CRUD
  http.get('*/api/v1/admin/vouchers', () => {
    return HttpResponse.json({
      success: true,
      message: 'Daftar voucher promo berhasil diambil.',
      data: adminVouchersState,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/vouchers', async ({ request }) => {
    const body = (await request.json()) as Omit<AdminVoucherItem, 'id' | 'used_quota'>;
    const newId = Math.max(...adminVouchersState.map((v) => v.id), 0) + 1;

    const newVoucher: AdminVoucherItem = {
      id: newId,
      code: body.code,
      promo_type: body.promo_type ?? 'voucher_code',
      name: body.name ?? null,
      max_uses_per_user: body.max_uses_per_user ?? null,
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      max_discount_amount: body.max_discount_amount,
      min_transaction_amount: body.min_transaction_amount,
      target_item: body.target_item,
      quota: body.quota,
      used_quota: 0,
      valid_from: body.valid_from,
      valid_until: body.valid_until,
      is_active: body.is_active ?? true,
    };

    adminVouchersState = [newVoucher, ...adminVouchersState];

    return HttpResponse.json(
      {
        success: true,
        message: `Voucher ${newVoucher.code} berhasil dibuat.`,
        data: newVoucher,
        server_time: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.put('*/api/v1/admin/vouchers/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<AdminVoucherItem>;

    adminVouchersState = adminVouchersState.map((v) => (v.id === id ? { ...v, ...body } : v));

    const updated = adminVouchersState.find((v) => v.id === id);

    return HttpResponse.json({
      success: true,
      message: `Voucher #${id} berhasil diperbarui.`,
      data: updated,
      server_time: new Date().toISOString(),
    });
  }),

  http.delete('*/api/v1/admin/vouchers/:id', ({ params }) => {
    const id = Number(params.id);
    adminVouchersState = adminVouchersState.filter((v) => v.id !== id);

    return HttpResponse.json({
      success: true,
      message: `Voucher #${id} berhasil dihapus.`,
      server_time: new Date().toISOString(),
    });
  }),

  // 7. Banners List & CRUD & Reorder
  http.get('*/api/v1/admin/banners', () => {
    return HttpResponse.json({
      success: true,
      message: 'Daftar banner konten admin berhasil diambil.',
      data: adminBannersState,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/banners', async ({ request }) => {
    const body = (await request.json()) as Omit<AdminBannerItem, 'id'>;
    const newId = Math.max(...adminBannersState.map((b) => b.id), 0) + 1;

    const newBanner: AdminBannerItem = {
      id: newId,
      title: body.title || '',
      subtitle: body.subtitle || '',
      badge_text: body.badge_text || '',
      age_rating: body.age_rating || null,
      genre: body.genre || null,
      release_year: body.release_year || null,
      duration_minutes: body.duration_minutes || null,
      image_url: body.image_url,
      display_mode: body.display_mode || 'rich_content',
      link_type: body.link_type || 'event',
      target_identifier: body.target_identifier || '',
      button_text: body.button_text || 'Lihat Detail',
      order_priority: body.order_priority || adminBannersState.length + 1,
      is_active: body.is_active ?? true,
    };

    adminBannersState = [...adminBannersState, newBanner];

    return HttpResponse.json(
      {
        success: true,
        message: 'Slide banner baru berhasil ditambahkan.',
        data: newBanner,
        server_time: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.put('*/api/v1/admin/banners/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<AdminBannerItem>;

    adminBannersState = adminBannersState.map((b) => (b.id === id ? { ...b, ...body } : b));

    const updated = adminBannersState.find((b) => b.id === id);

    return HttpResponse.json({
      success: true,
      message: `Slide banner #${id} berhasil diperbarui.`,
      data: updated,
      server_time: new Date().toISOString(),
    });
  }),

  http.delete('*/api/v1/admin/banners/:id', ({ params }) => {
    const id = Number(params.id);
    adminBannersState = adminBannersState.filter((b) => b.id !== id);

    return HttpResponse.json({
      success: true,
      message: `Slide banner #${id} berhasil dihapus.`,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/banners/reorder', async ({ request }) => {
    const body = (await request.json()) as { banner_ids: number[] };
    const orderMap = new Map<number, number>();
    body.banner_ids.forEach((id, index) => {
      orderMap.set(id, index + 1);
    });

    adminBannersState = adminBannersState.map((b) => ({
      ...b,
      order_priority: orderMap.get(b.id) ?? b.order_priority,
    }));

    return HttpResponse.json({
      success: true,
      message: 'Urutan prioritas slide banner berhasil disimpan.',
      server_time: new Date().toISOString(),
    });
  }),

  // 8. Users List, Detail & Role Update
  http.get('*/api/v1/admin/users', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const role = url.searchParams.get('role') || 'all';
    const phoneLocked = url.searchParams.get('phone_locked') || 'all';

    let filtered = [...adminUsersState];

    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.phone_number && u.phone_number.includes(search))
      );
    }

    if (role !== 'all') {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (phoneLocked === 'locked') {
      filtered = filtered.filter((u) => u.is_phone_locked);
    } else if (phoneLocked === 'unlocked') {
      filtered = filtered.filter((u) => !u.is_phone_locked);
    }

    const totalUsersCount = adminUsersState.length;
    const superAdminCount = adminUsersState.filter((u) => u.role === 'super_admin').length;
    const lockedPhoneCount = adminUsersState.filter((u) => u.is_phone_locked).length;

    return HttpResponse.json({
      success: true,
      message: 'Daftar pengguna terdaftar berhasil dimuat.',
      data: filtered,
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 20,
        to: filtered.length,
        total: filtered.length,
        summary: {
          total_users: totalUsersCount,
          super_admin_count: superAdminCount,
          locked_phone_count: lockedPhoneCount,
          customer_count: Math.max(0, totalUsersCount - superAdminCount),
        },
      },
      server_time: new Date().toISOString(),
    });
  }),

  http.get('*/api/v1/admin/users/:id', ({ params }) => {
    const id = Number(params.id);
    const user = adminUsersState.find((u) => u.id === id);

    if (!user) {
      return HttpResponse.json(
        {
          success: false,
          message: `Pengguna #${id} tidak ditemukan.`,
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Detail pengguna berhasil dimuat.',
      data: {
        ...user,
        total_orders_count: user.total_orders_count ?? 2,
        total_paid_transactions: user.total_paid_transactions ?? 2,
        recent_orders: [
          {
            order_id: 'SNM-TKT-849201',
            order_type: 'ticket',
            item_title: 'Sebelum Pagi Datang (Premiere Jakarta)',
            net_amount: 110000,
            payment_status: 'paid',
            created_at: '2026-09-28T14:15:30Z',
          },
          {
            order_id: 'SNM-VOD-930219',
            order_type: 'movie_rental',
            item_title: 'Laut Bercerita (VoD Rental)',
            net_amount: 35000,
            payment_status: 'paid',
            created_at: '2026-09-15T10:00:00Z',
          },
        ],
        recent_ticket_transactions: [
          {
            id: 849201,
            order_id: 'SNM-TKT-849201',
            event_title: 'Sebelum Pagi Datang (Premiere Jakarta)',
            event_slug: 'sebelum-pagi-datang',
            ticket_code: 'TKT-849201',
            ticket_quantity: 2,
            gross_amount: 110000,
            net_amount: 110000,
            payment_status: 'paid',
            checkin_status: 'checked_in',
            paid_at: '2026-09-28T14:15:30Z',
            created_at: '2026-09-28T14:15:30Z',
          },
        ],
        recent_movie_transactions: [
          {
            id: 930219,
            order_id: 'SNM-VOD-930219',
            movie_title: 'Laut Bercerita (VoD Rental)',
            movie_slug: 'laut-bercerita',
            gross_amount: 35000,
            net_amount: 35000,
            payment_status: 'paid',
            paid_at: '2026-09-15T10:00:00Z',
            created_at: '2026-09-15T10:00:00Z',
          },
        ],
        active_movie_access: [
          {
            id: 1,
            movie_id: 10,
            movie_title: 'Laut Bercerita (VoD Rental)',
            movie_slug: 'laut-bercerita',
            rental_start_at: '2026-09-15T10:00:00Z',
            rental_expires_at: '2026-09-17T10:00:00Z',
            remaining_hours: 32.5,
            access_status: 'active',
          },
        ],
      },
      server_time: new Date().toISOString(),
    });
  }),

  http.put('*/api/v1/admin/users/:id/role', async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as { role: 'customer' | 'super_admin' };
    const index = adminUsersState.findIndex((u) => u.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          message: `Pengguna #${id} tidak ditemukan.`,
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    adminUsersState[index] = {
      ...adminUsersState[index],
      role: body.role,
    };

    return HttpResponse.json({
      success: true,
      message: `Peran pengguna berhasil diperbarui menjadi ${body.role.toUpperCase()}.`,
      data: adminUsersState[index],
      server_time: new Date().toISOString(),
    });
  }),

  // 9. Mobile Scanner Validation (validateTicketQR)
  http.post('*/api/v1/admin/tickets/validate', async ({ request }) => {
    const body = (await request.json()) as { qr_hash: string; device_info?: string };
    const hash = body.qr_hash?.trim();

    if (!hash) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Kode QR kosong atau tidak dapat terbaca.',
          server_time: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (scannedQrRecords.has(hash)) {
      return HttpResponse.json(
        {
          success: false,
          message: `PERINGATAN: Tiket ini SUDAH DIGUNAKAN (Double Check-in terdeteksi)!`,
          server_time: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    if (hash.toLowerCase().includes('presale')) {
      return HttpResponse.json(
        {
          success: false,
          message:
            'Tiket ini adalah tiket Presale Bioskop Komersial (XXI/CGV). Tiket presale wajib dicetak fisik di Kiosk bioskop mitra menggunakan kode booking, tidak dapat di-scan di gerbang masuk Sinemus.',
          server_time: new Date().toISOString(),
        },
        { status: 422 }
      );
    }

    const matchedResponse = mockScannerValidResponses[hash];

    if (matchedResponse) {
      scannedQrRecords.add(hash);
      return HttpResponse.json({
        success: true,
        message: 'Tiket valid! Penonton berhasil check-in ke venue.',
        data: {
          ...matchedResponse,
          scanned_at: new Date().toISOString(),
        },
        server_time: new Date().toISOString(),
      });
    }

    if (hash.startsWith('SNM-') || hash.startsWith('QR-') || hash.startsWith('TKT-')) {
      scannedQrRecords.add(hash);
      return HttpResponse.json({
        success: true,
        message: 'Tiket valid! Penonton berhasil check-in ke venue.',
        data: {
          ticket_code: hash,
          event_title: 'IMTIHAN (Premiere + Q&A Sutradara)',
          buyer_name: 'Penonton Terverifikasi',
          seating_type: 'assigned_seating',
          ticket_quantity: 1,
          seat_codes: ['B5'],
          checkin_status: 'checked_in',
          venue_name: 'Auditorium IFI Thamrin',
          studio_name: 'Studio 1',
          scanned_at: new Date().toISOString(),
        },
        server_time: new Date().toISOString(),
      });
    }

    return HttpResponse.json(
      {
        success: false,
        message: 'QR Code tidak valid atau bukan merupakan tiket resmi Sinemus.',
        server_time: new Date().toISOString(),
      },
      { status: 404 }
    );
  }),

  // 10. Presale Fulfillment & Smart Ingest
  http.get('*/api/v1/admin/schedules/:schedule_id/fulfillment', () => {
    return HttpResponse.json({
      success: true,
      message: 'Daftar pesanan presale berhasil dimuat.',
      data: fulfillmentOrdersState,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/schedules/:schedule_id/smart-ingest/preview', async () => {
    return HttpResponse.json({
      success: true,
      message:
        'Ekstraksi Master PDF tiket bioskop berhasil. Silakan tinjau matriks kecocokan (4-Point Match).',
      data: mockSmartIngestPreview,
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/schedules/:schedule_id/smart-ingest/confirm', async ({ request }) => {
    const body = (await request.json()) as { approved_items: Array<{ transaction_id: number }> };
    const count = body.approved_items?.length || 0;

    return HttpResponse.json({
      success: true,
      message: `${count} tiket bioskop berhasil diinjeksi dan notifikasi telah dikirim via Queue.`,
      data: {
        fulfilled_count: count,
        dispatched_notifications_count: count,
      },
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/transactions/:id/inject-cinema-ticket', () => {
    return HttpResponse.json({
      success: true,
      message: 'Karcis bioskop berhasil diinjeksi ke pesanan penonton.',
      data: {
        order_id: 'SNM-TKT-8492',
        fulfillment_status: 'fulfilled',
        cinema_booking_code: 'MTX-849201',
        cinema_passcode: '382910',
        qr_image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
        notes: 'Cetak mandiri di Kiosk XXI',
        fulfilled_at: new Date().toISOString(),
      },
      server_time: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/admin/schedules/:schedule_id/bulk-inject-tickets', () => {
    return HttpResponse.json({
      success: true,
      message: 'Job injeksi massal tiket bioskop berhasil dijadwalkan ke queue worker.',
      data: {
        job_id: 'job-bulk-inject-8492',
        status: 'completed',
        total_records_queued: 12,
      },
      server_time: new Date().toISOString(),
    });
  }),

  // Cloudflare Stream UID Verification Gateway
  http.post('*/api/v1/admin/cloudflare/stream/verify', async ({ request }) => {
    const body = (await request.json()) as { uid?: string };
    const uid = body?.uid?.trim().toLowerCase() || '';

    // If starts with 00000000 or invalid hex, treat as not found in Cloudflare
    if (!/^[a-f0-9]{32}$/.test(uid) || uid.startsWith('00000000')) {
      return HttpResponse.json(
        {
          success: false,
          message:
            'Video tidak ditemukan di akun Cloudflare Stream Sinemus. Pastikan UID sudah benar dan telah diunggah ke dashboard.',
          data: null,
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Video Cloudflare Stream berhasil diverifikasi.',
      data: {
        uid,
        status: 'ready',
        is_ready: true,
        duration_seconds: 6840,
        formatted_duration: '1j 54m 0d',
        thumbnail_url: `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?time=2s&height=240`,
        preview_iframe_url: `https://iframe.videodelivery.net/${uid}`,
        playback_hls_url: `https://videodelivery.net/${uid}/manifest/video.m3u8`,
        meta: {
          width: 1920,
          height: 1080,
          size_bytes: 84920194,
        },
      },
      server_time: new Date().toISOString(),
    });
  }),

  // Cloudflare Images Direct Upload Gateway
  http.post('*/api/v1/admin/cloudflare/images/direct-upload', () => {
    const mockImageId = `cf-img-${Date.now().toString(36)}`;
    return HttpResponse.json({
      success: true,
      message: 'Sesi unggah Cloudflare Images berhasil diterbitkan.',
      data: {
        image_id: mockImageId,
        upload_url: `https://upload.imagedelivery.net/mock-upload-${mockImageId}`,
        delivery_url: `https://imagedelivery.net/sinemus-account-hash/${mockImageId}/public`,
      },
      server_time: new Date().toISOString(),
    });
  }),

  // Mock Cloudflare Images Direct Upload Binary Target
  http.post('https://upload.imagedelivery.net/*', () => {
    return HttpResponse.json({
      success: true,
      result: {
        id: `cf-img-${Date.now().toString(36)}`,
        filename: 'asset.webp',
        uploaded: new Date().toISOString(),
      },
    });
  }),

  // Cloudflare Images Delete Gateway
  http.delete('*/api/v1/admin/cloudflare/images/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: 'Berkas gambar berhasil dihapus dari Cloudflare Images.',
      data: {
        image_id: params.id,
      },
      server_time: new Date().toISOString(),
    });
  }),

  // 19. Admin Settings & System Controls
  http.get('*/api/v1/admin/settings', () => {
    return HttpResponse.json({
      success: true,
      message: 'Pengaturan sistem berhasil diambil.',
      data: systemSettingsState,
      server_time: new Date().toISOString(),
    });
  }),

  http.put('*/api/v1/admin/settings/business-policies', async ({ request }) => {
    const body = (await request.json()) as typeof mockSystemSettings.business_policies;
    systemSettingsState = {
      ...systemSettingsState,
      business_policies: { ...body },
      audit_meta: {
        ...systemSettingsState.audit_meta,
        last_updated_at: new Date().toISOString(),
      },
    };

    return HttpResponse.json({
      success: true,
      message: 'Kebijakan bisnis dan transaksi berhasil diperbarui.',
      data: systemSettingsState.business_policies,
      server_time: new Date().toISOString(),
    });
  }),

  http.put('*/api/v1/admin/settings/public-contact', async ({ request }) => {
    const body = (await request.json()) as typeof mockSystemSettings.public_contact;
    systemSettingsState = {
      ...systemSettingsState,
      public_contact: { ...body },
      audit_meta: {
        ...systemSettingsState.audit_meta,
        last_updated_at: new Date().toISOString(),
      },
    };

    return HttpResponse.json({
      success: true,
      message: 'Layanan kontak publik dan helpdesk berhasil diperbarui.',
      data: systemSettingsState.public_contact,
      server_time: new Date().toISOString(),
    });
  }),

  http.put('*/api/v1/admin/settings/emergency-controls', async ({ request }) => {
    const body = (await request.json()) as typeof mockSystemSettings.emergency_controls;
    systemSettingsState = {
      ...systemSettingsState,
      emergency_controls: { ...body },
      audit_meta: {
        ...systemSettingsState.audit_meta,
        last_updated_at: new Date().toISOString(),
      },
    };

    return HttpResponse.json({
      success: true,
      message: 'Kontrol darurat dan status pemeliharaan berhasil diperbarui.',
      data: systemSettingsState.emergency_controls,
      server_time: new Date().toISOString(),
    });
  }),

  // Public Settings
  http.get('*/api/v1/public/settings', () => {
    return HttpResponse.json({
      success: true,
      message: 'Konfigurasi publik berhasil dimuat.',
      data: {
        public_contact: systemSettingsState.public_contact,
        emergency_controls: systemSettingsState.emergency_controls,
        business_policies: systemSettingsState.business_policies,
        server_time: new Date().toISOString(),
      },
      server_time: new Date().toISOString(),
    });
  }),
];
