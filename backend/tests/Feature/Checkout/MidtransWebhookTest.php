<?php

namespace Tests\Feature\Checkout;

use App\Jobs\GenerateTicketPdfJob;
use App\Jobs\SendTransactionEmailJob;
use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\SeatLock;
use App\Models\User;
use App\Models\UserMovieAccess;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class MidtransWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected string $serverKey = 'SB-Mid-server-test-key-sample-12345';

    protected User $user;

    protected Event $event;

    protected Schedule $schedule;

    /** @var array<int, Seat> */
    protected array $seats = [];

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.midtrans.server_key' => $this->serverKey]);

        $this->user = User::factory()->create([
            'email' => 'penonton@sinemus.id',
            'name' => 'Penonton Setia',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        $this->event = Event::create([
            'slug' => 'cinta-dan-sejarah-screening',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Cinta dan Sejarah',
            'description' => 'Presale screening eksklusif bioskop CDS',
            'synopsis_short' => 'Film cinta dan sejarah bangsa.',
            'poster_path' => 'posters/cds.jpg',
            'backdrop_path' => 'backdrops/cds.jpg',
            'director' => 'Sutradara Handal',
            'cast' => ['Aktor 1', 'Aktris 1'],
            'rules' => ['Dilarang membawa makanan luar'],
            'venue_name' => 'Cinema XXI Plaza Senayan',
            'cinema_partner' => 'Cinema XXI',
            'venue_address' => 'Plaza Senayan Lt. 5, Jakarta Pusat',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $this->schedule = Schedule::create([
            'event_id' => $this->event->id,
            'show_time' => now()->addDays(5)->setTime(19, 0),
            'ticket_price' => 50000.00,
            'total_seats' => 50,
            'is_active' => true,
        ]);

        for ($i = 1; $i <= 2; $i++) {
            $this->seats[$i] = Seat::create([
                'schedule_id' => $this->schedule->id,
                'row_label' => 'A',
                'seat_number' => $i,
                'seat_code' => "A{$i}",
                'seat_type' => 'standard',
                'status' => 'available',
            ]);
        }
    }

    /**
     * Helper untuk menghitung SHA-512 signature Midtrans secara valid.
     */
    protected function generateSignature(string $orderId, string $statusCode, string $grossAmount): string
    {
        return hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);
    }

    /**
     * Helper untuk membuat transaksi tiket berstatus pending beserta penguncian kursinya.
     */
    protected function createPendingTicketTransaction(string $orderId = 'SNM-TKT-20260901-0001'): EventTransaction
    {
        $transaction = EventTransaction::create([
            'order_id' => $orderId,
            'user_id' => $this->user->id,
            'schedule_id' => $this->schedule->id,
            'voucher_id' => null,
            'ticket_quantity' => 2,
            'gross_amount' => 100000.00,
            'discount_amount' => 0.00,
            'net_amount' => 100000.00,
            'snap_token' => 'snap_sample_token_123',
            'payment_status' => 'pending',
            'snapshot_event_data' => [
                'event_title' => $this->event->title,
                'venue_name' => $this->event->venue_name,
            ],
            'snapshot_seats' => ['A1', 'A2'],
        ]);

        foreach ($this->seats as $seat) {
            SeatLock::create([
                'schedule_id' => $this->schedule->id,
                'seat_id' => $seat->id,
                'user_id' => $this->user->id,
                'quantity' => 1,
                'order_id' => $orderId,
                'expires_at' => now()->addMinutes(15),
            ]);
        }

        return $transaction;
    }

    public function test_rejects_webhook_with_invalid_signature(): void
    {
        $payload = [
            'order_id' => 'SNM-TKT-20260901-0001',
            'status_code' => '200',
            'gross_amount' => '100000.00',
            'signature_key' => 'invalid_signature_hash_manipulation_attempt',
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
        ];

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Signature key webhook Midtrans tidak valid.',
            ]);
    }

    public function test_rejects_webhook_with_missing_required_fields(): void
    {
        $payload = [
            'order_id' => 'SNM-TKT-20260901-0001',
            // missing status_code, gross_amount, signature_key, transaction_status
        ];

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status_code', 'gross_amount', 'signature_key', 'transaction_status']);
    }

    public function test_settlement_webhook_marks_ticket_as_paid_and_books_seats(): void
    {
        Queue::fake();

        $orderId = 'SNM-TKT-20260901-0001';
        $this->createPendingTicketTransaction($orderId);

        $grossAmount = '100000.00';
        $statusCode = '200';
        $signature = $this->generateSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
        ];

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Pembayaran tiket berhasil dikonfirmasi! E-tiket digital Anda telah terbit dan siap digunakan.',
            ]);

        // Verifikasi mutasi transaksi
        $this->assertDatabaseHas('event_transactions', [
            'order_id' => $orderId,
            'payment_status' => 'paid',
            'payment_type' => 'qris',
            'fulfillment_status' => 'awaiting_cinema_ticket',
        ]);

        $transaction = EventTransaction::where('order_id', $orderId)->first();
        $this->assertNotNull($transaction->paid_at);
        $this->assertNotNull($transaction->ticket_code);
        $this->assertStringStartsWith('TKT-', $transaction->ticket_code);
        $this->assertNotNull($transaction->qr_hash);
        $this->assertEquals(32, strlen($transaction->qr_hash));

        // Verifikasi status fisik kursi menjadi 'booked'
        foreach ($this->seats as $seat) {
            $this->assertDatabaseHas('seats', [
                'id' => $seat->id,
                'status' => 'booked',
            ]);
        }

        // Verifikasi seat_locks terhapus
        $this->assertDatabaseMissing('seat_locks', [
            'order_id' => $orderId,
        ]);

        // Verifikasi Async Queue Jobs di-dispatch
        Queue::assertPushed(GenerateTicketPdfJob::class, function ($job) use ($transaction) {
            return $job->transactionId === $transaction->id;
        });

        Queue::assertPushed(SendTransactionEmailJob::class, function ($job) use ($transaction) {
            return $job->transactionId === $transaction->id;
        });
    }

    public function test_webhook_idempotency_ignores_subsequent_duplicate_calls(): void
    {
        Queue::fake();

        $orderId = 'SNM-TKT-20260901-0002';
        $this->createPendingTicketTransaction($orderId);

        $grossAmount = '100000.00';
        $statusCode = '200';
        $signature = $this->generateSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'payment_type' => 'bank_transfer',
        ];

        // Pemanggilan 1: Pelunasan pertama
        $response1 = $this->postJson('/api/v1/webhooks/midtrans', $payload);
        $response1->assertStatus(200)
            ->assertJson(['success' => true]);

        // Pemanggilan 2: Callback duplikat dari Midtrans (Retry #1)
        $response2 = $this->postJson('/api/v1/webhooks/midtrans', $payload);
        $response2->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Pembayaran tiket Anda sudah diverifikasi sebelumnya. E-tiket Anda sudah siap di menu Tiket Saya.',
            ]);

        // Pemanggilan 3: Callback duplikat dari Midtrans (Retry #2)
        $response3 = $this->postJson('/api/v1/webhooks/midtrans', $payload);
        $response3->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Pembayaran tiket Anda sudah diverifikasi sebelumnya. E-tiket Anda sudah siap di menu Tiket Saya.',
            ]);

        // Verifikasi status tetap 'paid' dan tidak ada efek samping duplikat
        $this->assertDatabaseHas('event_transactions', [
            'order_id' => $orderId,
            'payment_status' => 'paid',
        ]);

        // Verifikasi Jobs hanya di-dispatch TEPAT 1 KALI meskipun webhook dipanggil 3 kali
        Queue::assertPushed(GenerateTicketPdfJob::class, 1);
        Queue::assertPushed(SendTransactionEmailJob::class, 1);
    }

    public function test_expire_webhook_marks_ticket_as_expired_and_releases_seat_locks(): void
    {
        $orderId = 'SNM-TKT-20260901-0003';
        $this->createPendingTicketTransaction($orderId);

        $grossAmount = '100000.00';
        $statusCode = '202';
        $signature = $this->generateSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'expire',
            'payment_type' => 'qris',
        ];

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Waktu pembayaran telah kedaluwarsa. Kursi yang Anda pilih telah dilepaskan dan dapat dipesan kembali.',
            ]);

        // Verifikasi status transaksi expired
        $this->assertDatabaseHas('event_transactions', [
            'order_id' => $orderId,
            'payment_status' => 'expired',
        ]);

        // Verifikasi kunci kursi fisik dilepaskan
        $this->assertDatabaseMissing('seat_locks', [
            'order_id' => $orderId,
        ]);

        // Kursi fisik tetap berstatus 'available'
        foreach ($this->seats as $seat) {
            $this->assertDatabaseHas('seats', [
                'id' => $seat->id,
                'status' => 'available',
            ]);
        }
    }

    public function test_cancel_or_failure_webhook_marks_ticket_as_failed_and_releases_seat_locks(): void
    {
        $orderId = 'SNM-TKT-20260901-0004';
        $this->createPendingTicketTransaction($orderId);

        $grossAmount = '100000.00';
        $statusCode = '202';
        $signature = $this->generateSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'cancel',
            'payment_type' => 'gopay',
        ];

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Pembayaran tiket dibatalkan atau tidak berhasil. Silakan lakukan pemesanan ulang.',
            ]);

        $this->assertDatabaseHas('event_transactions', [
            'order_id' => $orderId,
            'payment_status' => 'failed',
        ]);

        $this->assertDatabaseMissing('seat_locks', [
            'order_id' => $orderId,
        ]);
    }

    public function test_capture_with_accept_fraud_status_marks_ticket_as_paid(): void
    {
        Queue::fake();

        $orderId = 'SNM-TKT-20260901-0005';
        $this->createPendingTicketTransaction($orderId);

        $grossAmount = '100000.00';
        $statusCode = '200';
        $signature = $this->generateSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'capture',
            'fraud_status' => 'accept',
            'payment_type' => 'credit_card',
        ];

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertStatus(200);

        $this->assertDatabaseHas('event_transactions', [
            'order_id' => $orderId,
            'payment_status' => 'paid',
        ]);
    }

    public function test_movie_rental_webhook_marks_as_paid_and_activates_access_for_48_hours(): void
    {
        $movie = Movie::create([
            'slug' => 'film-indie-keren',
            'title' => 'Film Indie Keren',
            'synopsis' => 'Sinopsis lengkap film indie keren.',
            'poster_path' => 'posters/film.jpg',
            'backdrop_path' => 'backdrops/film.jpg',
            'director' => 'Sutradara Keren',
            'cast' => ['Aktor Indie'],
            'genre' => 'Drama',
            'age_rating' => '13+',
            'access_model' => 'rental',
            'duration_minutes' => 95,
            'price' => 25000.00,
            'rental_duration_hours' => 48,
            'cloudflare_video_uid' => 'cf-video-sample-uid',
            'release_year' => 2026,
            'is_published' => true,
        ]);

        $orderId = 'SNM-VOD-20260901-0001';
        $transaction = MovieTransaction::create([
            'order_id' => $orderId,
            'user_id' => $this->user->id,
            'movie_id' => $movie->id,
            'gross_amount' => 25000.00,
            'discount_amount' => 0.00,
            'net_amount' => 25000.00,
            'payment_status' => 'pending',
            'snapshot_movie_data' => [
                'title' => $movie->title,
                'rental_price' => 25000.00,
            ],
        ]);

        $grossAmount = '25000.00';
        $statusCode = '200';
        $signature = $this->generateSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
        ];

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Pembayaran sewa film berhasil dikonfirmasi! Akses streaming film telah aktif selama 48 jam ke depan.',
            ]);

        // Verifikasi transaksi lunas
        $this->assertDatabaseHas('movie_transactions', [
            'order_id' => $orderId,
            'payment_status' => 'paid',
        ]);

        // Verifikasi record user_movie_access aktif 48 jam
        $this->assertDatabaseHas('user_movie_access', [
            'user_id' => $this->user->id,
            'movie_id' => $movie->id,
            'transaction_id' => $transaction->id,
            'access_status' => 'active',
        ]);

        $access = UserMovieAccess::where('transaction_id', $transaction->id)->first();
        $this->assertNotNull($access->rental_start_at);
        $this->assertNotNull($access->rental_expires_at);
        $this->assertTrue($access->rental_expires_at->gt(now()->addHours(47)));
    }

    public function test_settlement_webhook_increments_voucher_usage_if_present(): void
    {
        Queue::fake();

        $voucher = Voucher::create([
            'code' => 'DISKON10',
            'discount_type' => 'percentage',
            'discount_value' => 10.00,
            'min_purchase' => 50000.00,
            'max_discount' => 20000.00,
            'item_type' => 'ticket',
            'quota_total' => 10,
            'quota_used' => 2,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        $orderId = 'SNM-TKT-20260901-0006';
        $transaction = $this->createPendingTicketTransaction($orderId);
        $transaction->voucher_id = $voucher->id;
        $transaction->save();

        $grossAmount = '100000.00';
        $statusCode = '200';
        $signature = $this->generateSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
        ];

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);
        $response->assertStatus(200);

        // Kuota voucher bertambah dari 2 menjadi 3
        $this->assertDatabaseHas('vouchers', [
            'id' => $voucher->id,
            'quota_used' => 3,
        ]);
    }

    public function test_concurrent_webhook_and_client_sync_race_condition(): void
    {
        Queue::fake();

        $orderId = 'SNM-TKT-20260901-CONCURRENT';
        $transaction = $this->createPendingTicketTransaction($orderId);

        $grossAmount = '100000.00';
        $statusCode = '200';
        $signature = $this->generateSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
        ];

        // 1. Eksekusi pertama (misal: webhook Midtrans tiba duluan)
        $webhookResponse = $this->postJson('/api/v1/webhooks/midtrans', $payload);
        $webhookResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        // 2. Eksekusi kedua (client sync tiba hampir bersamaan saat order sudah di-settle)
        $syncResponse = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/checkout/orders/{$orderId}/sync");

        $syncResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_id' => $orderId,
                    'status' => 'paid',
                ],
            ]);

        // Verifikasi mutasi tunggal yang idempoten:
        // - Status tetap paid
        // - Kursi tetap booked
        // - Queue job PDF & Email hanya di-dispatch TEPAT 1x (tidak dobel)
        $this->assertEquals('paid', $transaction->fresh()->payment_status);
        Queue::assertPushed(GenerateTicketPdfJob::class, 1);
        Queue::assertPushed(SendTransactionEmailJob::class, 1);
    }

    public function test_webhook_route_has_throttle_middleware(): void
    {
        $routes = Route::getRoutes();
        $route = $routes->match(
            request()->create('/api/v1/webhooks/midtrans', 'POST')
        );

        $this->assertNotNull($route);
        $this->assertContains('throttle:60,1', $route->gatherMiddleware());
    }
}
