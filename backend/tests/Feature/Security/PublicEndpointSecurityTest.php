<?php

namespace Tests\Feature\Security;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicEndpointSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function createEvent(bool $isActive = true): Event
    {
        return Event::create([
            'slug' => 'event-sec-'.Str::lower(Str::random(8)),
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Security Audit Screening',
            'description' => 'Deskripsi event audit keamanan',
            'synopsis_short' => 'Sinopsis singkat',
            'poster_path' => 'poster.jpg',
            'backdrop_path' => 'backdrop.jpg',
            'director' => 'Sutradara Uji',
            'cast' => ['Pemeran 1'],
            'rules' => ['Aturan 1'],
            'venue_name' => 'Cinema XXI Plaza Senayan',
            'venue_address' => 'Plaza Senayan, Jakarta',
            'city' => 'Jakarta Pusat',
            'is_active' => $isActive,
        ]);
    }

    private function createSchedule(Event $event, bool $isActive = true): Schedule
    {
        return Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(3)->format('Y-m-d H:i:s'),
            'ticket_price' => 50000,
            'total_seats' => 40,
            'is_active' => $isActive,
        ]);
    }

    public function test_authenticated_read_traffic_does_not_exhaust_booking_checkout_rate_limit_bucket(): void
    {
        $user = User::factory()->create([
            'role' => 'customer',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        Sanctum::actingAs($user);

        // Hit endpoint user-read 20 kali (> batas 15/menit milik booking-checkout)
        for ($i = 0; $i < 20; $i++) {
            $this->getJson('/api/v1/auth/me')->assertStatus(200);
        }

        // Endpoint booking-checkout harus tetap lolos dari throttle (tidak boleh 429)
        // Payload sengaja kosong agar memicu 422 validasi, membuktikan request melewati middleware throttle.
        $response = $this->postJson('/api/v1/bookings/reserve', []);
        $this->assertNotEquals(429, $response->getStatusCode());
        $response->assertStatus(422);
    }

    public function test_public_catalog_and_seatmap_polling_do_not_exhaust_auth_google_bucket(): void
    {
        $event = $this->createEvent(isActive: true);
        $schedule = $this->createSchedule($event, isActive: true);

        // Hit public-catalog & public-seatmap sebanyak 20 kali (> batas 15/menit auth-google)
        for ($i = 0; $i < 10; $i++) {
            $this->getJson('/api/v1/events')->assertStatus(200);
            $this->getJson("/api/v1/schedules/{$schedule->id}/seats")->assertStatus(200);
        }

        // POST /api/v1/auth/google tetap harus bebas dari 429 (kembali 422 karena id_token kosong)
        $response = $this->postJson('/api/v1/auth/google', []);
        $this->assertNotEquals(429, $response->getStatusCode());
        $response->assertStatus(422);
    }

    public function test_rate_limit_429_preserves_retry_after_and_ratelimit_headers_with_standard_envelope(): void
    {
        // Penuhi kuota bucket auth-google (15/menit)
        for ($i = 0; $i < 15; $i++) {
            $this->postJson('/api/v1/auth/google', [])->assertStatus(422);
        }

        // Permintaan ke-16 harus mengembalikan 429 lengkap dengan Retry-After & X-RateLimit-* headers
        $response = $this->postJson('/api/v1/auth/google', []);
        $response->assertStatus(429);
        $response->assertHeader('Retry-After');
        $response->assertHeader('X-RateLimit-Limit', '15');
        $response->assertHeader('X-RateLimit-Remaining', '0');
        $response->assertJsonStructure([
            'success',
            'message',
            'server_time',
        ]);
        $response->assertJson(['success' => false]);
    }

    public function test_midtrans_webhook_bypasses_maintenance_mode(): void
    {
        SystemSetting::updateOrCreate(
            ['group' => 'emergency_controls'],
            [
                'payload' => [
                    'is_maintenance_mode' => true,
                    'maintenance_message' => 'Sistem sedang dalam pemeliharaan terjadwal.',
                    'freeze_cinema_ticket_sales' => false,
                    'freeze_vod_rentals' => false,
                ],
            ]
        );
        Cache::flush();

        // Endpoint publik biasa harus diblokir 503 saat maintenance aktif
        $this->getJson('/api/v1/events')->assertStatus(503);

        // Webhook Midtrans TIDAK BOLEH diblokir 503 (lolos ke validasi payload -> 422)
        $webhookResponse = $this->postJson('/api/v1/webhooks/midtrans', []);
        $this->assertNotEquals(503, $webhookResponse->getStatusCode());
        $webhookResponse->assertStatus(422);
    }

    public function test_public_seatmap_rejects_schedule_of_inactive_draft_event(): void
    {
        $draftEvent = $this->createEvent(isActive: false);
        $schedule = $this->createSchedule($draftEvent, isActive: true);

        $this->getJson("/api/v1/schedules/{$schedule->id}/seats")
            ->assertStatus(404)
            ->assertJson(['success' => false]);
    }

    public function test_legacy_presale_qr_image_stream_endpoint_is_removed(): void
    {
        $this->getJson('/api/v1/tickets/SNM-TKT-LEGACY01/qr-image?h=anyhash')
            ->assertStatus(404);
    }
}
