<?php

namespace Tests\Feature\Admin\Dashboard;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\Schedule;
use App\Models\User;
use App\Models\UserMovieAccess;
use App\Services\Admin\Dashboard\DashboardAnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class DashboardAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::forget(DashboardAnalyticsService::CACHE_KEY);

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Sinemus',
            'email' => 'admin@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081100000001',
            'is_phone_locked' => true,
        ]);

        $this->customer = User::factory()->create([
            'name' => 'Penonton Biasa',
            'email' => 'customer@example.com',
            'role' => 'customer',
            'phone_number' => '081200000002',
            'is_phone_locked' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_admin_dashboard_stats(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard/stats');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);

        $this->assertNotNull($response->json('server_time'));
    }

    public function test_customer_role_cannot_access_admin_dashboard_stats_and_receives_403(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/stats');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk mengakses sumber daya ini.',
                'error_code' => 'FORBIDDEN_ROLE_ACCESS',
            ]);

        $this->assertNotNull($response->json('server_time'));
    }

    public function test_super_admin_can_access_admin_dashboard_stats_with_empty_state(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/stats');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Statistik dashboard admin berhasil diambil.',
                'data' => [
                    'total_revenue' => 0,
                    'formatted_total_revenue' => 'Rp 0',
                    'total_tickets_sold' => 0,
                    'active_movies_count' => 0,
                    'upcoming_events_count' => 0,
                    'gross_revenue' => 0,
                    'net_revenue' => 0,
                    'total_discount' => 0,
                    'active_vod_rentals' => 0,
                    'presale_fulfillment_alert' => [
                        'pending_count' => 0,
                        'has_pending' => false,
                    ],
                ],
            ]);

        $this->assertNotNull($response->json('server_time'));
    }

    public function test_dashboard_stats_accurately_aggregates_revenue_tickets_and_operational_kpis(): void
    {
        // 1. Katalog Film VoD (1 Published, 1 Draft)
        Movie::create([
            'slug' => 'film-indie-aktif',
            'title' => 'Film Indie Aktif',
            'synopsis' => 'Sinopsis film indie aktif.',
            'poster_path' => 'movies/posters/aktif.jpg',
            'backdrop_path' => 'movies/backdrops/aktif.jpg',
            'director' => 'Sutradara Indie',
            'cast' => ['Aktor Indie 1', 'Aktris Indie 2'],
            'genre' => 'Drama',
            'age_rating' => '13+',
            'access_model' => 'rental',
            'duration_minutes' => 90,
            'price' => 25000.00,
            'rental_duration_hours' => 48,
            'cloudflare_video_uid' => 'stream-uid-1234',
            'release_year' => 2026,
            'is_published' => true,
        ]);

        Movie::create([
            'slug' => 'film-indie-draft',
            'title' => 'Film Indie Draft',
            'synopsis' => 'Sinopsis film draft.',
            'poster_path' => 'movies/posters/draft.jpg',
            'backdrop_path' => 'movies/backdrops/draft.jpg',
            'director' => 'Sutradara Draft',
            'cast' => ['Aktor Draft'],
            'genre' => 'Thriller',
            'age_rating' => '17+',
            'access_model' => 'rental',
            'duration_minutes' => 100,
            'price' => 30000.00,
            'cloudflare_video_uid' => 'stream-uid-draft',
            'release_year' => 2026,
            'is_published' => false,
        ]);

        // 2. Event & Schedules (1 Event Aktif dengan Jadwal Mendatang, 1 Event Selesai, 1 Event Nonaktif)
        $activeEvent = Event::create([
            'slug' => 'screening-cinta-sejarah',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Screening Cinta & Sejarah',
            'description' => 'Deskripsi screening cinta dan sejarah.',
            'synopsis_short' => 'Sinopsis ringkas cinta dan sejarah.',
            'poster_path' => 'events/posters/cds.jpg',
            'backdrop_path' => 'events/backdrops/cds.jpg',
            'director' => 'Arya Sinema',
            'cast' => ['Aktor 1', 'Aktris 2'],
            'rules' => ['Dilarang merekam'],
            'venue_name' => 'Cinema XXI Senayan',
            'venue_address' => 'Plaza Senayan Lantai 5, Jakarta',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $futureSchedule = Schedule::create([
            'event_id' => $activeEvent->id,
            'studio_name' => 'Studio 1',
            'show_time' => now()->addDays(3),
            'ticket_price' => 50000.00,
            'total_seats' => 100,
            'is_active' => true,
        ]);

        $pastEvent = Event::create([
            'slug' => 'screening-lampau',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Screening Lampau',
            'description' => 'Deskripsi screening lampau.',
            'synopsis_short' => 'Sinopsis ringkas lampau.',
            'poster_path' => 'events/posters/lampau.jpg',
            'backdrop_path' => 'events/backdrops/lampau.jpg',
            'director' => 'Sutradara Lampau',
            'cast' => ['Pemeran Lampau'],
            'rules' => ['Dilarang merokok'],
            'venue_name' => 'CGV Grand Indonesia',
            'venue_address' => 'Grand Indonesia West Mall Lt 8',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        Schedule::create([
            'event_id' => $pastEvent->id,
            'studio_name' => 'Studio 2',
            'show_time' => now()->subDays(5),
            'ticket_price' => 45000.00,
            'total_seats' => 50,
            'is_active' => true,
        ]);

        Event::create([
            'slug' => 'screening-arsip-nonaktif',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Screening Arsip Nonaktif',
            'description' => 'Deskripsi arsip nonaktif.',
            'synopsis_short' => 'Sinopsis arsip nonaktif.',
            'poster_path' => 'events/posters/arsip.jpg',
            'backdrop_path' => 'events/backdrops/arsip.jpg',
            'director' => 'Sutradara Arsip',
            'cast' => ['Pemeran Arsip'],
            'rules' => [],
            'venue_name' => 'Cinepolis',
            'venue_address' => 'Istana Plaza Lantai 3',
            'city' => 'Bandung',
            'is_active' => false,
        ]);

        // 3. Transaksi Tiket Bioskop Paid
        EventTransaction::create([
            'order_id' => 'SNM-TKT-001',
            'user_id' => $this->customer->id,
            'schedule_id' => $futureSchedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 100000.00,
            'discount_amount' => 10000.00,
            'net_amount' => 90000.00,
            'snap_token' => 'snap-tk-001',
            'payment_status' => 'paid',
            'fulfillment_status' => 'fulfilled',
            'paid_at' => now()->subHours(2),
            'snapshot_event_data' => [
                'title' => $activeEvent->title,
                'venue_name' => $activeEvent->venue_name,
                'ticket_price' => 50000,
            ],
        ]);

        // Transaksi Presale Menunggu Injeksi Karcis
        EventTransaction::create([
            'order_id' => 'SNM-TKT-002',
            'user_id' => $this->customer->id,
            'schedule_id' => $futureSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'snap_token' => 'snap-tk-002',
            'payment_status' => 'paid',
            'fulfillment_status' => 'awaiting_cinema_ticket',
            'paid_at' => now()->subHour(),
            'snapshot_event_data' => [
                'title' => $activeEvent->title,
                'venue_name' => $activeEvent->venue_name,
                'ticket_price' => 50000,
            ],
        ]);

        // Transaksi Pending (Tidak Boleh Masuk Hitungan Omzet/Tiket Terjual)
        EventTransaction::create([
            'order_id' => 'SNM-TKT-PENDING',
            'user_id' => $this->customer->id,
            'schedule_id' => $futureSchedule->id,
            'ticket_quantity' => 4,
            'gross_amount' => 200000.00,
            'discount_amount' => 0.00,
            'net_amount' => 200000.00,
            'snap_token' => 'snap-pending',
            'payment_status' => 'pending',
            'fulfillment_status' => 'unfulfilled',
            'snapshot_event_data' => [
                'title' => $activeEvent->title,
                'venue_name' => $activeEvent->venue_name,
                'ticket_price' => 50000,
            ],
        ]);

        // 4. Transaksi Sewa Film VoD Paid
        $activeMovie = Movie::where('slug', 'film-indie-aktif')->first();

        MovieTransaction::create([
            'order_id' => 'SNM-VOD-001',
            'user_id' => $this->customer->id,
            'movie_id' => $activeMovie->id,
            'gross_amount' => 25000.00,
            'discount_amount' => 5000.00,
            'net_amount' => 20000.00,
            'snap_token' => 'snap-vod-001',
            'payment_status' => 'paid',
            'paid_at' => now()->subMinutes(30),
            'snapshot_movie_data' => [
                'title' => $activeMovie->title,
                'price' => 25000,
                'duration_minutes' => 90,
            ],
        ]);

        // 5. User Movie Access (1 Aktif, 1 Kedaluwarsa)
        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $activeMovie->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subHours(1),
            'rental_expires_at' => now()->addHours(47),
        ]);

        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $activeMovie->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subDays(3),
            'rental_expires_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/stats');

        $response->assertStatus(200);

        $data = $response->json('data');

        $this->assertEquals(160000.0, (float) $data['total_revenue']);
        $this->assertEquals('Rp 160.000', $data['formatted_total_revenue']);
        $this->assertEquals(3, $data['total_tickets_sold']);
        $this->assertEquals(1, $data['active_movies_count']);
        $this->assertEquals(1, $data['upcoming_events_count']);

        // Rincian Eksekutif
        $this->assertEquals(175000.0, (float) $data['gross_revenue']);
        $this->assertEquals('Rp 175.000', $data['formatted_gross_revenue']);
        $this->assertEquals(160000.0, (float) $data['net_revenue']);
        $this->assertEquals('Rp 160.000', $data['formatted_net_revenue']);
        $this->assertEquals(15000.0, (float) $data['total_discount']);
        $this->assertEquals('Rp 15.000', $data['formatted_total_discount']);

        // Breakdown Tiket vs VoD
        $this->assertEquals(140000.0, (float) $data['breakdown']['tickets']['net_revenue']);
        $this->assertEquals(20000.0, (float) $data['breakdown']['vod']['net_revenue']);

        // Presale Alert
        $this->assertEquals(1, $data['presale_fulfillment_alert']['pending_count']);
        $this->assertTrue($data['presale_fulfillment_alert']['has_pending']);

        // Active VoD Rentals
        $this->assertEquals(1, $data['active_vod_rentals']);

        // Recent Orders
        $this->assertNotEmpty($data['recent_orders']);
        $this->assertCount(4, $data['recent_orders']);
    }

    public function test_dashboard_stats_caching_and_refresh_mechanism(): void
    {
        // Panggilan pertama saat database kosong
        $firstResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/stats');

        $firstResponse->assertStatus(200);
        $this->assertEquals(0, $firstResponse->json('data.total_revenue'));

        // Buat film dan transaksi baru secara langsung di database
        $movie = Movie::create([
            'slug' => 'film-baru-setelah-cache',
            'title' => 'Film Baru Setelah Cache',
            'synopsis' => 'Sinopsis film.',
            'poster_path' => 'movies/posters/cache.jpg',
            'backdrop_path' => 'movies/backdrops/cache.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Action',
            'age_rating' => '13+',
            'access_model' => 'rental',
            'duration_minutes' => 90,
            'price' => 50000.00,
            'rental_duration_hours' => 48,
            'cloudflare_video_uid' => 'stream-cache-1234',
            'release_year' => 2026,
            'is_published' => true,
        ]);

        MovieTransaction::create([
            'order_id' => 'SNM-VOD-CACHE-TEST',
            'user_id' => $this->customer->id,
            'movie_id' => $movie->id,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'snap_token' => 'snap-cache',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'snapshot_movie_data' => [
                'title' => $movie->title,
                'price' => 50000,
                'duration_minutes' => 90,
            ],
        ]);

        // Panggilan kedua tanpa refresh (harus tetap mengembalikan data cache lama 0)
        $cachedResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/stats');

        $cachedResponse->assertStatus(200);
        $this->assertEquals(0, $cachedResponse->json('data.total_revenue'));

        // Panggilan ketiga dengan query parameter ?refresh=true (harus bypass/refresh cache)
        $refreshedResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/stats?refresh=true');

        $refreshedResponse->assertStatus(200);
        $this->assertEquals(50000.0, (float) $refreshedResponse->json('data.total_revenue'));
        $this->assertEquals('Rp 50.000', $refreshedResponse->json('data.formatted_total_revenue'));
        $this->assertEquals(1, $refreshedResponse->json('data.active_movies_count'));
    }

    public function test_dashboard_stats_route_has_throttle_middleware(): void
    {
        $route = Route::getRoutes()->getByName('admin.dashboard.stats')
            ?: collect(Route::getRoutes()->getRoutes())->first(function ($r) {
                return str_contains($r->uri(), 'admin/dashboard/stats');
            });

        $this->assertNotNull($route, 'Rute /api/v1/admin/dashboard/stats harus terdaftar.');
        $middleware = $route->gatherMiddleware();

        $this->assertTrue(
            in_array('throttle:60,1', $middleware, true) || collect($middleware)->contains(fn ($m) => str_starts_with($m, 'throttle:60')),
            'Rute admin dashboard harus menerapkan middleware throttle:60,1'
        );
    }

    public function test_dashboard_stats_validates_refresh_parameter(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/stats?refresh=not_a_boolean');

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonValidationErrors(['refresh']);
    }
}
