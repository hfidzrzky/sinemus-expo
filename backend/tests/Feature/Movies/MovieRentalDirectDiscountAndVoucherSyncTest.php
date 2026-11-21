<?php

namespace Tests\Feature\Movies;

use App\Models\Event;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\User;
use App\Models\Voucher;
use App\Services\Booking\SeatReservationService;
use App\Services\Checkout\MidtransSnapService;
use App\Services\Checkout\MovieRentalPaymentService;
use App\Services\Checkout\TicketPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;

class MovieRentalDirectDiscountAndVoucherSyncTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected Movie $movie;

    protected Voucher $directDiscountVoucher;

    protected Voucher $couponVoucher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'name' => 'Muhammad Hafidz',
            'email' => 'hafidz@example.com',
            'role' => 'customer',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        // 1. Film dengan harga mentah Rp 25.000
        $this->movie = Movie::create([
            'slug' => 'imtihan',
            'title' => 'IMTIHAN',
            'synopsis' => 'Kisah santri menempuh ujian kehidupan.',
            'poster_path' => 'cf_img_imtihan_poster',
            'backdrop_path' => 'cf_img_imtihan_backdrop',
            'director' => 'Sutradara Santri',
            'cast' => ['Aktor A', 'Aktor B'],
            'genre' => 'Drama',
            'duration_minutes' => 90,
            'price' => 25000,
            'rental_duration_hours' => 48,
            'access_model' => 'rental',
            'cloudflare_trailer_uid' => 'trailer_imtihan_cf_uid_123',
            'cloudflare_video_uid' => 'video_imtihan_cf_uid_master',
            'release_year' => 2026,
            'age_rating' => '13+',
            'is_published' => true,
        ]);

        // 2. Promo Direct Discount (Coret Harga): Potongan Rp 5.000 untuk film IMTIHAN
        $this->directDiscountVoucher = Voucher::create([
            'code' => 'CORETMTN5K',
            'name' => 'Promo Coret Harga Imtihan',
            'promo_type' => 'direct_discount',
            'discount_type' => 'slashed_price',
            'discount_value' => 5000,
            'min_purchase' => 0,
            'max_discount' => 5000,
            'quota_total' => 1000,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
            'item_type' => 'movie_rental',
            'movie_id' => $this->movie->id,
            'is_active' => true,
        ]);

        // 3. Kupon Promo Voucher Manual: PROMOFILM (Fixed Diskon Rp 5.000)
        $this->couponVoucher = Voucher::create([
            'code' => 'PROMOFILM',
            'name' => 'Kupon Promo Film 5 Ribu',
            'promo_type' => 'voucher_code',
            'discount_type' => 'fixed',
            'discount_value' => 5000,
            'min_purchase' => 15000,
            'max_discount' => 5000,
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
            'item_type' => 'movie_rental',
            'movie_id' => $this->movie->id,
            'is_active' => true,
        ]);
    }

    public function test_movie_rental_without_coupon_charges_effective_catalog_price_20000(): void
    {
        $capturedPayload = null;
        $this->mock(MidtransSnapService::class, function (MockInterface $mock) use (&$capturedPayload) {
            $mock->shouldReceive('createTransaction')
                ->once()
                ->andReturnUsing(function ($payload) use (&$capturedPayload) {
                    $capturedPayload = $payload;

                    return [
                        'token' => 'mock_snap_token_20000',
                        'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/mock_20000',
                    ];
                });
        });

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/movies/{$this->movie->id}/rent");

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.gross_amount', 20000)
            ->assertJsonPath('data.discount_amount', 0)
            ->assertJsonPath('data.net_amount', 20000);

        $this->assertNotNull($capturedPayload);
        $this->assertEquals(20000, $capturedPayload['transaction_details']['gross_amount']);
        $this->assertEquals(20000, $capturedPayload['item_details'][0]['price']);
    }

    public function test_movie_rental_with_coupon_stacks_on_catalog_price_and_charges_15000(): void
    {
        $capturedPayload = null;
        $this->mock(MidtransSnapService::class, function (MockInterface $mock) use (&$capturedPayload) {
            $mock->shouldReceive('createTransaction')
                ->once()
                ->andReturnUsing(function ($payload) use (&$capturedPayload) {
                    $capturedPayload = $payload;

                    return [
                        'token' => 'mock_snap_token_15000',
                        'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/mock_15000',
                    ];
                });
        });

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/movies/{$this->movie->id}/rent", [
                'voucher_code' => 'PROMOFILM',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.gross_amount', 20000)
            ->assertJsonPath('data.discount_amount', 5000)
            ->assertJsonPath('data.net_amount', 15000);

        $this->assertNotNull($capturedPayload);
        // Tagihan Midtrans Snap WAJIB persis Rp 15.000 sesuai Total Tagihan di modal
        $this->assertEquals(15000, $capturedPayload['transaction_details']['gross_amount']);
        $this->assertEquals(20000, $capturedPayload['item_details'][0]['price']);
        $this->assertEquals(-5000, $capturedPayload['item_details'][1]['price']);

        $orderId = $response->json('data.order_id');
        $trx = MovieTransaction::where('order_id', $orderId)->first();
        $this->assertNotNull($trx);
        $this->assertEquals(20000, (float) $trx->gross_amount);
        $this->assertEquals(5000, (float) $trx->discount_amount);
        $this->assertEquals(15000, (float) $trx->net_amount);
        $this->assertEquals($this->couponVoucher->id, $trx->voucher_id);

        $snapshot = $trx->snapshot_movie_data;
        $this->assertEquals(20000, $snapshot['price']);
        $this->assertEquals(25000, $snapshot['raw_price']);
        $this->assertEquals(5000, $snapshot['direct_discount_amount']);
        $this->assertEquals($this->directDiscountVoucher->id, $snapshot['direct_discount_voucher_id']);
        $this->assertEquals('PROMOFILM', $snapshot['coupon_code']);
        $this->assertEquals(5000, $snapshot['coupon_discount_amount']);

        // Verifikasi pelunasan webhook/sync meningkatkan kuota kedua voucher (kupon dan direct discount)
        $paymentService = app(MovieRentalPaymentService::class);
        $paymentService->handleNotification([
            'order_id' => $orderId,
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
        ]);

        $this->assertEquals(1, $this->couponVoucher->fresh()->quota_used);
        $this->assertEquals(1, $this->directDiscountVoucher->fresh()->quota_used);
    }

    public function test_movie_rental_with_percentage_coupon_calculates_against_catalog_price(): void
    {
        // Kupon persen 10%
        $percentVoucher = Voucher::create([
            'code' => 'DISKON10',
            'name' => 'Diskon 10 Persen',
            'promo_type' => 'voucher_code',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 10000,
            'max_discount' => 10000,
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
            'item_type' => 'movie_rental',
            'is_active' => true,
        ]);

        $capturedPayload = null;
        $this->mock(MidtransSnapService::class, function (MockInterface $mock) use (&$capturedPayload) {
            $mock->shouldReceive('createTransaction')
                ->once()
                ->andReturnUsing(function ($payload) use (&$capturedPayload) {
                    $capturedPayload = $payload;

                    return [
                        'token' => 'mock_snap_token_18000',
                        'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/mock_18000',
                    ];
                });
        });

        // 10% dari harga katalog Rp 20.000 = Rp 2.000 -> Net = Rp 18.000
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/movies/{$this->movie->id}/rent", [
                'voucher_code' => 'DISKON10',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.gross_amount', 20000)
            ->assertJsonPath('data.discount_amount', 2000)
            ->assertJsonPath('data.net_amount', 18000);

        $this->assertNotNull($capturedPayload);
        $this->assertEquals(18000, $capturedPayload['transaction_details']['gross_amount']);
    }

    public function test_event_ticket_reservation_stacks_direct_discount_and_coupon_voucher(): void
    {
        $event = Event::create([
            'slug' => 'festival-film-santri',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Festival Film Santri',
            'description' => 'Deskripsi festival film.',
            'synopsis_short' => 'Pemutaran film layar tancap.',
            'poster_path' => 'cf_img_event_poster',
            'backdrop_path' => 'cf_img_event_backdrop',
            'director' => 'Sutradara Santri',
            'cast' => ['Aktor 1', 'Aktor 2'],
            'rules' => ['Dilarang Merokok'],
            'venue_name' => 'Auditorium Utama',
            'venue_address' => 'Jl. Pesantren No. 10',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(2),
            'ticket_price' => 25000,
            'total_seats' => 50,
            'studio_name' => 'Auditorium Utama',
            'is_active' => true,
        ]);

        $seat1 = Seat::create([
            'schedule_id' => $schedule->id,
            'row_label' => 'A',
            'seat_number' => 1,
            'seat_code' => 'A1',
            'seat_type' => 'standard',
            'status' => 'available',
        ]);

        // Direct discount Rp 5.000 untuk event ticket
        $eventDirectVoucher = Voucher::create([
            'code' => 'DIRECTEVT5K',
            'name' => 'Promo Tiket Santri',
            'promo_type' => 'direct_discount',
            'discount_type' => 'slashed_price',
            'discount_value' => 5000,
            'min_purchase' => 0,
            'max_discount' => 5000,
            'quota_total' => 1000,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
            'item_type' => 'ticket',
            'event_id' => $event->id,
            'is_active' => true,
        ]);

        // Kupon voucher Rp 5.000
        $eventCoupon = Voucher::create([
            'code' => 'TIKETHEMAT',
            'name' => 'Kupon Tiket 5 Ribu',
            'promo_type' => 'voucher_code',
            'discount_type' => 'fixed',
            'discount_value' => 5000,
            'min_purchase' => 15000,
            'max_discount' => 5000,
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
            'item_type' => 'ticket',
            'event_id' => $event->id,
            'is_active' => true,
        ]);

        $reservationService = app(SeatReservationService::class);

        // 1. Reservasi awal tanpa kupon
        $res1 = $reservationService->reserve(
            user: $this->customer,
            scheduleId: $schedule->id,
            seatIds: [$seat1->id],
            quantity: 1,
            voucherCode: null
        );

        // Harga katalog = Rp 20.000 (25.000 - 5.000 direct discount)
        $this->assertEquals(20000, $res1['gross_amount']);
        $this->assertEquals(0, $res1['discount_amount']);
        $this->assertEquals(20000, $res1['net_amount']);

        // 2. Re-entry dengan menerapkan kupon TIKETHEMAT
        $res2 = $reservationService->reserve(
            user: $this->customer,
            scheduleId: $schedule->id,
            seatIds: [$seat1->id],
            quantity: 1,
            voucherCode: 'TIKETHEMAT'
        );

        $this->assertEquals(20000, $res2['gross_amount']);
        $this->assertEquals(5000, $res2['discount_amount']);
        $this->assertEquals(15000, $res2['net_amount']);

        // 3. Re-entry dengan menghapus kupon
        $res3 = $reservationService->reserve(
            user: $this->customer,
            scheduleId: $schedule->id,
            seatIds: [$seat1->id],
            quantity: 1,
            voucherCode: null
        );

        $this->assertEquals(20000, $res3['gross_amount']);
        $this->assertEquals(0, $res3['discount_amount']);
        $this->assertEquals(20000, $res3['net_amount']);

        // 4. Pasang kembali kupon TIKETHEMAT dan verifikasi pelunasan tiket meng-increment kedua kuota voucher
        $res4 = $reservationService->reserve(
            user: $this->customer,
            scheduleId: $schedule->id,
            seatIds: [$seat1->id],
            quantity: 1,
            voucherCode: 'TIKETHEMAT'
        );
        $orderId = $res4['order_id'];

        $ticketPaymentService = app(TicketPaymentService::class);
        $ticketPaymentService->handleNotification([
            'order_id' => $orderId,
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
        ]);

        $this->assertEquals(1, $eventCoupon->fresh()->quota_used);
        $this->assertEquals(1, $eventDirectVoucher->fresh()->quota_used);
    }
}
