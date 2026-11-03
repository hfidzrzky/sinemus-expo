import type { BannerItem } from '../types';

export const MOCK_BANNERS: BannerItem[] = [
  {
    id: 1,
    title: 'CINTA DAN SEJARAH',
    subtitle:
      'Penayangan Perdana November 2026 di Cinema XXI Plaza Senayan. Jangan lewatkan karya monumental sutradara peraih penghargaan festival.',
    badge_text: 'PROMO SPESIAL / PREMIERE CDS',
    image_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=80',
    display_mode: 'rich_content',
    link_type: 'event',
    event_slug: 'cinta-dan-sejarah-xxi-plaza-senayan',
    button_text: 'Beli Tiket Presale',
    order_priority: 1,
  },
  {
    id: 2,
    title: 'IMTIHAN',
    subtitle:
      'Special Premiere + Sesi Diskusi Tanya Jawab (Q&A) langsung bersama Sutradara & Para Pemeran Utama.',
    badge_text: 'COMMUNITY PREMIERE',
    image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80',
    display_mode: 'rich_content',
    link_type: 'event',
    event_slug: 'imtihan-ifi-thamrin',
    button_text: 'Reservasi Kursi',
    order_priority: 2,
  },
  {
    id: 3,
    title: 'Streaming VoD: Cinta dan Sejarah',
    subtitle:
      'Tonton streaming film bioskop resmi Sinemus dengan kualitas Full HD dari mana saja secara fleksibel.',
    badge_text: 'SEWA FILM ONLINE',
    image_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&q=80',
    display_mode: 'rich_content',
    link_type: 'movie',
    movie_slug: 'cinta-dan-sejarah',
    button_text: 'Sewa Film Sekarang',
    order_priority: 3,
  },
];
