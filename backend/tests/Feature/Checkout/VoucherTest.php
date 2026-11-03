<?php

namespace Tests\Feature\Checkout;

use App\Exceptions\Checkout\VoucherInvalidException;
use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\SeatLock;
use App\Models\User;
use App\Models\Voucher;
use App\Services\Checkout\VoucherService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class VoucherTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'customer@example.com',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);
    }

    public function test_can_apply_percentage_discount_voucher_successfully(): void
    {
        Voucher::create([
            'code' => 'DISKON20',
            'discount_type' => 'percentage',
            'discount_value' => 20.00,
            'min_purchase' => 50000.00,
            'max_discount' => 50000.00,
            'item_type' => 'ticket',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'DISKON20',
                'gross_amount' => 100000.00,
                'item_type' => 'ticket',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Voucher promo berhasil diterapkan.',
                'data' => [
                    'code' => 'DISKON20',
                    'discount_amount' => 20000.00,
                    'net_amount' => 80000.00,
                ],
            ]);

        $this->assertNotEmpty($response->json('data.description'));
        $this->assertNotNull($response->json('server_time'));
    }

    public function test_percentage_discount_is_capped_by_max_discount(): void
    {
        Voucher::create([
            'code' => 'MAXCAP50K',
            'discount_type' => 'percentage',
            'discount_value' => 50.00, // 50% dari 200.000 = 100.000, tapi dicap 30.000
            'min_purchase' => 50000.00,
            'max_discount' => 30000.00,
            'item_type' => 'ticket',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'MAXCAP50K',
                'gross_amount' => 200000.00,
                'item_type' => 'ticket',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'code' => 'MAXCAP50K',
                    'discount_amount' => 30000.00,
                    'net_amount' => 170000.00,
                ],
            ]);
    }

    public function test_can_apply_fixed_discount_voucher_successfully(): void
    {
        Voucher::create([
            'code' => 'POTONGAN25K',
            'discount_type' => 'fixed',
            'discount_value' => 25000.00,
            'min_purchase' => 50000.00,
            'max_discount' => null,
            'item_type' => 'movie_rental',
            'quota_total' => 50,
            'quota_used' => 5,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'POTONGAN25K',
                'gross_amount' => 60000.00,
                'item_type' => 'movie_rental',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'code' => 'POTONGAN25K',
                    'discount_amount' => 25000.00,
                    'net_amount' => 35000.00,
                ],
            ]);
    }

    public function test_fixed_discount_cannot_exceed_gross_amount(): void
    {
        Voucher::create([
            'code' => 'POTONGAN100K',
            'discount_type' => 'fixed',
            'discount_value' => 100000.00,
            'min_purchase' => 0.00,
            'max_discount' => null,
            'item_type' => 'all',
            'quota_total' => 10,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'POTONGAN100K',
                'gross_amount' => 45000.00,
                'item_type' => 'ticket',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'code' => 'POTONGAN100K',
                    'discount_amount' => 45000.00,
                    'net_amount' => 0.00,
                ],
            ]);
    }

    public function test_can_apply_slashed_price_discount_voucher_successfully(): void
    {
        Voucher::create([
            'code' => 'CORET25K',
            'discount_type' => 'slashed_price',
            'discount_value' => 25000.00,
            'min_purchase' => 30000.00,
            'max_discount' => null,
            'item_type' => 'ticket',
            'quota_total' => 50,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'CORET25K',
                'gross_amount' => 65000.00,
                'item_type' => 'ticket',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'code' => 'CORET25K',
                    'discount_amount' => 25000.00,
                    'net_amount' => 40000.00,
                    'description' => 'Potongan coret harga Rp 25.000 (Min. Transaksi Rp 30.000)',
                ],
            ]);
    }

    public function test_rejects_expired_voucher_with_422_and_voucher_expired_code(): void
    {
        Voucher::create([
            'code' => 'EXPIREDVOUCHER',
            'discount_type' => 'percentage',
            'discount_value' => 10.00,
            'min_purchase' => 0.00,
            'max_discount' => null,
            'item_type' => 'all',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDays(10),
            'valid_until' => now()->subDay(), // Expired
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'EXPIREDVOUCHER',
                'gross_amount' => 50000.00,
                'item_type' => 'ticket',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'VOUCHER_EXPIRED',
            ]);
    }

    public function test_rejects_not_yet_started_voucher_with_422(): void
    {
        Voucher::create([
            'code' => 'FUTUREVOUCHER',
            'discount_type' => 'percentage',
            'discount_value' => 10.00,
            'min_purchase' => 0.00,
            'max_discount' => null,
            'item_type' => 'all',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->addDays(2), // Belum mulai
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'FUTUREVOUCHER',
                'gross_amount' => 50000.00,
                'item_type' => 'ticket',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'VOUCHER_INVALID',
            ]);
    }

    public function test_rejects_over_quota_voucher_with_422_and_quota_exceeded_code(): void
    {
        Voucher::create([
            'code' => 'HABISKUOTA',
            'discount_type' => 'percentage',
            'discount_value' => 15.00,
            'min_purchase' => 0.00,
            'max_discount' => null,
            'item_type' => 'all',
            'quota_total' => 50,
            'quota_used' => 50, // Kuota habis
            'valid_from' => now()->subDays(2),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'HABISKUOTA',
                'gross_amount' => 50000.00,
                'item_type' => 'ticket',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'QUOTA_EXCEEDED',
            ]);
    }

    public function test_rejects_inactive_or_non_existent_voucher_with_422_and_voucher_invalid_code(): void
    {
        Voucher::create([
            'code' => 'NONAKTIF',
            'discount_type' => 'percentage',
            'discount_value' => 20.00,
            'min_purchase' => 0.00,
            'max_discount' => null,
            'item_type' => 'all',
            'quota_total' => 10,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => false, // Nonaktif
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'NONAKTIF',
                'gross_amount' => 50000.00,
                'item_type' => 'ticket',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'VOUCHER_INVALID',
            ]);

        $response2 = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'TIDAK_ADA_CODE',
                'gross_amount' => 50000.00,
                'item_type' => 'ticket',
            ]);

        $response2->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'VOUCHER_INVALID',
            ]);
    }

    public function test_rejects_voucher_when_minimum_purchase_is_not_met(): void
    {
        Voucher::create([
            'code' => 'MIN100K',
            'discount_type' => 'fixed',
            'discount_value' => 20000.00,
            'min_purchase' => 100000.00,
            'max_discount' => null,
            'item_type' => 'ticket',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'MIN100K',
                'gross_amount' => 75000.00, // Di bawah minimum 100.000
                'item_type' => 'ticket',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'VOUCHER_INVALID',
            ]);
    }

    public function test_rejects_voucher_for_incompatible_item_type(): void
    {
        Voucher::create([
            'code' => 'KHUSUSTIKET',
            'discount_type' => 'fixed',
            'discount_value' => 10000.00,
            'min_purchase' => 0.00,
            'max_discount' => null,
            'item_type' => 'ticket', // Hanya untuk ticket
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'KHUSUSTIKET',
                'gross_amount' => 50000.00,
                'item_type' => 'movie_rental', // Coba dipakai untuk sewa film
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'VOUCHER_INVALID',
            ]);
    }

    public function test_voucher_with_item_type_all_works_for_both_ticket_and_movie_rental(): void
    {
        Voucher::create([
            'code' => 'UNIVERSAL',
            'discount_type' => 'fixed',
            'discount_value' => 15000.00,
            'min_purchase' => 20000.00,
            'max_discount' => null,
            'item_type' => 'all',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        // Sukses untuk ticket
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'UNIVERSAL',
                'gross_amount' => 50000.00,
                'item_type' => 'ticket',
            ])->assertStatus(200);

        // Sukses untuk movie_rental
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => 'UNIVERSAL',
                'gross_amount' => 50000.00,
                'item_type' => 'movie_rental',
            ])->assertStatus(200);
    }

    public function test_apply_voucher_request_validation(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/checkout/voucher/apply', [
                'voucher_code' => '',
                'gross_amount' => -100,
                'item_type' => 'invalid_type',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['voucher_code', 'gross_amount', 'item_type']);
    }

    public function test_unauthenticated_user_cannot_apply_voucher(): void
    {
        $this->postJson('/api/v1/checkout/voucher/apply', [
            'voucher_code' => 'ANY',
            'gross_amount' => 50000.00,
            'item_type' => 'ticket',
        ])->assertStatus(401);
    }

    public function test_increment_usage_atomically_increases_quota_used(): void
    {
        $voucher = Voucher::create([
            'code' => 'LIMITED1',
            'discount_type' => 'fixed',
            'discount_value' => 10000.00,
            'min_purchase' => 0.00,
            'max_discount' => null,
            'item_type' => 'all',
            'quota_total' => 1,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $service = app(VoucherService::class);
        $updated = $service->incrementUsage($voucher->id);

        $this->assertEquals(1, $updated->quota_used);
        $this->assertDatabaseHas('vouchers', [
            'id' => $voucher->id,
            'quota_used' => 1,
        ]);

        // Percobaan increment kedua saat kuota sudah habis harus melempar exception
        $this->expectException(VoucherInvalidException::class);
        $service->incrementUsage($voucher->id);
    }

    public function test_order_status_polling_for_ticket_order(): void
    {
        $event = Event::create([
            'slug' => 'screening-bioskop-xxi-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Screening Bioskop XXI Test',
            'description' => 'Deskripsi event',
            'synopsis_short' => 'Sinopsis singkat',
            'poster_path' => 'posters/test.jpg',
            'backdrop_path' => 'backdrops/test.jpg',
            'director' => 'Sutradara Test',
            'cast' => ['Aktor 1'],
            'rules' => ['Dilarang Merekam'],
            'city' => 'Jakarta Selatan',
            'venue_name' => 'XXI Plaza Senayan',
            'venue_address' => 'Jl. Asia Afrika',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(3),
            'ticket_price' => 50000.00,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        $order = EventTransaction::create([
            'order_id' => 'SNM-TKT-20260901-ABC123',
            'user_id' => $this->user->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 100000.00,
            'discount_amount' => 0.00,
            'net_amount' => 100000.00,
            'snap_token' => 'snap_test_123',
            'payment_status' => 'paid',
            'payment_type' => 'qris',
            'paid_at' => now(),
            'snapshot_event_data' => [
                'event_title' => $event->title,
            ],
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/checkout/orders/{$order->order_id}/status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_id' => 'SNM-TKT-20260901-ABC123',
                    'item_type' => 'ticket',
                    'status' => 'paid',
                    'payment_type' => 'qris',
                ],
            ]);

        $this->assertNotNull($response->json('data.paid_at'));
    }

    public function test_order_status_polling_for_movie_rental_order(): void
    {
        $movie = Movie::create([
            'title' => 'Film VoD Test',
            'slug' => 'film-vod-test',
            'synopsis' => 'Sinopsis film',
            'poster_path' => 'posters/vod.jpg',
            'backdrop_path' => 'backdrops/vod.jpg',
            'director' => 'Sutradara Test',
            'cast' => ['Aktor 1'],
            'genre' => 'Drama',
            'cloudflare_video_uid' => 'video_uid_1234567890123456789012',
            'duration_minutes' => 90,
            'release_year' => 2026,
            'age_rating' => '17+',
            'price' => 25000.00,
            'is_published' => true,
        ]);

        $order = MovieTransaction::create([
            'order_id' => 'SNM-VOD-20260901-XYZ789',
            'user_id' => $this->user->id,
            'movie_id' => $movie->id,
            'gross_amount' => 25000.00,
            'discount_amount' => 0.00,
            'net_amount' => 25000.00,
            'snap_token' => 'snap_vod_123',
            'payment_status' => 'pending',
            'payment_type' => null,
            'paid_at' => null,
            'snapshot_movie_data' => [
                'title' => $movie->title,
            ],
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/checkout/orders/{$order->order_id}/status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_id' => 'SNM-VOD-20260901-XYZ789',
                    'item_type' => 'movie_rental',
                    'status' => 'pending',
                    'payment_type' => null,
                    'paid_at' => null,
                ],
            ]);
    }

    public function test_order_status_anti_idor_prevents_viewing_other_users_order(): void
    {
        $otherUser = User::factory()->create();

        $movie = Movie::create([
            'title' => 'Film Milik User Lain',
            'slug' => 'film-milik-user-lain',
            'synopsis' => 'Sinopsis',
            'poster_path' => 'posters/other.jpg',
            'backdrop_path' => 'backdrops/other.jpg',
            'director' => 'Sutradara Lain',
            'cast' => ['Aktor Lain'],
            'genre' => 'Action',
            'cloudflare_video_uid' => 'video_uid_9999999999999999999999',
            'duration_minutes' => 90,
            'release_year' => 2026,
            'age_rating' => 'SU',
            'price' => 20000.00,
            'is_published' => true,
        ]);

        $otherUserOrder = MovieTransaction::create([
            'order_id' => 'SNM-VOD-20260901-SECRET99',
            'user_id' => $otherUser->id, // Milik user lain!
            'movie_id' => $movie->id,
            'gross_amount' => 20000.00,
            'discount_amount' => 0.00,
            'net_amount' => 20000.00,
            'snap_token' => 'snap_secret',
            'payment_status' => 'paid',
            'snapshot_movie_data' => ['title' => 'Secret'],
        ]);

        // User aktif mencoba mengintip order milik user lain
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/checkout/orders/{$otherUserOrder->order_id}/status");

        // Wajib 404 (tidak ditemukan / tidak bocor keberadaannya)
        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ]);
    }

    public function test_checkout_routes_have_proper_throttle_middleware(): void
    {
        $routes = Route::getRoutes();

        $applyRoute = $routes->match(
            Request::create('/api/v1/checkout/voucher/apply', 'POST')
        );
        $this->assertContains('throttle:20,1', $applyRoute->gatherMiddleware());

        $statusRoute = $routes->match(
            Request::create('/api/v1/checkout/orders/SNM-TKT-123/status', 'GET')
        );
        $this->assertContains('throttle:60,1', $statusRoute->gatherMiddleware());

        $syncRoute = $routes->match(
            Request::create('/api/v1/checkout/orders/SNM-TKT-123/sync', 'POST')
        );
        $this->assertContains('throttle:30,1', $syncRoute->gatherMiddleware());
    }

    public function test_sync_order_status_marks_pending_ticket_as_paid_and_books_seats(): void
    {
        $event = Event::create([
            'title' => 'Event Sync Test',
            'slug' => 'event-sync-test',
            'synopsis_short' => 'Sinopsis',
            'description' => 'Deskripsi',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'poster_path' => 'posters/test.jpg',
            'backdrop_path' => 'backdrops/test.jpg',
            'banner_path' => 'banners/test.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Aturan'],
            'venue_name' => 'Venue Test',
            'cinema_partner' => 'Partner',
            'venue_address' => 'Alamat',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'studio_name' => 'Studio 1',
            'show_time' => now()->addDays(2),
            'ticket_price' => 50000.00,
            'total_seats' => 10,
            'is_active' => true,
        ]);

        $seat = Seat::create([
            'schedule_id' => $schedule->id,
            'row_label' => 'A',
            'seat_number' => 1,
            'seat_code' => 'A1',
            'seat_type' => 'standard',
            'status' => 'available',
        ]);

        $orderId = 'SNM-TKT-20260901-SYNC01';

        SeatLock::create([
            'schedule_id' => $schedule->id,
            'seat_id' => $seat->id,
            'user_id' => $this->user->id,
            'order_id' => $orderId,
            'quantity' => 1,
            'expires_at' => now()->addMinutes(15),
        ]);

        $order = EventTransaction::create([
            'order_id' => $orderId,
            'user_id' => $this->user->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'snap_token' => 'snap_sync_123',
            'payment_status' => 'pending',
            'snapshot_event_data' => ['event_title' => $event->title],
            'snapshot_seats' => ['A1'],
        ]);

        config(['services.midtrans.server_key' => 'SB-Mid-server-test-key']);
        config(['services.midtrans.is_production' => false]);
        Queue::fake();

        Http::fake([
            '*api.sandbox.midtrans.com/v2/'.$orderId.'/status*' => Http::response([
                'order_id' => $orderId,
                'status_code' => '200',
                'gross_amount' => '50000.00',
                'transaction_status' => 'settlement',
                'fraud_status' => 'accept',
                'payment_type' => 'qris',
            ], 200),
        ]);

        // Hit sync order endpoint TANPA body manipulatif (verifikasi Server-to-Server)
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/checkout/orders/{$orderId}/sync");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_id' => $orderId,
                    'item_type' => 'ticket',
                    'status' => 'paid',
                    'payment_type' => 'qris',
                ],
            ]);

        // Verifikasi database: order lunas, kursi booked, seat lock terhapus
        $order->refresh();
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals('booked', $seat->fresh()->status);
        $this->assertDatabaseMissing('seat_locks', ['order_id' => $orderId]);
    }

    public function test_sync_order_status_cannot_be_manipulated_by_client_payload_when_midtrans_is_pending(): void
    {
        $event = Event::create([
            'slug' => 'screening-anti-fraud-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Screening Anti Fraud Test',
            'description' => 'Deskripsi event',
            'synopsis_short' => 'Sinopsis singkat',
            'poster_path' => 'posters/test.jpg',
            'backdrop_path' => 'backdrops/test.jpg',
            'director' => 'Sutradara Test',
            'cast' => ['Aktor 1'],
            'rules' => ['Dilarang Merekam'],
            'city' => 'Jakarta Selatan',
            'venue_name' => 'XXI Plaza Senayan',
            'venue_address' => 'Jl. Asia Afrika',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(3),
            'ticket_price' => 50000.00,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        $seat = Seat::create([
            'schedule_id' => $schedule->id,
            'row_label' => 'B',
            'seat_number' => 1,
            'seat_code' => 'B1',
            'seat_type' => 'standard',
            'status' => 'available',
        ]);

        $orderId = 'SNM-TKT-HACK123';

        SeatLock::create([
            'schedule_id' => $schedule->id,
            'seat_id' => $seat->id,
            'user_id' => $this->user->id,
            'order_id' => $orderId,
            'expires_at' => now()->addMinutes(15),
        ]);

        $order = EventTransaction::create([
            'order_id' => $orderId,
            'user_id' => $this->user->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'snap_token' => 'snap_sync_hack',
            'payment_status' => 'pending',
            'snapshot_event_data' => ['event_title' => $event->title],
            'snapshot_seats' => ['B1'],
        ]);

        config(['services.midtrans.server_key' => 'SB-Mid-server-test-key']);
        config(['services.midtrans.is_production' => false]);

        // Mock Midtrans API: Pembayaran di Midtrans MASIH PENDING
        Http::fake([
            'https://api.sandbox.midtrans.com/v2/'.$orderId.'/status' => Http::response([
                'order_id' => $orderId,
                'status_code' => '201',
                'gross_amount' => '50000.00',
                'transaction_status' => 'pending',
            ], 200),
        ]);

        // Malicious client mencoba memanipulasi request body dengan mengirim settlement palsu
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/checkout/orders/{$orderId}/sync", [
                'transaction_status' => 'settlement',
                'fraud_status' => 'accept',
                'payment_type' => 'qris',
            ]);

        // Backend ZERO-TRUST menolak manipulasi client dan tetap mengembalikan pending
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_id' => $orderId,
                    'item_type' => 'ticket',
                    'status' => 'pending',
                ],
            ]);

        // Verifikasi database: order TETAP pending, kursi TETAP available, lock TIDAK lepas
        $order->refresh();
        $this->assertEquals('pending', $order->payment_status);
        $this->assertEquals('available', $seat->fresh()->status);
        $this->assertDatabaseHas('seat_locks', ['order_id' => $orderId]);
    }

    public function test_order_status_sync_marks_order_older_than_15_minutes_as_expired(): void
    {
        $event = Event::create([
            'slug' => 'screening-expire-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Screening Expire Test',
            'description' => 'Deskripsi event',
            'synopsis_short' => 'Sinopsis singkat',
            'poster_path' => 'posters/test.jpg',
            'backdrop_path' => 'backdrops/test.jpg',
            'director' => 'Sutradara Test',
            'cast' => ['Aktor 1'],
            'rules' => ['Dilarang Merekam'],
            'city' => 'Jakarta Selatan',
            'venue_name' => 'XXI Plaza Senayan',
            'venue_address' => 'Jl. Asia Afrika',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(3),
            'ticket_price' => 50000.00,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        $seat = Seat::create([
            'schedule_id' => $schedule->id,
            'row_label' => 'C',
            'seat_number' => 1,
            'seat_code' => 'C1',
            'seat_type' => 'standard',
            'status' => 'available',
        ]);

        $orderId = 'SNM-TKT-EXP123';

        SeatLock::create([
            'schedule_id' => $schedule->id,
            'seat_id' => $seat->id,
            'user_id' => $this->user->id,
            'order_id' => $orderId,
            'expires_at' => now()->subMinute(),
        ]);

        $order = EventTransaction::create([
            'order_id' => $orderId,
            'user_id' => $this->user->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'pending',
            'snapshot_event_data' => ['event_title' => $event->title],
            'snapshot_seats' => ['C1'],
        ]);

        DB::table('event_transactions')
            ->where('id', $order->id)
            ->update([
                'created_at' => now()->subMinutes(16),
                'updated_at' => now()->subMinutes(16),
            ]);

        // Cek status via sync endpoint (atau status polling biasa)
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/checkout/orders/{$orderId}/sync");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_id' => $orderId,
                    'item_type' => 'ticket',
                    'status' => 'expired',
                ],
            ]);

        // Verifikasi database: status berubah menjadi 'expired' dan seat lock terhapus
        $order->refresh();
        $this->assertEquals('expired', $order->payment_status);
        $this->assertDatabaseMissing('seat_locks', ['order_id' => $orderId]);
    }
}
