<?php

namespace Tests\Feature\Booking;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\SeatLock;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ConcurrencyBookingTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Event $event;

    protected Schedule $schedule;

    /** @var array<int, Seat> */
    protected array $seats = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'buyer@sinemus.id',
            'name' => 'Buyer Satu',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        $this->event = Event::create([
            'slug' => 'pahlawan-film-screening',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Pahlawan: Special Screening',
            'description' => 'Screening eksklusif bioskop',
            'synopsis_short' => 'Sinopsis film pahlawan',
            'poster_path' => 'poster.jpg',
            'backdrop_path' => 'backdrop.jpg',
            'director' => 'Sutradara Handal',
            'cast' => ['Aktor A', 'Aktor B'],
            'rules' => ['Dilarang merekam'],
            'venue_name' => 'Cinema XXI Epicentrum',
            'cinema_partner' => 'Cinema XXI',
            'venue_address' => 'Kuningan, Jakarta Selatan',
            'city' => 'Jakarta Selatan',
            'is_active' => true,
        ]);

        $this->schedule = Schedule::create([
            'event_id' => $this->event->id,
            'studio_name' => 'Studio 1 Premiere',
            'show_time' => now()->addDays(5)->setTime(19, 0),
            'ticket_price' => 50000.00,
            'total_seats' => 20,
            'is_active' => true,
        ]);

        // Buat 10 kursi A1 - A10
        for ($i = 1; $i <= 10; $i++) {
            $this->seats[$i] = Seat::create([
                'schedule_id' => $this->schedule->id,
                'row_label' => 'A',
                'seat_number' => $i,
                'seat_code' => 'A'.$i,
                'seat_type' => 'standard',
                'status' => 'available',
            ]);
        }
    }

    public function test_single_user_can_reserve_seats_with_15_minute_lock_and_draft_transaction(): void
    {
        $selectedSeatIds = [$this->seats[1]->id, $this->seats[2]->id];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => $selectedSeatIds,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'order_id',
                    'snap_token',
                    'event_title',
                    'locked_seats',
                    'gross_amount',
                    'discount_amount',
                    'net_amount',
                    'expires_at',
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'event_title' => 'Pahlawan: Special Screening',
                    'locked_seats' => ['A1', 'A2'],
                    'gross_amount' => 100000.00,
                    'discount_amount' => 0.00,
                    'net_amount' => 100000.00,
                ],
            ]);

        $orderId = $response->json('data.order_id');
        $this->assertStringStartsWith('SNM-TKT-', $orderId);

        // Verifikasi tabel seat_locks
        $this->assertDatabaseCount('seat_locks', 2);
        $this->assertDatabaseHas('seat_locks', [
            'schedule_id' => $this->schedule->id,
            'seat_id' => $this->seats[1]->id,
            'user_id' => $this->user->id,
            'order_id' => $orderId,
            'quantity' => 1,
        ]);

        // Verifikasi tabel event_transactions
        $this->assertDatabaseHas('event_transactions', [
            'order_id' => $orderId,
            'user_id' => $this->user->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 100000.00,
            'net_amount' => 100000.00,
            'payment_status' => 'pending',
        ]);
    }

    public function test_second_user_attempting_to_lock_same_seat_is_rejected_with_409(): void
    {
        /** @var User $otherUser */
        $otherUser = User::factory()->create();

        // User 1 mengunci kursi A1 dan A2
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[1]->id, $this->seats[2]->id],
            ])
            ->assertStatus(201);

        // User 2 mencoba mengunci kursi A2 dan A3 (kursi A2 tumpang tindih)
        $response = $this->actingAs($otherUser, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[2]->id, $this->seats[3]->id],
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error_code' => 'SEAT_ALREADY_LOCKED',
            ]);

        // Pastikan kursi A3 tidak ikut terkunci akibat rollback transaksi
        $this->assertDatabaseMissing('seat_locks', [
            'seat_id' => $this->seats[3]->id,
        ]);
    }

    public function test_simulation_of_50_concurrent_requests_for_same_seat_yields_exactly_one_success(): void
    {
        $targetSeatId = $this->seats[5]->id; // Berebut kursi A5
        $users = User::factory()->count(50)->create();

        $successCount = 0;
        $conflictCount = 0;

        foreach ($users as $buyer) {
            $response = $this->actingAs($buyer, 'sanctum')
                ->postJson('/api/v1/bookings/reserve', [
                    'schedule_id' => $this->schedule->id,
                    'seat_ids' => [$targetSeatId],
                ]);

            if ($response->status() === 201) {
                $successCount++;
            } elseif ($response->status() === 409) {
                $conflictCount++;
                $response->assertJson([
                    'success' => false,
                    'error_code' => 'SEAT_ALREADY_LOCKED',
                ]);
            }
        }

        // Tepat 1 user sukses dan 49 user lainnya tertolak dengan 409 SEAT_ALREADY_LOCKED
        $this->assertEquals(1, $successCount, 'Tepat 1 pemesan yang berhasil mengunci kursi.');
        $this->assertEquals(49, $conflictCount, '49 pemesan lainnya harus ditolak HTTP 409.');
        $this->assertDatabaseCount('seat_locks', 1);
        $this->assertDatabaseCount('event_transactions', 1);
    }

    public function test_deterministic_ordering_handles_unsorted_seat_ids_safely(): void
    {
        // Mengirim seat_ids secara acak / terbalik: [A4, A1, A3]
        $unsortedSeatIds = [$this->seats[4]->id, $this->seats[1]->id, $this->seats[3]->id];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => $unsortedSeatIds,
            ]);

        $response->assertStatus(201);
        // Hasil output locked_seats harus terurut rapi [A1, A3, A4]
        $this->assertEquals(['A1', 'A3', 'A4'], $response->json('data.locked_seats'));
    }

    public function test_cannot_reserve_physically_booked_or_disabled_seats(): void
    {
        $this->seats[1]->update(['status' => 'booked']);
        $this->seats[2]->update(['status' => 'disabled']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[1]->id],
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error_code' => 'SEAT_ALREADY_LOCKED',
            ]);

        $response2 = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[2]->id],
            ]);

        $response2->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error_code' => 'SEAT_ALREADY_LOCKED',
            ]);
    }

    public function test_expired_seat_lock_allows_new_user_to_reserve(): void
    {
        $otherUser = User::factory()->create();

        // Buat kunci yang sudah kedaluwarsa 10 menit lalu
        SeatLock::create([
            'schedule_id' => $this->schedule->id,
            'seat_id' => $this->seats[1]->id,
            'user_id' => $otherUser->id,
            'quantity' => 1,
            'order_id' => 'SNM-TKT-20260901-EXPD01',
            'expires_at' => now()->subMinutes(10),
        ]);

        // User baru harus bisa mengunci kursi tersebut
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[1]->id],
            ]);

        $response->assertStatus(201);
    }

    public function test_voucher_discount_is_applied_correctly_to_net_amount(): void
    {
        $voucher = Voucher::create([
            'code' => 'HEMAT20K',
            'discount_type' => 'fixed',
            'discount_value' => 20000.00,
            'min_purchase' => 50000.00,
            'max_discount' => 20000.00,
            'item_type' => 'ticket',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[1]->id, $this->seats[2]->id],
                'voucher_code' => 'HEMAT20K',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'gross_amount' => 100000.00,
                    'discount_amount' => 20000.00,
                    'net_amount' => 80000.00,
                ],
            ]);

        $this->assertDatabaseHas('event_transactions', [
            'voucher_id' => $voucher->id,
            'discount_amount' => 20000.00,
            'net_amount' => 80000.00,
        ]);
    }

    public function test_unauthenticated_request_is_rejected_with_401(): void
    {
        $this->postJson('/api/v1/bookings/reserve', [
            'schedule_id' => $this->schedule->id,
            'seat_ids' => [$this->seats[1]->id],
        ])->assertStatus(401);
    }

    public function test_exceeding_max_seats_per_booking_fails_validation(): void
    {
        // Mencoba memesan 7 kursi (maksimal 6)
        $seatIds = [
            $this->seats[1]->id,
            $this->seats[2]->id,
            $this->seats[3]->id,
            $this->seats[4]->id,
            $this->seats[5]->id,
            $this->seats[6]->id,
            $this->seats[7]->id,
        ];

        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => $seatIds,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['seat_ids']);
    }

    public function test_booking_route_has_throttle_middleware(): void
    {
        $routes = Route::getRoutes();
        $route = $routes->match(
            Request::create('/api/v1/bookings/reserve', 'POST')
        );

        $this->assertContains('throttle:10,1', $route->gatherMiddleware());
    }

    public function test_same_user_reopening_modal_resumes_existing_active_reservation_without_409(): void
    {
        $selectedSeatIds = [$this->seats[1]->id, $this->seats[2]->id];

        // 1. First reservation call (e.g. user opens modal)
        $firstResponse = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => $selectedSeatIds,
            ]);

        $firstResponse->assertStatus(201);
        $orderId = $firstResponse->json('data.order_id');
        $snapToken = $firstResponse->json('data.snap_token');

        // 2. Second reservation call by same user with same seats (e.g. user closed modal/snap and reopened)
        $secondResponse = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => $selectedSeatIds,
            ]);

        // Must succeed without 409 and return the SAME order_id & snap_token
        $secondResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_id' => $orderId,
                    'snap_token' => $snapToken,
                    'net_amount' => 100000.00,
                ],
            ]);

        // Locks in DB should remain exactly 2, not duplicated
        $this->assertDatabaseCount('seat_locks', 2);
    }

    public function test_same_user_can_apply_voucher_to_existing_active_reservation(): void
    {
        // Setup voucher
        Voucher::create([
            'code' => 'REOPEN10',
            'discount_type' => 'percentage',
            'discount_value' => 10.00,
            'max_discount' => 50000.00,
            'min_purchase' => 0.00,
            'item_type' => 'ticket',
            'quota_total' => 100,
            'quota_used' => 0,
            'is_active' => true,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDay(),
        ]);

        $selectedSeatIds = [$this->seats[1]->id];

        // 1. Initial reservation without voucher
        $res1 = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => $selectedSeatIds,
            ]);
        $res1->assertStatus(201);
        $orderId = $res1->json('data.order_id');
        $this->assertEquals(50000.00, $res1->json('data.net_amount'));

        // 2. Same user applies voucher to existing reservation
        $res2 = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => $selectedSeatIds,
                'voucher_code' => 'REOPEN10',
            ]);

        $res2->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_id' => $orderId,
                    'discount_amount' => 5000.00,
                    'net_amount' => 45000.00,
                ],
            ]);
    }

    public function test_stale_pending_transaction_is_marked_as_expired_when_user_makes_new_reservation(): void
    {
        // 1. Buat transaksi tiket pending lama (> 15 menit) milik user
        $staleOrderId = 'SNM-TKT-STALE123';
        $staleOrder = EventTransaction::create([
            'order_id' => $staleOrderId,
            'user_id' => $this->user->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'pending',
            'snapshot_event_data' => ['event_title' => 'Test Event'],
            'snapshot_seats' => ['A1'],
        ]);

        DB::table('event_transactions')
            ->where('id', $staleOrder->id)
            ->update([
                'created_at' => now()->subMinutes(16),
                'updated_at' => now()->subMinutes(16),
            ]);

        // 2. User melakukan reservasi kursi baru
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[2]->id],
            ]);

        $response->assertStatus(201);

        // 3. Verifikasi transaksi lama otomatis beralih ke status 'expired' untuk pencatatan keuangan yang bersih
        $staleOrder->refresh();
        $this->assertEquals('expired', $staleOrder->payment_status);
    }

    public function test_booking_rejects_reservation_outside_sales_window(): void
    {
        // 1. Penjualan belum dibuka (future start date)
        $this->event->update([
            'sales_start_at' => now()->addDays(2),
            'sales_end_at' => now()->addDays(5),
        ]);

        $resBefore = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[3]->id],
            ]);

        $resBefore->assertStatus(409)
            ->assertJson([
                'success' => false,
            ]);
        $this->assertStringContainsString('Pemesanan tiket belum dibuka', $resBefore->json('message'));

        // 2. Penjualan sudah berakhir (past end date)
        $this->event->update([
            'sales_start_at' => now()->subDays(5),
            'sales_end_at' => now()->subDay(),
        ]);

        $resAfter = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[3]->id],
            ]);

        $resAfter->assertStatus(409)
            ->assertJson([
                'success' => false,
            ]);
        $this->assertStringContainsString('Periode penjualan tiket telah berakhir', $resAfter->json('message'));

        // 3. Penjualan sedang berlangsung (live)
        $this->event->update([
            'sales_start_at' => now()->subDay(),
            'sales_end_at' => now()->addDays(2),
        ]);

        $resActive = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[3]->id],
            ]);

        $resActive->assertStatus(201)
            ->assertJson(['success' => true]);
    }

    public function test_dynamic_pricing_for_vip_and_regular_seats(): void
    {
        // Set event aktif & schedule dengan vip_ticket_price
        $this->event->update([
            'sales_start_at' => now()->subDay(),
            'sales_end_at' => now()->addDays(5),
        ]);

        $this->schedule->update([
            'ticket_price' => 50000.00,
            'vip_ticket_price' => 85000.00,
        ]);

        // Jadikan kursi A4 sebagai VIP
        $this->seats[4]->update(['seat_type' => 'vip']);
        // Kursi A5 tetap standard / reguler
        $this->seats[5]->update(['seat_type' => 'standard']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seats[4]->id, $this->seats[5]->id],
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    // Kursi VIP (85.000) + Kursi Reguler (50.000) = 135.000
                    'gross_amount' => 135000.00,
                    'net_amount' => 135000.00,
                    'locked_seats' => ['A4', 'A5'],
                ],
            ]);

        // Verifikasi transaksi database
        $this->assertDatabaseHas('event_transactions', [
            'order_id' => $response->json('data.order_id'),
            'gross_amount' => 135000.00,
            'net_amount' => 135000.00,
        ]);
    }
}
