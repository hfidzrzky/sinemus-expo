import type { EventSummary, EventDetail, ScheduleSeatMap, SeatItem } from '../types';

export const MOCK_EVENTS: EventSummary[] = [
  {
    id: 1,
    slug: 'cinta-dan-sejarah-xxi-plaza-senayan',
    title: 'CINTA DAN SEJARAH (Special Cinema Premiere)',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80',
    venue_name: 'Cinema XXI Plaza Senayan',
    city: 'Jakarta Pusat',
    earliest_show_time: '2026-11-28T19:00:00+07:00',
    starting_price: 50000,
    formatted_starting_price: 'Rp 50.000',
    event_type: 'regular',
    seating_type: 'assigned_seating',
    cinema_partner: 'Cinema 21 / XXI',
    remaining_seats_count: 12,
    is_featured: true,
    genre: ['Drama', 'Romansa', 'Sejarah'],
    duration_minutes: 125,
    release_year: 2024,
    age_rating: '13+',
  },
  {
    id: 2,
    slug: 'imtihan-ifi-thamrin',
    title: 'IMTIHAN (Premiere + Q&A Sutradara)',
    poster_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80',
    venue_name: 'Auditorium IFI Thamrin',
    city: 'Jakarta Pusat',
    earliest_show_time: '2026-11-29T15:30:00+07:00',
    starting_price: 35000,
    formatted_starting_price: 'Rp 35.000',
    event_type: 'regular',
    seating_type: 'assigned_seating',
    remaining_seats_count: 6,
    is_featured: true,
    genre: ['Drama', 'Religi'],
    duration_minutes: 105,
    release_year: 2024,
    age_rating: 'SU',
  },
  {
    id: 3,
    slug: 'mengejar-embun-cgv-gi',
    title: 'MENGEJAR EMBUN KE UJUNG SENJA',
    poster_url: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1280&q=80',
    venue_name: 'CGV Grand Indonesia',
    city: 'Jakarta Pusat',
    earliest_show_time: '2026-12-05T18:45:00+07:00',
    starting_price: 50000,
    formatted_starting_price: 'Rp 50.000',
    event_type: 'regular',
    seating_type: 'assigned_seating',
    cinema_partner: 'CGV Cinemas',
    remaining_seats_count: 24,
    genre: ['Petualangan', 'Drama'],
    duration_minutes: 118,
    release_year: 2023,
    age_rating: '13+',
  },
  {
    id: 4,
    slug: 'suara-dari-hilir-ifi-bandung',
    title: 'SUARA DARI HILIR (Dokumenter Spesial)',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1280&q=80',
    venue_name: 'Institut Français Indonesia',
    city: 'Bandung',
    earliest_show_time: '2026-12-06T16:00:00+07:00',
    starting_price: 30000,
    formatted_starting_price: 'Rp 30.000',
    event_type: 'regular',
    seating_type: 'general_admission',
    remaining_seats_count: 18,
    genre: ['Dokumenter', 'Lingkungan'],
    duration_minutes: 88,
    release_year: 2024,
    age_rating: 'SU',
  },
  {
    id: 5,
    slug: 'nyanyian-senja-misbar',
    title: 'NYANYIAN SENJA (Screening Terbuka)',
    poster_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1280&q=80',
    venue_name: 'Bioskop Mini Misbar',
    city: 'Purbalingga',
    earliest_show_time: '2026-12-10T19:30:00+07:00',
    starting_price: 25000,
    formatted_starting_price: 'Rp 25.000',
    event_type: 'regular',
    seating_type: 'general_admission',
    remaining_seats_count: 15,
    genre: ['Komedi', 'Drama'],
    duration_minutes: 95,
    release_year: 2023,
    age_rating: '17+',
  },
];

