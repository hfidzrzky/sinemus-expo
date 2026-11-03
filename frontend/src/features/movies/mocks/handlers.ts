import { http, HttpResponse } from 'msw';
import { MOCK_MOVIES, MOCK_MOVIE_DETAILS } from './fixtures';
import { getAdminMoviesState } from '../../admin/mocks/admin.handler';
import type { MovieRentalPayload, MovieDetail, MovieSummary } from '../types';

// Stateful in-memory rentals storage for interactive mock session
export const mockUserRentalsState = new Map<number, { rentalExpiresAt: string }>();

// Helper untuk mengambil detail film gabungan (MOCK_MOVIE_DETAILS + adminMoviesState)
function findMovieDetail(idOrSlug: string | number): MovieDetail | undefined {
  const identifier = String(idOrSlug);
  const found = MOCK_MOVIE_DETAILS.find(
    (m) => String(m.id) === identifier || m.slug === identifier
  );
  if (found) {
    return found;
  }

  const adminMovie = getAdminMoviesState().find(
    (m) => String(m.id) === identifier || m.slug === identifier
  );
  if (!adminMovie) {
    return undefined;
  }

  const isFree = adminMovie.access_model === 'free';
  const price = isFree ? 0 : adminMovie.rental_price;
  const genreString = Array.isArray(adminMovie.genre)
    ? adminMovie.genre.join(', ')
    : String(adminMovie.genre || '');

  return {
    id: adminMovie.id,
    slug: adminMovie.slug,
    title: adminMovie.title,
    synopsis: adminMovie.synopsis_full || adminMovie.synopsis,
    poster_url: adminMovie.poster_url,
    backdrop_url: adminMovie.backdrop_url,
    director: adminMovie.director,
    cast: adminMovie.cast,
    genre: genreString,
    duration_minutes: adminMovie.duration_minutes,
    price,
    formatted_price: isFree ? 'Akses Bebas' : adminMovie.formatted_rental_price,
    rental_duration_hours: adminMovie.active_rental_duration_hours || 48,
    access_model: adminMovie.access_model,
    cloudflare_trailer_uid: adminMovie.cloudflare_trailer_uid ?? null,
    access_status: isFree ? 'active' : 'locked',
    rental_expires_at: null,
    cloudflare_video_uid: adminMovie.cloudflare_video_uid,
    look_films: adminMovie.look_films,
    age_rating: adminMovie.age_rating,
    release_year: adminMovie.release_year,
  };
}

