import { http, HttpResponse } from 'msw';
import { MOCK_EVENTS, MOCK_EVENT_DETAILS, generateMockSeatMap } from './fixtures';

const MOCK_FORMAT_LABELS: Record<string, string> = {
  regular: 'Screening Komunitas',
  presale_cinema: 'Presale Bioskop Komersial',
};

function getMockActiveCities(): string[] {
  return Array.from(new Set(MOCK_EVENTS.map((e) => e.city).filter(Boolean))).sort();
}

function getMockActiveFormats() {
  const typeCounts: Record<string, number> = {};
  MOCK_EVENTS.forEach((e) => {
    if (e.event_type) {
      typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
    }
  });

  return Object.entries(MOCK_FORMAT_LABELS).map(([value, label]) => ({
    value,
    label,
    total_events: typeCounts[value] || 0,
  }));
}

export const eventsHandlers = [
  // Events: List with City, EventType, and Search Query Filtering
  http.get('*/api/v1/events', ({ request }) => {
    const url = new URL(request.url);
    const city = url.searchParams.get('city');
    const eventType = url.searchParams.get('event_type');
    const search = url.searchParams.get('search');

    let filtered = [...MOCK_EVENTS];

    if (city && city !== 'Semua Kota') {
      filtered = filtered.filter((e) => e.city.toLowerCase() === city.toLowerCase());
    }

    if (eventType && eventType !== 'all') {
      filtered = filtered.filter((e) => e.event_type === eventType);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue_name.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q)
      );
    }

    // Prioritaskan event pilihan utama (featured) di urutan teratas
    filtered.sort((a, b) => {
      const featA = a.is_featured ? 1 : 0;
      const featB = b.is_featured ? 1 : 0;
      if (featA !== featB) return featB - featA;
      return b.id - a.id;
    });

    return HttpResponse.json({
      success: true,
      message: 'Daftar jadwal screening berhasil diambil.',
      data: filtered,
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: filtered.length,
        total: filtered.length,
        available_cities: getMockActiveCities(),
        available_formats: getMockActiveFormats(),
      },
      server_time: new Date().toISOString(),
    });
  }),

  // Events: Dynamic Cities
  http.get('*/api/v1/events/cities', () => {
    return HttpResponse.json({
      success: true,
      message: 'Daftar kota event aktif berhasil diambil',
      data: getMockActiveCities(),
      server_time: new Date().toISOString(),
    });
  }),

  // Events: Dynamic Formats
  http.get('*/api/v1/events/formats', () => {
    return HttpResponse.json({
      success: true,
      message: 'Daftar format acara aktif berhasil diambil',
      data: getMockActiveFormats(),
      server_time: new Date().toISOString(),
    });
  }),

  // Events: Detail by id or slug
  http.get('*/api/v1/events/:idOrSlug', ({ params }) => {
    const { idOrSlug } = params;
    const found = MOCK_EVENT_DETAILS.find(
      (e) => String(e.id) === String(idOrSlug) || e.slug === String(idOrSlug)
    );

    if (!found) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Event screening tidak ditemukan.',
          server_time: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Detail event berhasil diambil.',
      data: found,
      server_time: new Date().toISOString(),
    });
  }),

  // Schedules: Seat Map & Live Status
  http.get('*/api/v1/schedules/:scheduleId/seats', ({ params }) => {
    const scheduleId = Number(params.scheduleId) || 1001;
    const seatMap = generateMockSeatMap(scheduleId);

    return HttpResponse.json({
      success: true,
      message: 'Denah kursi berhasil diambil.',
      data: seatMap,
      server_time: new Date().toISOString(),
    });
  }),
];
