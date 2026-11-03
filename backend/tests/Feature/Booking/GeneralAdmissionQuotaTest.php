<?php

namespace Tests\Feature\Booking;

use App\Models\Event;
use App\Models\Schedule;
use App\Models\SeatLock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class GeneralAdmissionQuotaTest extends TestCase
{
    use RefreshDatabase;

    protected User $user1;

    protected User $user2;

    protected User $user3;

    protected Event $event;

    protected Schedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user1 = User::factory()->create(['name' => 'Penonton 1', 'email' => 'user1@sinemus.id']);
        $this->user2 = User::factory()->create(['name' => 'Penonton 2', 'email' => 'user2@sinemus.id']);
        $this->user3 = User::factory()->create(['name' => 'Penonton 3', 'email' => 'user3@sinemus.id']);

        $this->event = Event::create([
            'slug' => 'pesta-sinema-festival',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Pesta Sinema Festival Komunitas',
            'description' => 'Screening outdoor terbuka tanpa penomoran kursi',
            'synopsis_short' => 'Festival film pendek karya sineas muda',
            'poster_path' => 'festival-poster.jpg',
            'backdrop_path' => 'festival-backdrop.jpg',
            'director' => 'Komite Film',
            'cast' => ['Komunitas A', 'Komunitas B'],
            'rules' => ['Bawa tikar sendiri'],
            'venue_name' => 'Taman Budaya',
            'cinema_partner' => null,
            'venue_address' => 'Jl. Kebudayaan No. 10',
            'city' => 'Bandung',
            'is_active' => true,
        ]);

        // Kapasitas sesi festival: 10 kuota penonton
        $this->schedule = Schedule::create([
            'event_id' => $this->event->id,
            'studio_name' => 'Panggung Terbuka',
            'show_time' => now()->addDays(3)->setTime(18, 30),
            'ticket_price' => 35000.00,
            'total_seats' => 10,
            'is_active' => true,
        ]);
    }

    public function test_can_reserve_general_admission_quota_successfully(): void
    {
        $response = $this->actingAs($this->user1, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'quantity' => 3,
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
                    'event_title' => 'Pesta Sinema Festival Komunitas',
                    'locked_seats' => [],
                    'gross_amount' => 105000.00,
                    'net_amount' => 105000.00,
                ],
            ]);

        $orderId = $response->json('data.order_id');

        // Pastikan seat_locks menyimpan kuota dengan seat_id = null
        $this->assertDatabaseHas('seat_locks', [
            'schedule_id' => $this->schedule->id,
            'seat_id' => null,
            'user_id' => $this->user1->id,
            'quantity' => 3,
            'order_id' => $orderId,
        ]);

        $this->assertDatabaseHas('event_transactions', [
            'order_id' => $orderId,
            'ticket_quantity' => 3,
            'gross_amount' => 105000.00,
            'payment_status' => 'pending',
        ]);
    }

    public function test_cannot_exceed_available_general_admission_quota(): void
    {
        // User 1 memesan 5 tiket dari total 10 kuota
        $this->actingAs($this->user1, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'quantity' => 5,
            ])
            ->assertStatus(201);

        // User 2 memesan 4 tiket (sisa kuota tinggal 1)
        $this->actingAs($this->user2, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'quantity' => 4,
            ])
            ->assertStatus(201);

        // User 3 mencoba memesan 2 tiket (kuota tersisa hanya 1)
        $response = $this->actingAs($this->user3, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'quantity' => 2,
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error_code' => 'SEAT_ALREADY_LOCKED',
            ]);

        // User 3 memesan 1 tiket yang tersisa -> Sukses
        $this->actingAs($this->user3, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'quantity' => 1,
            ])
            ->assertStatus(201);

        // Penonton berikutnya mencoba memesan 1 tiket lagi saat kuota habis -> 409
        $user4 = User::factory()->create();
        $this->actingAs($user4, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'quantity' => 1,
            ])
            ->assertStatus(409);
    }

    public function test_pruning_expired_locks_frees_general_admission_quota(): void
    {
        // User 1 memesan 6 kuota tiket (batas maksimal per transaksi)
        $res1 = $this->actingAs($this->user1, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'quantity' => 6,
            ]);
        $res1->assertStatus(201);
        $orderId1 = $res1->json('data.order_id');

        // User 2 memesan 4 kuota tiket (kapasitas penuh 10/10)
        $this->actingAs($this->user2, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'quantity' => 4,
            ])
            ->assertStatus(201);

        // User 3 mencoba memesan 2 tiket -> Ditolak (kapasitas penuh)
        $this->actingAs($this->user3, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'quantity' => 2,
            ])
            ->assertStatus(409);

        // Simulasikan kunci User 1 kedaluwarsa (16 menit yang lalu)
        SeatLock::where('order_id', $orderId1)->update([
            'expires_at' => now()->subMinutes(16),
        ]);

        // Jalankan scheduled task command pembersihan kunci kedaluwarsa
        $exitCode = Artisan::call('bookings:prune-expired-locks');
        $this->assertEquals(0, $exitCode);

        // Pastikan seat_locks milik User 1 sudah terhapus
        $this->assertDatabaseMissing('seat_locks', [
            'order_id' => $orderId1,
        ]);

        // Pastikan transaksi milik User 1 beralih status menjadi 'expired'
        $this->assertDatabaseHas('event_transactions', [
            'order_id' => $orderId1,
            'payment_status' => 'expired',
        ]);

        // Sekarang User 3 memesan 2 tiket -> Berhasil karena 8 kuota telah dibebaskan
        $res3 = $this->actingAs($this->user3, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'quantity' => 2,
            ]);
        $res3->assertStatus(201);
    }

    public function test_general_admission_fails_validation_when_quantity_is_missing(): void
    {
        $this->actingAs($this->user1, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);
    }
}
