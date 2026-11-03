<?php

namespace Tests\Feature\Events;

use App\Models\Event;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\SeatLock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ScheduleSeatMapTest extends TestCase
{
    use RefreshDatabase;

    protected Event $event;

    protected Schedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->event = Event::create([
            'slug' => 'test-event-screening',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Test Screening Event',
            'description' => 'Deskripsi event',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'poster.jpg',
            'backdrop_path' => 'backdrop.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => ['Rule 1'],
            'venue_name' => 'Cinema XXI Senayan',
            'venue_address' => 'Plaza Senayan',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $this->schedule = Schedule::create([
            'event_id' => $this->event->id,
            'show_time' => '2026-11-28 19:00:00',
            'ticket_price' => 50000,
            'total_seats' => 56,
            'is_active' => true,
        ]);
    }

    public function test_can_get_seat_map_with_correct_dynamic_dimensions_and_contract_structure(): void
    {
        // Buat kursi dengan baris dinamis (A, B, C) dan kolom 1 s.d 4 (total 12 kursi)
        $rows = ['A', 'B', 'C'];
        foreach ($rows as $row) {
            for ($col = 1; $col <= 4; $col++) {
                Seat::create([
                    'schedule_id' => $this->schedule->id,
                    'row_label' => $row,
                    'seat_number' => $col,
                    'seat_code' => "{$row}{$col}",
                    'seat_type' => $row === 'A' ? 'vip' : 'standard',
                    'status' => 'available',
                ]);
            }
        }

        $response = $this->getJson("/api/v1/schedules/{$this->schedule->id}/seats");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'schedule_id',
                    'rows',
                    'cols',
                    'ticket_price',
                    'seats' => [
                        '*' => [
                            'id',
                            'row_label',
                            'seat_number',
                            'seat_code',
                            'status',
                            'seat_type',
                        ],
                    ],
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Denah kursi berhasil diambil',
                'data' => [
                    'schedule_id' => $this->schedule->id,
                    'rows' => ['A', 'B', 'C'],
                    'cols' => 4,
                    'ticket_price' => 50000,
                ],
            ]);

        $this->assertCount(12, $response->json('data.seats'));
    }

    public function test_real_time_seat_status_calculation(): void
    {
        $user = User::create([
            'google_id' => 'user-google-123456',
            'email' => 'buyer@test.com',
            'name' => 'Buyer User',
            'role' => 'customer',
        ]);

        // 1. Kursi normal -> available
        $seatAvailable = Seat::create([
            'schedule_id' => $this->schedule->id,
            'row_label' => 'A',
            'seat_number' => 1,
            'seat_code' => 'A1',
            'seat_type' => 'vip',
            'status' => 'available',
        ]);

        // 2. Kursi terpesan/lunas -> booked
        $seatBooked = Seat::create([
            'schedule_id' => $this->schedule->id,
            'row_label' => 'A',
            'seat_number' => 2,
            'seat_code' => 'A2',
            'seat_type' => 'vip',
            'status' => 'booked',
        ]);

        // 3. Kursi nonaktif -> disabled
        $seatDisabled = Seat::create([
            'schedule_id' => $this->schedule->id,
            'row_label' => 'A',
            'seat_number' => 3,
            'seat_code' => 'A3',
            'seat_type' => 'vip',
            'status' => 'disabled',
        ]);

        // 4. Kursi yang sedang dikunci aktif selama 15 menit -> locked
        $seatLocked = Seat::create([
            'schedule_id' => $this->schedule->id,
            'row_label' => 'A',
            'seat_number' => 4,
            'seat_code' => 'A4',
            'seat_type' => 'vip',
            'status' => 'available',
        ]);

        SeatLock::create([
            'schedule_id' => $this->schedule->id,
            'seat_id' => $seatLocked->id,
            'user_id' => $user->id,
            'quantity' => 1,
            'order_id' => 'SNM-TKT-TEST-123',
            'expires_at' => now()->addMinutes(15),
        ]);

        $response = $this->getJson("/api/v1/schedules/{$this->schedule->id}/seats");
        $response->assertStatus(200);

        $seats = collect($response->json('data.seats'))->keyBy('seat_code');

        $this->assertEquals('available', $seats['A1']['status']);
        $this->assertEquals('booked', $seats['A2']['status']);
        $this->assertEquals('disabled', $seats['A3']['status']);
        $this->assertEquals('locked', $seats['A4']['status']);
    }

    public function test_expired_seat_locks_do_not_mark_seat_as_locked(): void
    {
        $user = User::create([
            'google_id' => 'user-google-expired-lock',
            'email' => 'expired@test.com',
            'name' => 'Expired User',
            'role' => 'customer',
        ]);

        $seat = Seat::create([
            'schedule_id' => $this->schedule->id,
            'row_label' => 'B',
            'seat_number' => 1,
            'seat_code' => 'B1',
            'seat_type' => 'standard',
            'status' => 'available',
        ]);

        // Lock yang sudah kedaluwarsa 2 menit lalu
        SeatLock::create([
            'schedule_id' => $this->schedule->id,
            'seat_id' => $seat->id,
            'user_id' => $user->id,
            'quantity' => 1,
            'order_id' => 'SNM-TKT-EXPIRED-99',
            'expires_at' => now()->subMinutes(2),
        ]);

        $response = $this->getJson("/api/v1/schedules/{$this->schedule->id}/seats");
        $response->assertStatus(200);

        $seats = collect($response->json('data.seats'))->keyBy('seat_code');
        $this->assertEquals('available', $seats['B1']['status']);
    }

    public function test_returns_404_when_schedule_not_found_or_inactive(): void
    {
        $inactiveSchedule = Schedule::create([
            'event_id' => $this->event->id,
            'show_time' => '2026-11-28 22:00:00',
            'ticket_price' => 50000,
            'total_seats' => 56,
            'is_active' => false,
        ]);

        $response1 = $this->getJson('/api/v1/schedules/999999/seats');
        $response1->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Jadwal penayangan screening tidak ditemukan atau sudah tidak aktif.',
            ])
            ->assertJsonStructure(['success', 'message', 'server_time']);

        $response2 = $this->getJson("/api/v1/schedules/{$inactiveSchedule->id}/seats");
        $response2->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Jadwal penayangan screening tidak ditemukan atau sudah tidak aktif.',
            ]);
    }

    public function test_schedule_seats_route_has_throttle_middleware(): void
    {
        $route = collect(Route::getRoutes())->first(fn ($r) => $r->uri() === 'api/v1/schedules/{id}/seats');

        $this->assertNotNull($route);
        $this->assertContains('throttle:60,1', $route->middleware());
    }
}
