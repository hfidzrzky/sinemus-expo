<?php

namespace Tests\Feature\Admin\Events;

use App\Models\Event;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventSalesWindowAndAutoDraftTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'phone_number' => '081100000003',
            'is_phone_locked' => true,
        ]);
    }

    public function test_admin_can_create_regular_event_with_sales_window_and_concludes_at(): void
    {
        $payload = [
            'title' => 'Indie Screening Regular',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'description' => 'Screening komunitas indie reguler.',
            'synopsis_short' => 'Sinopsis film reguler.',
            'director' => 'Sutradara Muda',
            'cast' => ['Reza Rahadian', 'Laura Basuki'],
            'city' => 'Jakarta Pusat',
            'poster_url' => 'https://example.com/poster.jpg',
            'backdrop_url' => 'https://example.com/backdrop.jpg',
            'sales_start_at' => Carbon::now()->subDay()->toISOString(),
            'sales_end_at' => Carbon::now()->addDays(2)->toISOString(),
            'event_concludes_at' => Carbon::now()->addDays(2)->addHours(4)->toISOString(),
            'venues' => [
                [
                    'venue_name' => 'Sinemus Space Senayan',
                    'venue_address' => 'Jl. Asia Afrika',
                    'city' => 'Jakarta Pusat',
                    'schedules' => [
                        [
                            'studio_name' => 'Mini Theater',
                            'show_time' => Carbon::now()->addDays(2)->addHours(2)->toISOString(),
                            'ticket_price' => 50000,
                            'total_seats' => 50,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/events', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('events', [
            'title' => 'Indie Screening Regular',
            'event_type' => 'regular',
        ]);

        $event = Event::where('title', 'Indie Screening Regular')->first();
        $this->assertNotNull($event->presale_start_at);
        $this->assertNotNull($event->presale_end_at);
        $this->assertNotNull($event->event_concludes_at);
        $this->assertTrue($event->isSalesOpen());
        $this->assertFalse($event->isConcluded());
    }

    public function test_concluded_event_is_automatically_excluded_from_public_catalog(): void
    {
        // 1. Event aktif dan belum selesai
        $activeEvent = Event::create([
            'slug' => 'event-aktif-masih-buka',
            'title' => 'Event Aktif Masih Buka',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/poster.jpg',
            'backdrop_path' => 'events/backdrops/backdrop.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor 1'],
            'genre' => ['Drama'],
            'duration_minutes' => 120,
            'venue_name' => 'Sinemus Space',
            'venue_address' => 'Jl. Sudirman',
            'city' => 'Jakarta',
            'is_active' => true,
            'event_concludes_at' => Carbon::now()->addDays(1),
        ]);

        Schedule::create([
            'event_id' => $activeEvent->id,
            'show_time' => Carbon::now()->addDays(1)->toISOString(),
            'ticket_price' => 50000,
            'total_seats' => 50,
            'is_active' => true,
        ]);

        // 2. Event yang concludes_at sudah terlewati
        $concludedEvent = Event::create([
            'slug' => 'event-sudah-selesai',
            'title' => 'Event Sudah Selesai',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/poster2.jpg',
            'backdrop_path' => 'events/backdrops/backdrop2.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor 2'],
            'genre' => ['Drama'],
            'duration_minutes' => 120,
            'venue_name' => 'Sinemus Space',
            'venue_address' => 'Jl. Sudirman',
            'city' => 'Jakarta',
            'is_active' => true,
            'event_concludes_at' => Carbon::now()->subHour(),
        ]);

        Schedule::create([
            'event_id' => $concludedEvent->id,
            'show_time' => Carbon::now()->subHours(2)->toISOString(),
            'ticket_price' => 50000,
            'total_seats' => 50,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/events');
        $response->assertStatus(200);

        $titles = collect($response->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Event Aktif Masih Buka'));
        $this->assertFalse($titles->contains('Event Sudah Selesai'));
    }

    public function test_close_expired_sales_command_drafts_concluded_events(): void
    {
        $concludedEvent = Event::create([
            'slug' => 'event-siap-auto-draft',
            'title' => 'Event Siap Auto Draft',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/poster3.jpg',
            'backdrop_path' => 'events/backdrops/backdrop3.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor 3'],
            'genre' => ['Drama'],
            'duration_minutes' => 120,
            'venue_name' => 'Sinemus Space',
            'venue_address' => 'Jl. Sudirman',
            'city' => 'Jakarta',
            'is_active' => true,
            'event_concludes_at' => Carbon::now()->subMinutes(10),
        ]);

        $stillActiveEvent = Event::create([
            'slug' => 'event-masih-berlangsung',
            'title' => 'Event Masih Berlangsung',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/poster4.jpg',
            'backdrop_path' => 'events/backdrops/backdrop4.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor 4'],
            'genre' => ['Drama'],
            'duration_minutes' => 120,
            'venue_name' => 'Sinemus Space',
            'venue_address' => 'Jl. Sudirman',
            'city' => 'Jakarta',
            'is_active' => true,
            'event_concludes_at' => Carbon::now()->addHours(3),
        ]);

        $this->artisan('events:close-expired-sales')
            ->assertSuccessful();

        $concludedEvent->refresh();
        $stillActiveEvent->refresh();

        $this->assertFalse($concludedEvent->is_active);
        $this->assertTrue($stillActiveEvent->is_active);
    }
}
