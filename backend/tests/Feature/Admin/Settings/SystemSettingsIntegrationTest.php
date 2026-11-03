<?php

namespace Tests\Feature\Admin\Settings;

use App\Models\Event;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\User;
use App\Services\Admin\Settings\SystemSettingService;
use Database\Seeders\SystemSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemSettingsIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $customer;

    protected Schedule $schedule;

    protected array $seatIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Test',
            'email' => 'admin@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081122334455',
            'is_phone_locked' => true,
        ]);

        $this->customer = User::factory()->create([
            'name' => 'Penonton Bioskop',
            'email' => 'penonton@gmail.com',
            'role' => 'customer',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        $this->seed(SystemSettingSeeder::class);

        // Setup Event & Schedule
        $event = Event::create([
            'slug' => 'pahlawan-film-screening',
            'event_type' => 'presale_cinema',
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
            'event_id' => $event->id,
            'studio_name' => 'Studio 1 Premiere',
            'show_time' => now()->addDays(5)->setTime(19, 0),
            'ticket_price' => 50000.00,
            'total_seats' => 20,
            'is_active' => true,
        ]);

        for ($i = 1; $i <= 10; $i++) {
            $seat = Seat::create([
                'schedule_id' => $this->schedule->id,
                'row_label' => 'A',
                'seat_number' => $i,
                'seat_code' => 'A'.$i,
                'seat_type' => 'standard',
                'status' => 'available',
            ]);
            $this->seatIds[] = $seat->id;
        }
    }

    public function test_booking_is_blocked_when_ticket_sales_are_frozen(): void
    {
        // Set freeze_cinema_ticket_sales = true
        app(SystemSettingService::class)->updateEmergencyControls([
            'is_maintenance_mode' => false,
            'maintenance_message' => '',
            'freeze_cinema_ticket_sales' => true,
            'freeze_vod_rentals' => false,
            'emergency_alert_banner' => [
                'is_active' => false,
                'message' => '',
                'type' => 'warning',
            ],
        ], $this->superAdmin->id);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seatIds[0]],
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'Pemesanan tiket saat ini sedang dibekukan sementara oleh penyelenggara.',
            ]);
    }

    public function test_booking_enforces_dynamic_max_tickets_per_order(): void
    {
        // Set max_tickets_per_order = 2
        app(SystemSettingService::class)->updateBusinessPolicies([
            'seat_lock_duration_minutes' => 15,
            'vod_rental_duration_hours' => 48,
            'platform_service_fee' => 0,
            'max_tickets_per_order' => 2,
            'enable_ticket_cancellation' => false,
        ], $this->superAdmin->id);

        // Attempt reserving 3 seats
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seatIds[0], $this->seatIds[1], $this->seatIds[2]],
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'Jumlah pemesanan tiket harus antara 1 sampai 2 tiket.',
            ]);
    }

    public function test_booking_adds_platform_service_fee_dynamically(): void
    {
        // Set platform_service_fee = 2500
        app(SystemSettingService::class)->updateBusinessPolicies([
            'seat_lock_duration_minutes' => 15,
            'vod_rental_duration_hours' => 48,
            'platform_service_fee' => 2500,
            'max_tickets_per_order' => 8,
            'enable_ticket_cancellation' => false,
        ], $this->superAdmin->id);

        // Reserve 1 seat (price = 50,000)
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/bookings/reserve', [
                'schedule_id' => $this->schedule->id,
                'seat_ids' => [$this->seatIds[0]],
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'gross_amount' => 50000,
                    'service_fee' => 2500,
                    'net_amount' => 52500,
                ],
            ]);
    }

    public function test_maintenance_mode_blocks_customer_and_allows_super_admin(): void
    {
        // Activate maintenance mode
        app(SystemSettingService::class)->updateEmergencyControls([
            'is_maintenance_mode' => true,
            'maintenance_message' => 'Server Sinemus sedang ditingkatkan kapasitasnya.',
            'freeze_cinema_ticket_sales' => false,
            'freeze_vod_rentals' => false,
            'emergency_alert_banner' => [
                'is_active' => false,
                'message' => '',
                'type' => 'warning',
            ],
        ], $this->superAdmin->id);

        // 1. Guest without token gets 503
        $guestResponse = $this->getJson('/api/v1/events');
        $guestResponse->assertStatus(503);

        // 2. Customer gets 503
        $custResponse = $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/v1/events');

        $custResponse->assertStatus(503)
            ->assertJson([
                'success' => false,
                'error_code' => 'SYSTEM_MAINTENANCE_ACTIVE',
                'message' => 'Server Sinemus sedang ditingkatkan kapasitasnya.',
            ]);

        // 3. Super Admin using Bearer token directly on public route (simulating real frontend axios call)
        $token = $this->superAdmin->createToken('admin-preview-token')->plainTextToken;
        $bearerResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/events');

        $bearerResponse->assertStatus(200);

        // 4. Super Admin can still access API via actingAs
        $adminResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/events');

        $adminResponse->assertStatus(200);

        // 5. Public settings is always accessible even under maintenance
        $settingsResponse = $this->getJson('/api/v1/public/settings');
        $settingsResponse->assertStatus(200);
    }
}