export const MOCK_EVENT_DETAILS: EventDetail[] = [
  {
    id: 1,
    slug: 'cinta-dan-sejarah-xxi-plaza-senayan',
    title: 'CINTA DAN SEJARAH (Special Cinema Premiere)',
    description:
      'Sebuah mahakarya sinema yang menelusuri lorong waktu perjuangan kemerdekaan melalui surat-surat cinta rahasia yang terkubur selama tujuh dekade. Menghadirkan sinematografi 35mm memukau dan tata suara surround 7.1 yang diproduksi khusus untuk pengalaman layar lebar.',
    synopsis_short:
      'Kisah romansa epik dua insan di tengah gejolak revolusi kemerdekaan yang terpisah oleh garis pertempuran.',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80',
    director: 'Baskara Mahendra Putra',
    cast: ['Reza Rahadian', 'Laura Basuki', 'Chicco Jerikho', 'Putri Marino'],
    genre: ['Drama', 'Romansa', 'Sejarah'],
    duration_minutes: 125,
    release_year: 2024,
    age_rating: '13+',
    cloudflare_teaser_uid: '5d5b376379fc387d9c9e32305193433d',
    venue_name: 'Cinema XXI Plaza Senayan',
    venue_address: 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Gelora, Tanah Abang',
    city: 'Jakarta Pusat',
    event_type: 'regular',
    seating_type: 'assigned_seating',
    cinema_partner: 'Cinema 21 / XXI',
    venues: [
      {
        id: 1,
        event_id: 1,
        venue_name: 'Cinema XXI Plaza Senayan',
        cinema_partner: 'Cinema 21 / XXI',
        venue_address: 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Gelora, Tanah Abang',
        city: 'Jakarta Pusat',
        google_maps_url: 'https://maps.google.com/?q=Cinema+XXI+Plaza+Senayan',
      },
      {
        id: 2,
        event_id: 1,
        venue_name: 'CGV Grand Indonesia',
        cinema_partner: 'CGV Cinemas',
        venue_address: 'Grand Indonesia West Mall Lt. 8, Jl. M.H. Thamrin No.1',
        city: 'Jakarta Pusat',
        google_maps_url: 'https://maps.google.com/?q=CGV+Grand+Indonesia',
      },
    ],
    schedules: [
      {
        id: 1001,
        event_venue_id: 1,
        venue: {
          id: 1,
          event_id: 1,
          venue_name: 'Cinema XXI Plaza Senayan',
          cinema_partner: 'Cinema 21 / XXI',
          venue_address: 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Gelora, Tanah Abang',
          city: 'Jakarta Pusat',
          google_maps_url: 'https://maps.google.com/?q=Cinema+XXI+Plaza+Senayan',
        },
        show_time: '2026-11-28T19:00:00+07:00',
        ticket_price: 50000,
        formatted_ticket_price: 'Rp 50.000',
        vip_ticket_price: 75000,
        formatted_vip_ticket_price: 'Rp 75.000',
        available_seats_count: 124,
        total_seats: 140,
        studio_name: 'Studio 1 (XXI)',
      },
      {
        id: 1002,
        event_venue_id: 1,
        venue: {
          id: 1,
          event_id: 1,
          venue_name: 'Cinema XXI Plaza Senayan',
          cinema_partner: 'Cinema 21 / XXI',
          venue_address: 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Gelora, Tanah Abang',
          city: 'Jakarta Pusat',
          google_maps_url: 'https://maps.google.com/?q=Cinema+XXI+Plaza+Senayan',
        },
        show_time: '2026-11-28T21:30:00+07:00',
        ticket_price: 50000,
        formatted_ticket_price: 'Rp 50.000',
        vip_ticket_price: 75000,
        formatted_vip_ticket_price: 'Rp 75.000',
        available_seats_count: 134,
        total_seats: 140,
        studio_name: 'Studio 1 (XXI)',
      },
      {
        id: 1003,
        event_venue_id: 1,
        venue: {
          id: 1,
          event_id: 1,
          venue_name: 'Cinema XXI Plaza Senayan',
          cinema_partner: 'Cinema 21 / XXI',
          venue_address: 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Gelora, Tanah Abang',
          city: 'Jakarta Pusat',
          google_maps_url: 'https://maps.google.com/?q=Cinema+XXI+Plaza+Senayan',
        },
        show_time: '2026-11-28T20:15:00+07:00',
        ticket_price: 55000,
        formatted_ticket_price: 'Rp 55.000',
        vip_ticket_price: 80000,
        formatted_vip_ticket_price: 'Rp 80.000',
        available_seats_count: 50,
        total_seats: 80,
        studio_name: 'Studio 2 (XXI)',
      },
      {
        id: 1004,
        event_venue_id: 1,
        venue: {
          id: 1,
          event_id: 1,
          venue_name: 'Cinema XXI Plaza Senayan',
          cinema_partner: 'Cinema 21 / XXI',
          venue_address: 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Gelora, Tanah Abang',
          city: 'Jakarta Pusat',
          google_maps_url: 'https://maps.google.com/?q=Cinema+XXI+Plaza+Senayan',
        },
        show_time: '2026-11-29T16:00:00+07:00',
        ticket_price: 55000,
        formatted_ticket_price: 'Rp 55.000',
        available_seats_count: 78,
        total_seats: 80,
        studio_name: 'Studio 2 (XXI)',
      },
      {
        id: 1005,
        event_venue_id: 2,
        venue: {
          id: 2,
          event_id: 1,
          venue_name: 'CGV Grand Indonesia',
          cinema_partner: 'CGV Cinemas',
          venue_address: 'Grand Indonesia West Mall Lt. 8, Jl. M.H. Thamrin No.1',
          city: 'Jakarta Pusat',
          google_maps_url: 'https://maps.google.com/?q=CGV+Grand+Indonesia',
        },
        show_time: '2026-11-29T19:00:00+07:00',
        ticket_price: 60000,
        formatted_ticket_price: 'Rp 60.000',
        vip_ticket_price: 90000,
        formatted_vip_ticket_price: 'Rp 90.000',
        available_seats_count: 65,
        total_seats: 80,
        studio_name: 'Audi 3 Starium',
      },
    ],
  },
  {
    id: 2,
    slug: 'imtihan-ifi-thamrin',
    title: 'IMTIHAN (Premiere + Q&A Sutradara)',
    description:
      'Penayangan eksklusif film pemenang kategori dokumenter terbaik Festival Film Tempo, diikuti sesi diskusi hangat dan tanya jawab interaktif bersama sutradara dan produser eksekutif.',
    synopsis_short:
      'Pergulatan sebuah keluarga santri di pedalaman Jawa Timur dalam mempertahankan tradisi di tengah pusaran industrialisasi pabrik semen.',
    poster_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80',
    director: 'Ahmad Fauzi Ridwan',
    cast: ['K.H. Syarifuddin', 'Nyai Siti Aminah', 'Gus Wildan'],
    cloudflare_teaser_uid: null,
    venue_name: 'Auditorium IFI Thamrin',
    venue_address: 'Jl. M.H. Thamrin No.20, Gondangdia, Menteng',
    city: 'Jakarta Pusat',
    event_type: 'regular',
    seating_type: 'assigned_seating',
    schedules: [
      {
        id: 2001,
        show_time: '2026-11-29T15:30:00+07:00',
        ticket_price: 35000,
        formatted_ticket_price: 'Rp 35.000',
        available_seats_count: 6,
        total_seats: 56,
        studio_name: 'Auditorium Utama',
      },
      {
        id: 2002,
        show_time: '2026-11-29T19:00:00+07:00',
        ticket_price: 35000,
        formatted_ticket_price: 'Rp 35.000',
        available_seats_count: 22,
        total_seats: 56,
        studio_name: 'Auditorium Utama',
      },
    ],
  },
  {
    id: 3,
    slug: 'mengejar-embun-cgv-gi',
    title: 'MENGEJAR EMBUN KE UJUNG SENJA',
    description:
      'Kisah road trip penuh kehangatan melintasi jalur selatan pulau Jawa mencari arti perpisahan dan penerimaan diri.',
    synopsis_short:
      'Dua sahabat lama bertemu kembali dalam perjalanan mobil tua melintasi pesisir pantai selatan.',
    poster_url: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1280&q=80',
    director: 'Arya Wicaksono',
    cast: ['Angga Yunanda', 'Shenina Cinnamon', 'Dion Wiyoko'],
    cloudflare_teaser_uid: '5d5b376379fc387d9c9e32305193433d',
    venue_name: 'CGV Grand Indonesia',
    venue_address: 'Grand Indonesia West Mall Lt. 8, Jl. M.H. Thamrin No.1',
    city: 'Jakarta Pusat',
    event_type: 'regular',
    seating_type: 'assigned_seating',
    cinema_partner: 'CGV Cinemas',
    schedules: [
      {
        id: 3001,
        show_time: '2026-12-05T18:45:00+07:00',
        ticket_price: 50000,
        formatted_ticket_price: 'Rp 50.000',
        available_seats_count: 24,
        total_seats: 56,
        studio_name: 'Audi 3 Starium',
      },
    ],
  },
  {
    id: 4,
    slug: 'suara-dari-hilir-ifi-bandung',
    title: 'SUARA DARI HILIR (Dokumenter Spesial)',
    description:
      'Dokumenter investigatif mendalam tentang perjuangan komunitas nelayan bantaran sungai Citarum.',
    synopsis_short:
      'Potret kehidupan nelayan muara sungai Citarum menghadapi arus modernisasi zaman.',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1280&q=80',
    director: 'Maya Lestari',
    cast: ['Komunitas Nelayan Muara Gembong', 'Dr. Budi Santoso (Peneliti Hidrologi)'],
    cloudflare_teaser_uid: null,
    venue_name: 'Institut Français Indonesia',
    venue_address: 'Jl. Purnawarman No.32, Babakan Ciamis, Sumur Bandung',
    city: 'Bandung',
    event_type: 'regular',
    seating_type: 'general_admission',
    schedules: [
      {
        id: 4001,
        show_time: '2026-12-06T16:00:00+07:00',
        ticket_price: 30000,
        formatted_ticket_price: 'Rp 30.000',
        available_seats_count: 18,
        total_seats: 50,
        studio_name: 'Ruang Teater IFI',
      },
    ],
  },
  {
    id: 5,
    slug: 'nyanyian-senja-misbar',
    title: 'NYANYIAN SENJA (Screening Terbuka)',
    description:
      'Pemutaran film layar tancap modern (Gerimis Bersama / Misbar) di bawah langit malam Purbalingga.',
    synopsis_short:
      'Di sebuah stasiun radio tua pedesaan, siaran malam membuka misteri masa lalu yang terkubur.',
    poster_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1280&q=80',
    director: 'Tito Pamungkas',
    cast: ['Whani Darmawan', 'Siti Fauziah'],
    cloudflare_teaser_uid: null,
    venue_name: 'Bioskop Mini Misbar',
    venue_address: 'Taman Kota Usman Janatin, Jl. Ahmad Yani No. 12',
    city: 'Purbalingga',
    event_type: 'regular',
    seating_type: 'general_admission',
    schedules: [
      {
        id: 5001,
        show_time: '2026-12-10T19:30:00+07:00',
        ticket_price: 25000,
        formatted_ticket_price: 'Rp 25.000',
        available_seats_count: 15,
        total_seats: 40,
        studio_name: 'Panggung Terbuka',
      },
    ],
  },
];