export const moviesHandlers = [
  // 1. Movies: VoD Online Streaming List Mock
  http.get('*/api/v1/movies', ({ request }) => {
    const url = new URL(request.url);
    const genre = url.searchParams.get('genre');
    const search = url.searchParams.get('search');
    const featured = url.searchParams.get('featured');

    // Ambil film yang terbit dari admin studio untuk disinkronkan ke katalog penonton
    const publishedAdminMovies = getAdminMoviesState().filter((m) => m.is_published);
    const adminSummaries: MovieSummary[] = publishedAdminMovies.map((m) => {
      const isFree = m.access_model === 'free';
      const genreString = Array.isArray(m.genre) ? m.genre.join(', ') : String(m.genre || '');
      return {
        id: m.id,
        slug: m.slug,
        title: m.title,
        synopsis_short: m.synopsis_short || m.synopsis.slice(0, 120),
        poster_url: m.poster_url,
        genre: genreString,
        duration_minutes: m.duration_minutes,
        price: isFree ? 0 : m.rental_price,
        formatted_price: isFree ? 'Akses Bebas' : m.formatted_rental_price,
        is_featured: m.is_featured,
        release_year: m.release_year,
        age_rating: m.age_rating,
        access_model: m.access_model,
      };
    });

    const mergedMap = new Map<number, MovieSummary>();
    for (const m of MOCK_MOVIES) {
      mergedMap.set(m.id, m);
    }
    for (const m of adminSummaries) {
      mergedMap.set(m.id, m);
    }

    let filtered = Array.from(mergedMap.values());

    if (genre && genre !== 'Semua') {
      filtered = filtered.filter((m) => m.genre.toLowerCase().includes(genre.toLowerCase()));
    }

    if (featured === 'true') {
      filtered = filtered.filter((m) => m.is_featured);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((m) => m.title.toLowerCase().includes(q));
    }

    return HttpResponse.json({
      success: true,
      message: 'Katalog film VoD berhasil diambil.',
      data: filtered,
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 12,
        to: filtered.length,
        total: filtered.length,
      },
      server_time: new Date().toISOString(),
    });
  }),

  // 2. Movies: Detail Film VoD by id or slug (Stateful Access Status)
  http.get('*/api/v1/movies/:idOrSlug', ({ params }) => {
    const { idOrSlug } = params;
    const found = findMovieDetail(String(idOrSlug));

    if (!found) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Film VoD tidak ditemukan.',
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const isFree = found.access_model === 'free';
    const rental = mockUserRentalsState.get(found.id);
    const isRented = !!rental;

    const dynamicDetail: MovieDetail = {
      ...found,
      access_status: isFree ? 'active' : isRented ? 'active' : 'locked',
      rental_expires_at: isFree ? null : rental ? rental.rentalExpiresAt : null,
      cloudflare_video_uid: isFree || isRented ? found.cloudflare_video_uid : null,
    };

    return HttpResponse.json({
      success: true,
      message: 'Detail film berhasil diambil.',
      data: dynamicDetail,
      server_time: new Date().toISOString(),
    });
  }),

  // 3. Movies: Rent Movie Initiation Mock
  http.post('*/api/v1/movies/:id/rent', async ({ params, request }) => {
    const movieId = Number(params.id);
    const body = ((await request.json().catch(() => ({}))) || {}) as MovieRentalPayload;

    const found = findMovieDetail(movieId);
    if (!found) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Film VoD yang akan disewa tidak ditemukan.',
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (found.access_model === 'free') {
      return HttpResponse.json(
        {
          success: false,
          message: 'Film ini berakses gratis dan tidak memerlukan transaksi sewa.',
          server_time: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Check voucher discount
    let discountAmount = 0;
    if (body.voucher_code) {
      const code = body.voucher_code.toUpperCase().trim();
      if (code === 'SINEMUSDISKON' || code === 'DISKON10') {
        discountAmount = Math.min(10000, found.price);
      } else if (code === 'HEMAT50') {
        discountAmount = Math.round(found.price * 0.5);
      }
    }

    const netAmount = Math.max(0, found.price - discountAmount);
    const orderId = `SNM-VOD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const rentalDurationHours = found.rental_duration_hours || 48;
    const expiresAt = new Date(Date.now() + rentalDurationHours * 3600 * 1000).toISOString();

    // Set state to active in memory
    mockUserRentalsState.set(movieId, {
      rentalExpiresAt: expiresAt,
    });

    return HttpResponse.json({
      success: true,
      message: 'Pesanan sewa film berhasil diinisiasi.',
      data: {
        order_id: orderId,
        snap_token: `mock-snap-vod-${movieId}-${Date.now()}`,
        movie_title: found.title,
        gross_amount: found.price,
        discount_amount: discountAmount,
        net_amount: netAmount,
        rental_duration_hours: rentalDurationHours,
      },
      server_time: new Date().toISOString(),
    });
  }),

  // 4. Movies: Stream Access Session (RS256 Signed Token) Mock
  http.get('*/api/v1/movies/:id/stream', ({ params }) => {
    const movieId = Number(params.id);
    const found = findMovieDetail(movieId);

    if (!found) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Film tidak ditemukan.',
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const isFree = found.access_model === 'free';
    const rental = mockUserRentalsState.get(movieId);

    if (!isFree && !rental) {
      return HttpResponse.json(
        {
          success: false,
          message: `Anda belum menyewa film ini atau masa sewa telah berakhir. Silakan lakukan sewa untuk menonton.`,
          server_time: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    const expiresAt = rental
      ? rental.rentalExpiresAt
      : new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const remainingSeconds = Math.max(
      60,
      Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
    );
    const mockToken = `mock-signed-jwt-token-for-movie-${movieId}`;

    return HttpResponse.json({
      success: true,
      message: 'Sesi pemutaran film berhasil diverifikasi.',
      data: {
        playback_url: `https://videodelivery.net/${mockToken}/manifest/video.m3u8`,
        preview_iframe_url: `https://iframe.videodelivery.net/${mockToken}`,
        signed_token: mockToken,
        rental_expires_at: expiresAt,
        remaining_seconds: remainingSeconds,
      },
      server_time: new Date().toISOString(),
    });
  }),
];
