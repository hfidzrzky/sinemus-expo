<?php

namespace Tests\Feature\Banner;

use App\Models\Banner;
use App\Models\Event;
use App\Models\Movie;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class BannerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_active_banners_in_correct_order(): void
    {
        // Setup 3 banner dengan urutan order_priority acak
        Banner::create([
            'title' => 'Banner Prioritas Tiga',
            'image_path' => 'https://images.unsplash.com/photo-3',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://example.com/3',
            'order_priority' => 3,
            'is_active' => true,
        ]);

        Banner::create([
            'title' => 'Banner Prioritas Satu',
            'image_path' => 'https://images.unsplash.com/photo-1',
            'display_mode' => 'image_only',
            'link_type' => 'url',
            'target_url' => 'https://example.com/1',
            'order_priority' => 1,
            'is_active' => true,
        ]);

        Banner::create([
            'title' => 'Banner Prioritas Dua',
            'image_path' => 'https://images.unsplash.com/photo-2',
            'display_mode' => 'rich_content',
            'link_type' => 'voucher',
            'button_text' => 'Klaim Kupon',
            'order_priority' => 2,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/banners');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'subtitle',
                        'badge_text',
                        'image_url',
                        'display_mode',
                        'link_type',
                        'movie_slug',
                        'event_slug',
                        'target_url',
                        'button_text',
                        'order_priority',
                    ],
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Daftar banner aktif berhasil diambil',
            ]);

        $data = $response->json('data');
        $this->assertCount(3, $data);
        $this->assertEquals('Banner Prioritas Satu', $data[0]['title']);
        $this->assertEquals(1, $data[0]['order_priority']);
        $this->assertEquals('Banner Prioritas Dua', $data[1]['title']);
        $this->assertEquals(2, $data[1]['order_priority']);
        $this->assertEquals('Banner Prioritas Tiga', $data[2]['title']);
        $this->assertEquals(3, $data[2]['order_priority']);
    }

    public function test_inactive_banners_are_excluded(): void
    {
        Banner::create([
            'title' => 'Banner Aktif',
            'image_path' => 'https://images.unsplash.com/active',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'order_priority' => 1,
            'is_active' => true,
        ]);

        Banner::create([
            'title' => 'Banner Nonaktif',
            'image_path' => 'https://images.unsplash.com/inactive',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'order_priority' => 2,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/banners');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Banner Aktif', $data[0]['title']);
    }

    public function test_scheduled_banners_filter(): void
    {
        $now = now();

        // 1. Banner yang masa tayangnya belum mulai (start_at di masa depan) -> Excluded
        Banner::create([
            'title' => 'Banner Masa Depan',
            'image_path' => 'https://images.unsplash.com/future',
            'order_priority' => 1,
            'is_active' => true,
            'start_at' => $now->copy()->addDay(),
            'end_at' => $now->copy()->addDays(2),
        ]);

        // 2. Banner yang masa tayangnya sudah lewat (end_at di masa lalu) -> Excluded
        Banner::create([
            'title' => 'Banner Kedaluwarsa',
            'image_path' => 'https://images.unsplash.com/past',
            'order_priority' => 2,
            'is_active' => true,
            'start_at' => $now->copy()->subDays(5),
            'end_at' => $now->copy()->subDay(),
        ]);

        // 3. Banner yang sedang dalam periode aktif -> Included
        Banner::create([
            'title' => 'Banner Sedang Tayang',
            'image_path' => 'https://images.unsplash.com/current',
            'order_priority' => 3,
            'is_active' => true,
            'start_at' => $now->copy()->subDay(),
            'end_at' => $now->copy()->addDay(),
        ]);

        // 4. Banner tanpa batasan tanggal (start_at null & end_at null) -> Included
        Banner::create([
            'title' => 'Banner Permanen',
            'image_path' => 'https://images.unsplash.com/permanent',
            'order_priority' => 4,
            'is_active' => true,
            'start_at' => null,
            'end_at' => null,
        ]);

        $response = $this->getJson('/api/v1/banners');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(2, $data);
        $titles = collect($data)->pluck('title')->all();
        $this->assertContains('Banner Sedang Tayang', $titles);
        $this->assertContains('Banner Permanen', $titles);
        $this->assertNotContains('Banner Masa Depan', $titles);
        $this->assertNotContains('Banner Kedaluwarsa', $titles);
    }

    public function test_banner_item_matches_contract_specification(): void
    {
        $movie = Movie::create([
            'slug' => 'cinta-pertama-di-jakarta',
            'title' => 'Cinta Pertama di Jakarta',
            'synopsis' => 'Sinopsis film indie...',
            'poster_path' => 'movies/posters/cinta.jpg',
            'backdrop_path' => 'movies/backdrops/cinta.jpg',
            'director' => 'Sutradara Hebat',
            'cast' => ['Aktor A', 'Aktor B'],
            'genre' => 'Drama',
            'age_rating' => '17+',
            'access_model' => 'rental',
            'duration_minutes' => 105,
            'price' => 25000,
            'rental_duration_hours' => 48,
            'cloudflare_video_uid' => 'cf-video-uid-1234567890abcdef12',
            'release_year' => 2026,
            'is_published' => true,
        ]);

        $event = Event::create([
            'slug' => 'special-screening-bandung-2026',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Special Premiere Bandung',
            'description' => 'Screening eksklusif bersama sutradara',
            'synopsis_short' => 'Sinopsis singkat',
            'poster_path' => 'events/posters/premiere.jpg',
            'backdrop_path' => 'events/backdrops/premiere.jpg',
            'director' => 'Sutradara Event',
            'cast' => ['Aktor 1'],
            'rules' => ['Dilarang Merekam'],
            'venue_name' => 'CGV Paris Van Java',
            'venue_address' => 'Jl. Sukajadi No. 131',
            'city' => 'Bandung',
            'is_active' => true,
        ]);

        $bannerMovie = Banner::create([
            'title' => 'FILM TERBARU',
            'subtitle' => 'Tonton streaming sekarang juga',
            'badge_text' => 'EKSKLUSIF VoD',
            'image_path' => 'https://images.unsplash.com/movie-banner',
            'display_mode' => 'rich_content',
            'link_type' => 'movie',
            'movie_id' => $movie->id,
            'button_text' => 'Sewa Sekarang',
            'order_priority' => 1,
            'is_active' => true,
        ]);

        $bannerEvent = Banner::create([
            'title' => null,
            'subtitle' => null,
            'badge_text' => null,
            'image_path' => 'banners/event-banner.jpg',
            'display_mode' => 'image_only',
            'link_type' => 'event',
            'event_id' => $event->id,
            'button_text' => null,
            'order_priority' => 2,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/banners');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(2, $data);

        // Validasi banner 1 (Movie)
        $item1 = $data[0];
        $this->assertEquals($bannerMovie->id, $item1['id']);
        $this->assertEquals('FILM TERBARU', $item1['title']);
        $this->assertEquals('Tonton streaming sekarang juga', $item1['subtitle']);
        $this->assertEquals('EKSKLUSIF VoD', $item1['badge_text']);
        $this->assertEquals('https://images.unsplash.com/movie-banner', $item1['image_url']);
        $this->assertEquals('rich_content', $item1['display_mode']);
        $this->assertEquals('movie', $item1['link_type']);
        $this->assertEquals('cinta-pertama-di-jakarta', $item1['movie_slug']);
        $this->assertNull($item1['event_slug']);
        $this->assertEquals('Sewa Sekarang', $item1['button_text']);

        // Validasi banner 2 (Event & Image Only & button_text default)
        $item2 = $data[1];
        $this->assertEquals($bannerEvent->id, $item2['id']);
        $this->assertNull($item2['title']);
        $this->assertNull($item2['subtitle']);
        $this->assertNull($item2['badge_text']);
        $this->assertStringContainsString('banners/event-banner.jpg', $item2['image_url']);
        $this->assertEquals('image_only', $item2['display_mode']);
        $this->assertEquals('event', $item2['link_type']);
        $this->assertNull($item2['movie_slug']);
        $this->assertEquals('special-screening-bandung-2026', $item2['event_slug']);
        $this->assertEquals('Lihat Detail', $item2['button_text']);
    }

    public function test_returns_empty_array_when_no_active_banners(): void
    {
        $response = $this->getJson('/api/v1/banners');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Daftar banner aktif berhasil diambil',
                'data' => [],
            ]);

        $this->assertIsArray($response->json('data'));
        $this->assertEmpty($response->json('data'));
        $this->assertNotEmpty($response->json('server_time'));
    }

    public function test_banners_route_has_throttle_middleware(): void
    {
        $route = collect(Route::getRoutes())->first(function ($r) {
            return $r->uri() === 'api/v1/banners';
        });

        $this->assertNotNull($route);
        $this->assertContains('throttle:60,1', $route->middleware());
    }
}
