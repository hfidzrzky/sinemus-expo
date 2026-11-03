<?php

namespace Tests\Feature\Admin\Events;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\EventVenue;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MultiVenuePresaleSchemaTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Venue',
            'email' => 'admin.venue@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081177770001',
            'is_phone_locked' => true,
        ]);

        $this->customer = User::factory()->create([
            'name' => 'Customer Venue',
            'email' => 'customer.venue@sinemus.id',
            'role' => 'customer',
            'phone_number' => '081277770002',
            'is_phone_locked' => true,
        ]);
    }

    public function test_event_can_have_multiple_venues_and_schedules_belong_to_venues(): void
    {
        $presaleStart = Carbon::now()->subDays(2);
        $presaleEnd = Carbon::now()->addDays(10);

        $event = Event::create([
            'slug' => 'bumi-manusia-multi-venue',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Bumi Manusia Presale Multi-Venue',
            'description' => 'Penayangan eksklusif presale bioskop mitra.',
            'synopsis_short' => 'Sinopsis film Bumi Manusia.',
            'poster_path' => 'events/posters/bm.jpg',
            'backdrop_path' => 'events/backdrops/bm.jpg',
            'director' => 'Hanung Bramantyo',
            'cast' => ['Iqbaal Ramadhan', 'Mawar de Jongh'],
            'presale_start_at' => $presaleStart,
            'presale_end_at' => $presaleEnd,
            'is_active' => true,
            'is_featured' => true,
        ]);

        $venue1 = EventVenue::create([
            'event_id' => $event->id,
            'venue_name' => 'Cinema XXI Plaza Senayan',
            'cinema_partner' => 'Cinema XXI',
            'venue_address' => 'Plaza Senayan Lantai 5, Jakarta Pusat',
            'city' => 'Jakarta Pusat',
            'google_maps_url' => 'https://maps.google.com/?q=Plaza+Senayan',
        ]);

        $venue2 = EventVenue::create([
            'event_id' => $event->id,
            'venue_name' => 'CGV Grand Indonesia',
            'cinema_partner' => 'CGV Cinemas',
            'venue_address' => 'Grand Indonesia West Mall Lantai 8, Jakarta Pusat',
            'city' => 'Jakarta Pusat',
            'google_maps_url' => 'https://maps.google.com/?q=CGV+GI',
        ]);

        $schedule1 = Schedule::create([
            'event_id' => $event->id,
            'event_venue_id' => $venue1->id,
            'studio_name' => 'Studio 1 XXI',
            'show_time' => Carbon::now()->addDays(12)->setTime(19, 0),
            'ticket_price' => 50000,
            'total_seats' => 100,
            'is_active' => true,
        ]);

        $schedule2 = Schedule::create([
            'event_id' => $event->id,
            'event_venue_id' => $venue2->id,
            'studio_name' => 'Audi 2 CGV',
            'show_time' => Carbon::now()->addDays(12)->setTime(20, 0),
            'ticket_price' => 55000,
            'total_seats' => 120,
            'is_active' => true,
        ]);

        $this->assertCount(2, $event->venues);
        $this->assertEquals($venue1->id, $schedule1->venue->id);
        $this->assertEquals('Cinema XXI Plaza Senayan', $schedule1->venue->venue_name);
        $this->assertEquals($venue2->id, $schedule2->venue->id);
        $this->assertEquals('CGV Grand Indonesia', $schedule2->venue->venue_name);
    }

    public function test_backward_compatible_accessors_work_seamlessly(): void
    {
        $event = Event::create([
            'slug' => 'test-fallback-venue',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Film Fallback Test',
            'description' => 'Deskripsi film',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/test.jpg',
            'backdrop_path' => 'events/backdrops/test.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor 1'],
            'rules' => [],
            'is_active' => true,
        ]);

        EventVenue::create([
            'event_id' => $event->id,
            'venue_name' => 'Auditorium Usmar Ismail',
            'cinema_partner' => 'Pusat Perfilman H. Usmar Ismail',
            'venue_address' => 'Jl. H. R. Rasuna Said Kav. C-22',
            'city' => 'Jakarta Selatan',
        ]);

        $event->refresh();

        $this->assertEquals('Auditorium Usmar Ismail', $event->venue_name);
        $this->assertEquals('Pusat Perfilman H. Usmar Ismail', $event->cinema_partner);
        $this->assertEquals('Jl. H. R. Rasuna Said Kav. C-22', $event->venue_address);
        $this->assertEquals('Jakarta Selatan', $event->city);

        // Test scopeCity finding through event_venues
        $found = Event::query()->city('Jakarta Selatan')->get();
        $this->assertTrue($found->contains('id', $event->id));
    }

    public function test_admin_event_api_returns_venues_and_presale_window(): void
    {
        $event = Event::create([
            'slug' => 'admin-api-multi-venue',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Admin API Presale Event',
            'description' => 'Deskripsi event',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/api.jpg',
            'backdrop_path' => 'events/backdrops/api.jpg',
            'director' => 'Sutradara API',
            'cast' => ['Aktor API'],
            'rules' => [],
            'presale_start_at' => Carbon::now()->subDays(1),
            'presale_end_at' => Carbon::now()->addDays(5),
            'is_active' => true,
        ]);

        $venue = EventVenue::create([
            'event_id' => $event->id,
            'venue_name' => 'Cinema XXI Senayan City',
            'cinema_partner' => 'Cinema XXI',
            'venue_address' => 'Senayan City Lt. 5',
            'city' => 'Jakarta Pusat',
        ]);

        Schedule::create([
            'event_id' => $event->id,
            'event_venue_id' => $venue->id,
            'studio_name' => 'Studio 1 XXI',
            'show_time' => Carbon::now()->addDays(7)->setTime(18, 0),
            'ticket_price' => 50000,
            'total_seats' => 100,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/events/{$event->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Admin API Presale Event')
            ->assertJsonPath('data.venues.0.venue_name', 'Cinema XXI Senayan City')
            ->assertJsonPath('data.schedules.0.event_venue_id', $venue->id)
            ->assertJsonPath('data.schedules.0.venue.venue_name', 'Cinema XXI Senayan City');

        $this->assertNotNull($response->json('data.presale_start_at'));
        $this->assertNotNull($response->json('data.presale_end_at'));
    }

    public function test_fulfillment_orders_api_returns_event_venue_id_and_studio_name(): void
    {
        $event = Event::create([
            'slug' => 'fulfillment-multi-venue',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Fulfillment Presale Event',
            'description' => 'Deskripsi event',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/f.jpg',
            'backdrop_path' => 'events/backdrops/f.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'rules' => [],
            'is_active' => true,
        ]);

        $venue = EventVenue::create([
            'event_id' => $event->id,
            'venue_name' => 'Cinema XXI Kota Kasablanka',
            'cinema_partner' => 'Cinema XXI',
            'venue_address' => 'Mall Kota Kasablanka Lt. 2',
            'city' => 'Jakarta Selatan',
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'event_venue_id' => $venue->id,
            'studio_name' => 'Studio 3 XXI',
            'show_time' => Carbon::now()->addDays(10)->setTime(20, 0),
            'ticket_price' => 60000,
            'total_seats' => 150,
            'is_active' => true,
        ]);

        EventTransaction::create([
            'order_id' => 'SNM-TKT-MV-001',
            'user_id' => $this->customer->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 120000,
            'discount_amount' => 0,
            'net_amount' => 120000,
            'payment_status' => 'paid',
            'payment_method' => 'qris',
            'paid_at' => now(),
            'fulfillment_status' => 'awaiting_cinema_ticket',
            'snapshot_event_data' => [
                'event_title' => $event->title,
                'venue_name' => $venue->venue_name,
                'studio_name' => 'Studio 3 XXI',
                'show_time' => $schedule->show_time->toIso8601String(),
            ],
            'snapshot_seats' => ['A1', 'A2'],
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/schedules/{$schedule->id}/fulfillment");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.order_id', 'SNM-TKT-MV-001')
            ->assertJsonPath('data.0.venue_name', 'Cinema XXI Kota Kasablanka')
            ->assertJsonPath('data.0.event_venue_id', $venue->id)
            ->assertJsonPath('data.0.studio_name', 'Studio 3 XXI');
    }

    public function test_admin_can_create_event_with_nested_multi_venues_and_schedules(): void
    {
        $payload = [
            'title' => 'Gundala 2 Presale Mega Screening',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'cinema_partner' => 'Cinema XXI',
            'target_screening_month' => 'November 2026',
            'description' => 'Penayangan akbar film Gundala 2 di berbagai bioskop pilihan.',
            'synopsis_short' => 'Kelanjutan pertarungan pahlawan petir.',
            'director' => 'Joko Anwar',
            'cast' => ['Abimana Aryasatya', 'Tara Basro'],
            'venues' => [
                [
                    'venue_name' => 'Cinema XXI Plaza Senayan',
                    'cinema_partner' => 'Cinema XXI',
                    'venue_address' => 'Plaza Senayan Lt. 3, Jl. Asia Afrika No.8',
                    'city' => 'Jakarta Pusat',
                    'google_maps_url' => 'https://maps.google.com/?q=Plaza+Senayan',
                    'schedules' => [
                        [
                            'studio_name' => 'Studio 1',
                            'show_time' => Carbon::now()->addDays(5)->setTime(13, 0)->toIso8601String(),
                            'ticket_price' => 65000,
                            'total_seats' => 75,
                            'max_tickets_per_order' => 6,
                        ],
                        [
                            'studio_name' => 'Studio 1',
                            'show_time' => Carbon::now()->addDays(5)->setTime(15, 45)->toIso8601String(),
                            'ticket_price' => 65000,
                            'total_seats' => 75,
                            'max_tickets_per_order' => 6,
                        ],
                    ],
                ],
                [
                    'venue_name' => 'Cinema XXI Mall Kelapa Gading',
                    'cinema_partner' => 'Cinema XXI',
                    'venue_address' => 'MKG 3 Lt. 3, Jl. Boulevard Kelapa Gading',
                    'city' => 'Jakarta Utara',
                    'google_maps_url' => 'https://maps.google.com/?q=MKG+3',
                    'schedules' => [
                        [
                            'studio_name' => 'Studio 2',
                            'show_time' => Carbon::now()->addDays(5)->setTime(14, 0)->toIso8601String(),
                            'ticket_price' => 60000,
                            'total_seats' => 100,
                            'max_tickets_per_order' => 6,
                        ],
                    ],
                ],
            ],
            'poster' => UploadedFile::fake()->image('poster.jpg', 600, 900),
            'backdrop' => UploadedFile::fake()->image('backdrop.jpg', 1920, 1080),
        ];

        Storage::fake('r2');

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->post('/api/v1/admin/events', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Gundala 2 Presale Mega Screening')
            ->assertJsonPath('data.venue_name', 'Cinema XXI Plaza Senayan')
            ->assertJsonPath('data.city', 'Jakarta Pusat');

        $eventId = (int) $response->json('data.id');
        $event = Event::with(['venues.schedules', 'schedules'])->find($eventId);

        $this->assertNotNull($event);
        $this->assertCount(2, $event->venues);
        $this->assertCount(3, $event->schedules);

        $venue1 = $event->venues->firstWhere('venue_name', 'Cinema XXI Plaza Senayan');
        $this->assertNotNull($venue1);
        $this->assertCount(2, $venue1->schedules);

        $venue2 = $event->venues->firstWhere('venue_name', 'Cinema XXI Mall Kelapa Gading');
        $this->assertNotNull($venue2);
        $this->assertCount(1, $venue2->schedules);
        $this->assertEquals('Studio 2', $venue2->schedules->first()->studio_name);
    }

    public function test_admin_can_update_event_with_nested_multi_venues_and_schedules(): void
    {
        $event = Event::create([
            'slug' => 'update-multi-venue-test',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Original Event Title',
            'description' => 'Original desc',
            'synopsis_short' => 'Original syn',
            'poster_path' => 'events/posters/orig.jpg',
            'backdrop_path' => 'events/backdrops/orig.jpg',
            'director' => 'Original Dir',
            'cast' => ['Actor 1'],
            'rules' => [],
            'is_active' => true,
        ]);

        $venue1 = $event->venues()->create([
            'venue_name' => 'Old Venue 1',
            'venue_address' => 'Old Address 1',
            'city' => 'Jakarta Selatan',
        ]);

        $sched1 = $event->schedules()->create([
            'event_venue_id' => $venue1->id,
            'studio_name' => 'Studio 1',
            'show_time' => Carbon::now()->addDays(3)->setTime(13, 0),
            'ticket_price' => 50000,
            'total_seats' => 50,
            'is_active' => true,
        ]);

        $updatePayload = [
            'title' => 'Updated Event Title Multi-Venue',
            'venues' => [
                [
                    'id' => $venue1->id,
                    'venue_name' => 'Updated Venue 1 Name',
                    'venue_address' => 'Updated Address 1',
                    'city' => 'Jakarta Selatan',
                    'schedules' => [
                        [
                            'id' => $sched1->id,
                            'studio_name' => 'Studio 1 VIP',
                            'show_time' => Carbon::now()->addDays(3)->setTime(14, 0)->toIso8601String(),
                            'ticket_price' => 75000,
                            'total_seats' => 60,
                        ],
                        [
                            'studio_name' => 'Studio 2 New',
                            'show_time' => Carbon::now()->addDays(3)->setTime(17, 0)->toIso8601String(),
                            'ticket_price' => 80000,
                            'total_seats' => 80,
                        ],
                    ],
                ],
                [
                    'venue_name' => 'Completely New Venue 2',
                    'venue_address' => 'New Address 2',
                    'city' => 'Bandung',
                    'schedules' => [
                        [
                            'studio_name' => 'Studio 1 BDG',
                            'show_time' => Carbon::now()->addDays(4)->setTime(19, 0)->toIso8601String(),
                            'ticket_price' => 55000,
                            'total_seats' => 100,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson("/api/v1/admin/events/{$event->id}", $updatePayload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Updated Event Title Multi-Venue');

        $refreshedEvent = $event->fresh(['venues.schedules', 'schedules']);
        $this->assertCount(2, $refreshedEvent->venues);
        $this->assertCount(3, $refreshedEvent->schedules);

        $refreshedVenue1 = $refreshedEvent->venues->firstWhere('id', $venue1->id);
        $this->assertEquals('Updated Venue 1 Name', $refreshedVenue1->venue_name);
        $this->assertCount(2, $refreshedVenue1->schedules);

        $refreshedSched1 = $refreshedVenue1->schedules->firstWhere('id', $sched1->id);
        $this->assertEquals('Studio 1 VIP', $refreshedSched1->studio_name);
        $this->assertEquals(75000, $refreshedSched1->ticket_price);
    }

    public function test_admin_can_create_event_with_cdn_urls_json_payload(): void
    {
        $payload = [
            'title' => 'Event CDN Direct Upload',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'cinema_partner' => 'Cinema XXI',
            'description' => 'Event yang diunggah langsung dengan Cloudflare CDN URLs.',
            'synopsis_short' => 'Sinopsis singkat CDN.',
            'director' => 'Sutradara Hebat',
            'cast' => ['Aktor 1', 'Aktor 2'],
            'rules' => ['Aturan 1'],
            'poster_url' => 'https://imagedelivery.net/sample/poster.webp',
            'backdrop_url' => 'https://imagedelivery.net/sample/backdrop.webp',
            'venues' => [
                [
                    'venue_name' => 'Cinema XXI Grand Indonesia',
                    'venue_address' => 'Grand Indonesia West Mall Lt. 8',
                    'city' => 'Jakarta Pusat',
                    'cinema_partner' => 'Cinema XXI',
                    'schedules' => [
                        [
                            'studio_name' => 'Studio 1',
                            'show_time' => Carbon::now()->addDays(2)->setTime(19, 0)->toIso8601String(),
                            'ticket_price' => 75000,
                            'total_seats' => 50,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/events', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Event CDN Direct Upload')
            ->assertJsonPath('data.poster_url', 'https://imagedelivery.net/sample/poster.webp')
            ->assertJsonPath('data.backdrop_url', 'https://imagedelivery.net/sample/backdrop.webp');

        $this->assertDatabaseHas('events', [
            'title' => 'Event CDN Direct Upload',
            'poster_path' => 'https://imagedelivery.net/sample/poster.webp',
            'backdrop_path' => 'https://imagedelivery.net/sample/backdrop.webp',
        ]);
    }
}
