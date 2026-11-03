<?php

namespace Tests\Feature\Movies;

use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserMovieAccess;
use App\Models\Voucher;
use App\Services\Admin\Settings\SystemSettingService;
use App\Services\Checkout\MidtransSnapService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Mockery\MockInterface;
use Tests\TestCase;

class MovieRentalOrderTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected Movie $movie;

    protected Movie $freeMovie;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi.santoso@gmail.com',
            'role' => 'customer',
            'phone_number' => '081234567891',
            'is_phone_locked' => true,
        ]);

        $this->movie = Movie::create([
            'slug' => 'filosofi-kopi-digital',
            'title' => 'Filosofi Kopi: Aroma Nusantara',
            'synopsis' => 'Dua sahabat peracik kopi mencari biji kopi terbaik ke pelosok negeri.',
            'poster_path' => 'cf_img_filkop_poster',
            'backdrop_path' => 'cf_img_filkop_backdrop',
            'director' => 'Angga Dwimas Sasongko',
            'cast' => ['Chicco Jerikho', 'Rio Dewanto'],
            'genre' => 'Drama',
            'duration_minutes' => 118,
            'price' => 25000,
            'rental_duration_hours' => 48,
            'access_model' => 'rental',
            'cloudflare_trailer_uid' => 'trailer_cf_filkop_01010101010101',
            'cloudflare_video_uid' => 'video_cf_filkop_master_123456789',
            'release_year' => 2026,
            'age_rating' => '13+',
            'is_published' => true,
        ]);

        $this->freeMovie = Movie::create([
            'slug' => 'film-gratis-edukasi',
            'title' => 'Edukasi Sinema Nusantara',
            'synopsis' => 'Pengenalan teknik sinematografi untuk pemula.',
            'poster_path' => 'cf_img_free_poster',
            'backdrop_path' => 'cf_img_free_backdrop',
            'director' => 'Akademi Film',
            'cast' => ['Instruktur A'],
            'genre' => 'Edukasi',
            'duration_minutes' => 50,
            'price' => 0,
            'access_model' => 'free',
            'cloudflare_video_uid' => 'video_cf_free_master_0000000000',
            'release_year' => 2026,
            'age_rating' => 'SU',
            'is_published' => true,
        ]);

        // Mock MidtransSnapService default
        $this->mock(MidtransSnapService::class, function (MockInterface $mock) {
            $mock->shouldReceive('createTransaction')
                ->andReturn([
                    'token' => 'mock_snap_token_vod_998877',
                    'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/mock_token',
                ]);
        });
    }

    public function test_unauthenticated_user_cannot_rent_movie(): void
    {
        $response = $this->postJson("/api/v1/movies/{$this->movie->id}/rent");

        $response->assertStatus(401);
    }

    public function test_cannot_rent_non_existent_or_unpublished_movie(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/movies/99999/rent');

        $response->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'MOVIE_NOT_FOUND');
    }

    public function test_cannot_rent_free_movie(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/movies/{$this->freeMovie->id}/rent");

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'MOVIE_NOT_RENTABLE');
    }

    public function test_customer_can_successfully_create_rental_order_with_snap_token(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/movies/{$this->movie->id}/rent");

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Pesanan sewa film berhasil diinisiasi.')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'order_id',
                    'snap_token',
                    'movie_title',
                    'gross_amount',
                    'discount_amount',
                    'net_amount',
                    'rental_duration_hours',
                ],
                'server_time',
            ])
            ->assertJsonPath('data.snap_token', 'mock_snap_token_vod_998877')
            ->assertJsonPath('data.movie_title', 'Filosofi Kopi: Aroma Nusantara')
            ->assertJsonPath('data.gross_amount', 25000)
            ->assertJsonPath('data.discount_amount', 0)
            ->assertJsonPath('data.net_amount', 25000)
            ->assertJsonPath('data.rental_duration_hours', 48);

        $orderId = $response->json('data.order_id');
        $this->assertStringStartsWith('SNM-VOD-', $orderId);

        // Verifikasi persistensi database
        $this->assertDatabaseHas('movie_transactions', [
            'order_id' => $orderId,
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'payment_status' => 'pending',
            'net_amount' => 25000.0,
        ]);
    }

    public function test_customer_can_apply_voucher_discount_to_rental_order(): void
    {
        $voucher = Voucher::create([
            'code' => 'SEWAMURAH',
            'name' => 'Diskon Sewa Film 5 Ribu',
            'discount_type' => 'fixed',
            'discount_value' => 5000,
            'min_purchase' => 20000,
            'max_discount' => 5000,
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(7),
            'item_type' => 'all',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/movies/{$this->movie->id}/rent", [
                'voucher_code' => 'sewamurah',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.gross_amount', 25000)
            ->assertJsonPath('data.discount_amount', 5000)
            ->assertJsonPath('data.net_amount', 20000);

        $orderId = $response->json('data.order_id');

        $this->assertDatabaseHas('movie_transactions', [
            'order_id' => $orderId,
            'voucher_id' => $voucher->id,
            'discount_amount' => 5000.0,
            'net_amount' => 20000.0,
        ]);
    }

    public function test_100_percent_voucher_discount_results_in_zero_amount_free_access_direct_activation(): void
    {
        $voucher = Voucher::create([
            'code' => 'GRATIS100',
            'name' => 'Diskon Sewa 100 Persen',
            'discount_type' => 'percentage',
            'discount_value' => 100,
            'min_purchase' => 0,
            'max_discount' => 50000,
            'quota_total' => 10,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(7),
            'item_type' => 'all',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/movies/{$this->movie->id}/rent", [
                'voucher_code' => 'GRATIS100',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.gross_amount', 25000)
            ->assertJsonPath('data.discount_amount', 25000)
            ->assertJsonPath('data.net_amount', 0);

        $this->assertStringStartsWith('PROMO-FREE-', (string) $response->json('data.snap_token'));

        $orderId = $response->json('data.order_id');

        // Verifikasi transaksi lunas & hak sewa langsung terbit
        $this->assertDatabaseHas('movie_transactions', [
            'order_id' => $orderId,
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'payment_status' => 'paid',
            'net_amount' => 0,
        ]);

        $this->assertDatabaseHas('user_movie_access', [
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'active',
        ]);
    }

    public function test_stale_pending_rental_order_is_auto_expired_and_allows_re_rent(): void
    {
        // Buat pesanan pending kadaluarsa (>15 menit lalu)
        $staleTransaction = MovieTransaction::create([
            'order_id' => 'SNM-VOD-STALE01',
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'gross_amount' => 25000,
            'discount_amount' => 0,
            'net_amount' => 25000,
            'payment_status' => 'pending',
            'snapshot_movie_data' => $this->movie->toArray(),
        ]);

        DB::table('movie_transactions')
            ->where('id', $staleTransaction->id)
            ->update([
                'created_at' => now()->subMinutes(20),
                'updated_at' => now()->subMinutes(20),
            ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/movies/{$this->movie->id}/rent");

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        // Verifikasi order lama diubah jadi expired
        $this->assertDatabaseHas('movie_transactions', [
            'id' => $staleTransaction->id,
            'payment_status' => 'expired',
        ]);
    }

    public function test_anti_double_rent_guard_prevents_ordering_when_active_rental_exists(): void
    {
        // Berikan sewa aktif yang belum kadaluarsa
        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/movies/{$this->movie->id}/rent");

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'MOVIE_ALREADY_RENTED')
            ->assertJsonPath('message', 'Anda masih memiliki hak sewa aktif untuk film ini.');
    }

    public function test_emergency_freeze_guard_rejects_rental_when_frozen(): void
    {
        // Set setting darurat freeze_vod_rentals = true
        SystemSetting::updateOrCreate(
            ['group' => SystemSetting::GROUP_EMERGENCY_CONTROLS],
            [
                'payload' => [
                    'is_maintenance_mode' => false,
                    'maintenance_message' => '',
                    'freeze_cinema_ticket_sales' => false,
                    'freeze_vod_rentals' => true,
                    'emergency_alert_banner' => [
                        'is_active' => true,
                        'message' => 'Layanan sewa film sedang dibekukan.',
                        'type' => 'warning',
                    ],
                ],
            ]
        );

        Cache::forget(SystemSettingService::PUBLIC_SETTINGS_CACHE_KEY);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/movies/{$this->movie->id}/rent");

        $response->assertStatus(503)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'VOD_RENTALS_FROZEN');
    }

    public function test_rent_movie_route_has_throttle_middleware(): void
    {
        $routeList = app('router')->getRoutes();

        $rentRoute = $routeList->getByAction('App\Http\Controllers\Movies\V1\MovieRentalOrderController@rent');
        $this->assertNotNull($rentRoute);
        $this->assertContains('throttle:10,1', $rentRoute->gatherMiddleware());
    }
}
