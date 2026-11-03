<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\Event;
use App\Models\Movie;
use Illuminate\Database\Seeder;

class BannerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed master Event agar foreign key event_id valid
        $eventCds = Event::firstOrCreate(
            ['slug' => 'cinta-dan-sejarah-xxi-plaza-senayan'],
            [
                'event_type' => 'regular',
                'seating_type' => 'assigned_seating',
                'title' => 'CINTA DAN SEJARAH (Special Cinema Premiere)',
                'description' => 'Penayangan Perdana November 2026 di Cinema XXI Plaza Senayan. Jangan lewatkan karya monumental sutradara peraih festival.',
                'synopsis_short' => 'Kisah romansa epik dua insan di tengah revolusi kemerdekaan.',
                'poster_path' => 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80',
                'director' => 'Arya Suryakusuma',
                'cast' => ['Reza Rahadian', 'Laura Basuki'],
                'venue_name' => 'Cinema XXI Plaza Senayan',
                'cinema_partner' => 'Cinema 21 / XXI',
                'venue_address' => 'Plaza Senayan Lantai 5, Jl. Asia Afrika No. 8, Gelora, Jakarta Pusat',
                'city' => 'Jakarta Pusat',
                'target_screening_month' => 'November 2026',
                'is_active' => true,
                'is_featured' => true,
            ]
        );

        $eventImtihan = Event::firstOrCreate(
            ['slug' => 'imtihan-ifi-thamrin'],
            [
                'event_type' => 'regular',
                'seating_type' => 'assigned_seating',
                'title' => 'IMTIHAN (Premiere + Q&A Sutradara)',
                'description' => 'Special Premiere + Sesi Diskusi Tanya Jawab (Q&A) langsung bersama Sutradara & Para Pemeran Utama.',
                'synopsis_short' => 'Pergulatan sebuah keluarga santri dalam mempertahankan kelestarian tanah leluhur.',
                'poster_path' => 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80',
                'director' => 'Fajar Nugros',
                'cast' => ['Muhammad Khan', 'Siti Fauziah'],
                'venue_name' => 'Auditorium IFI Thamrin',
                'cinema_partner' => 'Institut Français Indonesia',
                'venue_address' => 'Jl. M.H. Thamrin No. 20, Gondangdia, Menteng, Jakarta Pusat',
                'city' => 'Jakarta Pusat',
                'target_screening_month' => 'November 2026',
                'is_active' => true,
                'is_featured' => true,
            ]
        );

        // 2. Seed master Movie agar foreign key movie_id valid
        $movieCds = Movie::firstOrCreate(
            ['slug' => 'cinta-dan-sejarah'],
            [
                'title' => 'CINTA DAN SEJARAH',
                'synopsis' => 'Kisah romansa epik dua insan di tengah gejolak revolusi kemerdekaan yang terpisah oleh garis pertempuran.',
                'poster_path' => 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80',
                'director' => 'Arya Suryakusuma',
                'cast' => ['Reza Rahadian', 'Laura Basuki'],
                'genre' => 'Drama Sejarah',
                'age_rating' => '13+',
                'access_model' => 'rental',
                'duration_minutes' => 115,
                'price' => 30000,
                'rental_duration_hours' => 48,
                'cloudflare_video_uid' => 'cf-video-uid-cinta-dan-sejarah12',
                'release_year' => 2026,
                'is_published' => true,
                'is_featured' => true,
            ]
        );

        // 3. Seed Banners Carousel Beranda
        $banners = [
            [
                'title' => 'CINTA DAN SEJARAH',
                'subtitle' => 'Penayangan Perdana November 2026 di Cinema XXI Plaza Senayan. Jangan lewatkan karya monumental sutradara peraih penghargaan festival.',
                'badge_text' => 'PROMO SPESIAL / PREMIERE CDS',
                'image_path' => 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=80',
                'display_mode' => 'rich_content',
                'link_type' => 'event',
                'event_id' => $eventCds->id,
                'movie_id' => null,
                'target_url' => null,
                'button_text' => 'Beli Tiket Sekarang',
                'order_priority' => 1,
                'is_active' => true,
            ],
            [
                'title' => 'IMTIHAN',
                'subtitle' => 'Special Premiere + Sesi Diskusi Tanya Jawab (Q&A) langsung bersama Sutradara & Para Pemeran Utama.',
                'badge_text' => 'COMMUNITY PREMIERE',
                'image_path' => 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80',
                'display_mode' => 'rich_content',
                'link_type' => 'event',
                'event_id' => $eventImtihan->id,
                'movie_id' => null,
                'target_url' => null,
                'button_text' => 'Reservasi Kursi',
                'order_priority' => 2,
                'is_active' => true,
            ],
            [
                'title' => 'Streaming VoD: Cinta dan Sejarah',
                'subtitle' => 'Tonton streaming film bioskop resmi Sinemus dengan kualitas Full HD dari mana saja selama 48 jam.',
                'badge_text' => 'SEWA FILM ONLINE',
                'image_path' => 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&q=80',
                'display_mode' => 'rich_content',
                'link_type' => 'movie',
                'event_id' => null,
                'movie_id' => $movieCds->id,
                'target_url' => null,
                'button_text' => 'Sewa Film Sekarang',
                'order_priority' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($banners as $bannerData) {
            Banner::updateOrCreate(
                [
                    'order_priority' => $bannerData['order_priority'],
                    'link_type' => $bannerData['link_type'],
                ],
                $bannerData
            );
        }
    }
}