export function generateMockSeatMap(scheduleId: number): ScheduleSeatMap {
  const isSaturdayXXI = [1001, 1002].includes(scheduleId);
  const isSundayXXIorCGV = [1003, 1004, 3001].includes(scheduleId);

  const rows = isSaturdayXXI
    ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    : isSundayXXIorCGV
      ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
      : ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const cols = isSaturdayXXI ? 14 : isSundayXXIorCGV ? 10 : 8;
  const seats: SeatItem[] = [];

  let idCounter = scheduleId * 100;

  for (const row of rows) {
    for (let col = 1; col <= cols; col++) {
      idCounter++;
      const seatCode = `${row}${col}`;

      // Set some realistic booked/locked seats
      let status: 'available' | 'locked' | 'booked' | 'disabled' = 'available';

      if (scheduleId === 1001) {
        if (
          (row === 'D' && [5, 6, 7, 8, 9, 10].includes(col)) ||
          (row === 'E' && [6, 7, 8, 9].includes(col)) ||
          (row === 'F' && [7, 8].includes(col)) ||
          (row === 'C' && [3, 12].includes(col))
        ) {
          status = 'booked';
        } else if (row === 'C' && (col === 7 || col === 8)) {
          status = 'locked';
        }
      } else if (scheduleId === 1002) {
        if ((row === 'D' && [7, 8].includes(col)) || (row === 'E' && [6, 7, 8, 9].includes(col))) {
          status = 'booked';
        }
      } else if (isSundayXXIorCGV) {
        if (row === 'E' && (col === 4 || col === 5)) {
          status = 'booked';
        }
      }

      seats.push({
        id: idCounter,
        row_label: row,
        grid_column: col,
        seat_number: col,
        seat_code: seatCode,
        status,
        seat_type: (row === 'A' || row === 'B' ? 'vip' : 'standard') as 'standard' | 'vip',
      });
    }
  }

  return {
    schedule_id: scheduleId,
    rows,
    cols,
    ticket_price: scheduleId >= 1003 && scheduleId <= 1004 ? 55000 : 50000,
    seats,
  };
}
