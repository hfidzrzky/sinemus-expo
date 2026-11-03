<?php

namespace Tests\Feature\Admin\Events;

use App\Models\Banner;
use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminEventTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('r2');

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Event',
            'email' => 'admin.event@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081100000003',
            'is_phone_locked' => true,
        ]);

        $this->customer = User::factory()->create([
            'name' => 'Customer Penonton',
            'email' => 'customer.event@example.com',
            'role' => 'customer',
            'phone_number' => '081200000004',
            'is_phone_locked' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_admin_events(): void
    {
        $this->getJson('/api/v1/admin/events')->assertStatus(401);
        $this->postJson('/api/v1/admin/events', [])->assertStatus(401);
    }

    public function test_customer_role_cannot_access_admin_events_and_receives_403(): void
    {
        $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/v1/admin/events')
            ->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'FORBIDDEN_ROLE_ACCESS',
            ]);

        $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/admin/events', [])
            ->assertStatus(403);
    }

    public function test_super_admin_can_list_events_with_pagination_and_filters(): void
    {
        $event1 = Event::create([
            'slug' => 'event-jakarta-regular',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Jakarta Regular',
            'description' => 'Deskripsi event jakarta',
            'synopsis_short' => 'Sinopsis jakarta',
            'poster_path' => 'events/posters/jkt.jpg',
            'backdrop_path' => 'events/backdrops/jkt.jpg',
            'director' => 'Sutradara Jkt',
            'cast' => ['Aktor Jkt'],
            'rules' => ['Aturan 1'],
            'venue_name' => 'Sinemus Space Senayan',
            'venue_address' => 'Plaza Senayan Lantai 5',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $event2 = Event::create([
            'slug' => 'event-bandung-regular',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'cinema_partner' => 'Cinema XXI',
            'target_screening_month' => 'November 2026',
            'title' => 'Event Bandung Regular',
            'description' => 'Deskripsi event bandung',
            'synopsis_short' => 'Sinopsis bandung',
            'poster_path' => 'events/posters/bdg.jpg',
            'backdrop_path' => 'events/backdrops/bdg.jpg',
            'director' => 'Sutradara Bdg',
            'cast' => ['Aktor Bdg'],
            'rules' => ['Aturan 2'],
            'venue_name' => 'Cinema XXI Ciwalk',
            'venue_address' => 'Cihampelas Walk Lantai 3',
            'city' => 'Bandung',
            'is_active' => true,
        ]);

        $event3 = Event::create([
            'slug' => 'event-draft-nonaktif',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Event Draft Nonaktif',
            'description' => 'Deskripsi draft',
            'synopsis_short' => 'Sinopsis draft',
            'poster_path' => 'events/posters/draft.jpg',
            'backdrop_path' => 'events/backdrops/draft.jpg',
            'director' => 'Sutradara Draft',
            'cast' => ['Aktor Draft'],
            'rules' => [],
            'venue_name' => 'Mini Theater',
            'venue_address' => 'Jl. Merdeka No. 10',
            'city' => 'Yogyakarta',
            'is_active' => false,
        ]);

        // 1. List tanpa filter (harus ada 3)
        $responseAll = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/events');

        $responseAll->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Daftar event berhasil diambil.',
            ]);
        $this->assertCount(3, $responseAll->json('data'));

        // 2. Filter Kota Jakarta
        $responseCity = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/events?city=Jakarta Pusat');

        $responseCity->assertStatus(200);
        $this->assertCount(1, $responseCity->json('data'));
        $this->assertEquals('event-jakarta-regular', $responseCity->json('data.0.slug'));

        // 3. Filter Kota Bandung
        $responseBdg = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/events?city=Bandung');

        $responseBdg->assertStatus(200);
        $this->assertCount(1, $responseBdg->json('data'));
        $this->assertEquals('event-bandung-regular', $responseBdg->json('data.0.slug'));
        $this->assertEquals('Sutradara Bdg', $responseBdg->json('data.0.director'));
        $this->assertTrue($responseBdg->json('data.0.is_published'));
        $this->assertArrayHasKey('occupancy_rate', $responseBdg->json('data.0'));

        // 4. Filter Status Published
        $responseStatus = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/events?status=published');

        $responseStatus->assertStatus(200);
        $this->assertCount(2, $responseStatus->json('data'));

        // 5. Filter Status Draft
        $responseDraft = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/events?status=draft');

        $responseDraft->assertStatus(200);
        $this->assertCount(1, $responseDraft->json('data'));
        $this->assertFalse($responseDraft->json('data.0.is_published'));
    }

    public function test_create_event_validates_required_fields(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/events', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'title',
                'event_type',
                'seating_type',
                'description',
                'synopsis_short',
                'venue_name',
                'venue_address',
                'city',
                'director',
                'cast',
                'poster',
                'backdrop',
            ]);
    }

    public function test_super_admin_can_create_event_with_image_uploads_to_r2(): void
    {
        $posterFile = UploadedFile::fake()->image('poster_cds.jpg', 600, 900);
        $backdropFile = UploadedFile::fake()->image('backdrop_cds.jpg', 1920, 1080);

        $payload = [
            'title' => 'Cinta dan Sejarah Premiere',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'description' => 'Penayangan eksklusif bersama sutradara.',
            'synopsis_short' => 'Film romansa sejarah spektakuler.',
            'venue_name' => 'Cinema XXI Plaza Senayan',
            'venue_address' => 'Plaza Senayan Lantai 5, Jakarta Pusat',
            'city' => 'Jakarta Pusat',
            'director' => 'Yuda Kurniawan',
            'cast' => ['Reza Rahadian', 'Laura Basuki'],
            'cloudflare_teaser_uid' => 'stream-teaser-uid-1234',
            'is_active' => true,
            'is_featured' => true,
            'poster' => $posterFile,
            'backdrop' => $backdropFile,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->post('/api/v1/admin/events', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Event berhasil dibuat.',
                'data' => [
                    'title' => 'Cinta dan Sejarah Premiere',
                    'slug' => 'cinta-dan-sejarah-premiere',
                    'city' => 'Jakarta Pusat',
                    'director' => 'Yuda Kurniawan',
                    'is_active' => true,
                    'is_featured' => true,
                ],
            ]);

        $event = Event::where('slug', 'cinta-dan-sejarah-premiere')->first();
        $this->assertNotNull($event);
        $this->assertNotEmpty($event->poster_path);
        $this->assertNotEmpty($event->backdrop_path);

        Storage::disk('r2')->assertExists($event->poster_path);
        Storage::disk('r2')->assertExists($event->backdrop_path);
    }

    public function test_super_admin_can_show_event_detail(): void
    {
        $event = Event::create([
            'slug' => 'event-detail-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Detail Test',
            'description' => 'Deskripsi event lengkap.',
            'synopsis_short' => 'Sinopsis ringkas.',
            'poster_path' => 'events/posters/detail.jpg',
            'backdrop_path' => 'events/backdrops/detail.jpg',
            'director' => 'Arya Sinema',
            'cast' => ['Pemeran A'],
            'rules' => ['Aturan A'],
            'venue_name' => 'Cinema XXI',
            'venue_address' => 'Jl. Sudirman',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/events/{$event->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Detail event berhasil diambil.',
                'data' => [
                    'id' => $event->id,
                    'title' => 'Event Detail Test',
                    'slug' => 'event-detail-test',
                    'city' => 'Jakarta',
                ],
            ]);
    }

    public function test_super_admin_can_update_event_metadata_and_replace_image(): void
    {
        $oldPoster = UploadedFile::fake()->image('old_poster.jpg', 600, 900);
        $oldPosterPath = $oldPoster->store('events/posters', 'r2');

        $event = Event::create([
            'slug' => 'event-update-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Judul Lama',
            'description' => 'Deskripsi lama.',
            'synopsis_short' => 'Sinopsis lama.',
            'poster_path' => $oldPosterPath,
            'backdrop_path' => 'events/backdrops/old.jpg',
            'director' => 'Sutradara Lama',
            'cast' => ['Pemeran Lama'],
            'rules' => [],
            'venue_name' => 'Venue Lama',
            'venue_address' => 'Alamat Lama',
            'city' => 'Surabaya',
            'is_active' => false,
        ]);

        $newPoster = UploadedFile::fake()->image('new_poster.jpg', 600, 900);

        $payload = [
            'title' => 'Event Judul Baru Diperbarui',
            'city' => 'Malang',
            'is_active' => true,
            'poster' => $newPoster,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->put("/api/v1/admin/events/{$event->id}", $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Event berhasil diperbarui.',
                'data' => [
                    'id' => $event->id,
                    'title' => 'Event Judul Baru Diperbarui',
                    'city' => 'Malang',
                    'is_active' => true,
                ],
            ]);

        $event->refresh();
        $this->assertEquals('Event Judul Baru Diperbarui', $event->title);
        $this->assertEquals('Malang', $event->city);
        $this->assertTrue($event->is_active);

        // Poster lama harus sudah dihapus dari R2, poster baru harus ada
        Storage::disk('r2')->assertMissing($oldPosterPath);
        Storage::disk('r2')->assertExists($event->poster_path);
    }

    public function test_super_admin_can_create_schedule_for_event(): void
    {
        $event = Event::create([
            'slug' => 'event-schedule-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Schedule Test',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/s.jpg',
            'backdrop_path' => 'events/backdrops/s.jpg',
            'director' => 'Director',
            'cast' => ['Cast'],
            'rules' => [],
            'venue_name' => 'Venue',
            'venue_address' => 'Address',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        // 1. Sesi dengan waktu masa lalu harus ditolak (422)
        $pastPayload = [
            'show_time' => now()->subDay()->toDateTimeString(),
            'ticket_price' => 50000,
            'total_seats' => 100,
        ];

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/events/{$event->id}/schedules", $pastPayload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['show_time']);

        // 2. Sesi dengan waktu masa depan harus berhasil dibuat (201)
        $futurePayload = [
            'studio_name' => 'Studio 2 Premiere',
            'show_time' => now()->addDays(5)->setHour(19)->setMinute(0)->toDateTimeString(),
            'ticket_price' => 65000,
            'total_seats' => 120,
            'is_active' => true,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/events/{$event->id}/schedules", $futurePayload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Sesi penayangan berhasil ditambahkan.',
                'data' => [
                    'event_id' => $event->id,
                    'studio_name' => 'Studio 2 Premiere',
                    'ticket_price' => 65000.0,
                    'formatted_ticket_price' => 'Rp 65.000',
                    'total_seats' => 120,
                    'is_active' => true,
                ],
            ]);
    }

    public function test_super_admin_can_generate_seat_map_grid_atomically(): void
    {
        $event = Event::create([
            'slug' => 'event-seatmap-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Seatmap Test',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/sm.jpg',
            'backdrop_path' => 'events/backdrops/sm.jpg',
            'director' => 'Director',
            'cast' => ['Cast'],
            'rules' => [],
            'venue_name' => 'Venue',
            'venue_address' => 'Address',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'studio_name' => 'Studio 1',
            'show_time' => now()->addDays(7),
            'ticket_price' => 50000,
            'total_seats' => 0,
            'is_active' => true,
        ]);

        // Generate 3 Baris (A, B, C) x 4 Kolom (1..4) = 12 Kursi
        // C1, C2 = VIP
        // A2, B2 = Aisle (Lorong)
        $payload = [
            'rows' => 3,
            'columns' => 4,
            'vip_seats' => ['C1', 'C2'],
            'aisle_seats' => ['A2', 'B2'],
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$schedule->id}/seats/generate", $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => '12 kursi berhasil digenerate.',
            ]);

        // Verifikasi kursi di database
        $this->assertEquals(12, Seat::where('schedule_id', $schedule->id)->count());

        $c1 = Seat::where('schedule_id', $schedule->id)->where('seat_code', 'C1')->first();
        $this->assertEquals('vip', $c1->seat_type);
        $this->assertEquals('available', $c1->status);

        // Aisle di Baris A Kolom 2 memiliki seat_type aisle dan kode A-G2
        $a2Aisle = Seat::where('schedule_id', $schedule->id)->where('row_label', 'A')->where('grid_column', 2)->first();
        $this->assertNotNull($a2Aisle);
        $this->assertEquals('aisle', $a2Aisle->seat_type);
        $this->assertEquals('A-G2', $a2Aisle->seat_code);

        // Kursi fisik Baris A Kolom 1 -> A1
        $a1 = Seat::where('schedule_id', $schedule->id)->where('seat_code', 'A1')->first();
        $this->assertEquals('standard', $a1->seat_type);
        $this->assertEquals('available', $a1->status);
        $this->assertEquals(1, $a1->seat_number);

        // Kursi fisik Baris A Kolom 3 terurut otomatis menjadi nomor fisik 2 (A2)
        $a3Physical = Seat::where('schedule_id', $schedule->id)->where('row_label', 'A')->where('grid_column', 3)->first();
        $this->assertEquals('standard', $a3Physical->seat_type);
        $this->assertEquals('available', $a3Physical->status);
        $this->assertEquals(2, $a3Physical->seat_number);
        $this->assertEquals('A2', $a3Physical->seat_code);

        // Kursi sellable (non-aisle) harus 12 - 2 (aisle) = 10
        $schedule->refresh();
        $this->assertEquals(10, $schedule->total_seats);
    }

    public function test_cannot_delete_event_with_paid_transactions(): void
    {
        $event = Event::create([
            'slug' => 'event-locked-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Locked Test',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/lock.jpg',
            'backdrop_path' => 'events/backdrops/lock.jpg',
            'director' => 'Director',
            'cast' => ['Cast'],
            'rules' => [],
            'venue_name' => 'Venue',
            'venue_address' => 'Address',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'studio_name' => 'Studio 1',
            'show_time' => now()->addDays(2),
            'ticket_price' => 50000,
            'total_seats' => 50,
            'is_active' => true,
        ]);

        EventTransaction::create([
            'order_id' => 'SNM-TKT-PAID-001',
            'user_id' => $this->customer->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 0,
            'net_amount' => 50000,
            'snap_token' => 'snap-test',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'snapshot_event_data' => ['title' => 'Event Locked Test'],
        ]);

        // Coba delete event yang sudah bertransaksi paid -> harus ditolak 422
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->deleteJson("/api/v1/admin/events/{$event->id}");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'EVENT_CANNOT_BE_DELETED',
            ]);

        $this->assertDatabaseHas('events', ['id' => $event->id]);
    }

    public function test_can_delete_event_without_paid_transactions(): void
    {
        $event = Event::create([
            'slug' => 'event-deletable-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Deletable Test',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/del.jpg',
            'backdrop_path' => 'events/backdrops/del.jpg',
            'director' => 'Director',
            'cast' => ['Cast'],
            'rules' => [],
            'venue_name' => 'Venue',
            'venue_address' => 'Address',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->deleteJson("/api/v1/admin/events/{$event->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Event berhasil dihapus.',
            ]);

        $this->assertDatabaseMissing('events', ['id' => $event->id]);
    }

    public function test_cannot_regenerate_seats_when_schedule_has_paid_tickets(): void
    {
        $event = Event::create([
            'slug' => 'event-seatmap-locked',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Seatmap Locked',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'events/posters/smlock.jpg',
            'backdrop_path' => 'events/backdrops/smlock.jpg',
            'director' => 'Director',
            'cast' => ['Cast'],
            'rules' => [],
            'venue_name' => 'Venue',
            'venue_address' => 'Address',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'studio_name' => 'Studio 1',
            'show_time' => now()->addDays(2),
            'ticket_price' => 50000,
            'total_seats' => 50,
            'is_active' => true,
        ]);

        Seat::create([
            'schedule_id' => $schedule->id,
            'seat_code' => 'A1',
            'row_label' => 'A',
            'seat_number' => 1,
            'seat_type' => 'standard',
            'status' => 'booked',
        ]);

        EventTransaction::create([
            'order_id' => 'SNM-TKT-PAID-002',
            'user_id' => $this->customer->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 0,
            'net_amount' => 50000,
            'snap_token' => 'snap-test-2',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'snapshot_event_data' => ['title' => 'Event Seatmap Locked'],
        ]);

        $payload = [
            'rows' => 5,
            'columns' => 10,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$schedule->id}/seats/generate", $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'SEATMAP_LOCKED',
            ]);
    }

    public function test_admin_event_routes_have_proper_throttle_middleware(): void
    {
        $routes = Route::getRoutes();

        $indexRoute = $routes->getByAction('App\Http\Controllers\Admin\V1\Events\AdminEventController@index');
        $this->assertNotNull($indexRoute);
        $this->assertTrue(collect($indexRoute->gatherMiddleware())->contains(fn ($m) => str_starts_with($m, 'throttle:60')));

        $storeRoute = $routes->getByAction('App\Http\Controllers\Admin\V1\Events\AdminEventController@store');
        $this->assertNotNull($storeRoute);
        $this->assertTrue(collect($storeRoute->gatherMiddleware())->contains(fn ($m) => str_starts_with($m, 'throttle:20')));
    }

    public function test_super_admin_can_save_event_with_custom_seat_map_config_and_customer_can_view_seats(): void
    {
        Storage::fake('r2');
        $posterFile = UploadedFile::fake()->image('poster.jpg', 600, 900);
        $backdropFile = UploadedFile::fake()->image('backdrop.jpg', 1280, 720);

        $payload = [
            'title' => 'Special Screening Custom Seatmap',
            'slug' => 'special-screening-custom-seatmap',
            'description' => 'Special screening with customized seat layout.',
            'synopsis_short' => 'Synopsis of customized screening.',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'cinema_partner' => 'CGV Cinemas',
            'venue_name' => 'CGV Grand Indonesia',
            'venue_address' => 'Jl. MH Thamrin No. 1, Jakarta Pusat',
            'city' => 'Jakarta Pusat',
            'director' => 'Christopher Nolan',
            'cast' => ['Cillian Murphy', 'Emily Blunt'],
            'is_active' => true,
            'poster' => $posterFile,
            'backdrop' => $backdropFile,
            'venues' => [
                [
                    'venue_name' => 'CGV Grand Indonesia',
                    'cinema_partner' => 'CGV Cinemas',
                    'venue_address' => 'Jl. MH Thamrin No. 1',
                    'city' => 'Jakarta Pusat',
                    'schedules' => [
                        [
                            'studio_name' => 'Audi 1',
                            'show_time' => now()->addDays(7)->setTime(19, 30)->toISOString(),
                            'ticket_price' => 75000,
                            'vip_ticket_price' => 100000,
                            'total_seats' => 20,
                            'seat_map_config' => [
                                'rows' => 4,
                                'columns' => 5,
                                'vip_seats' => ['D1', 'D2'],
                                'aisle_seats' => ['B2', 'A1'],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->post('/api/v1/admin/events', $payload);

        $response->assertStatus(201);
        $eventId = $response->json('data.id');

        // Verifikasi detail event yang dikembalikan memuat seat_map_config
        $detailResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/events/{$eventId}");

        $detailResponse->assertStatus(200);
        $scheduleData = $detailResponse->json('data.schedules.0');
        $this->assertEquals(4, $scheduleData['seat_map_config']['rows']);
        $this->assertEquals(5, $scheduleData['seat_map_config']['columns']);
        $this->assertEquals(['D1', 'D2'], $scheduleData['seat_map_config']['vip_seats']);
        $scheduleId = $scheduleData['id'];

        // Verifikasi customer dapat melihat kursi yang telah digenerate
        $customerResponse = $this->getJson("/api/v1/schedules/{$scheduleId}/seats");
        $customerResponse->assertStatus(200);
        $customerSeats = $customerResponse->json('data.seats');
        $this->assertCount(20, $customerSeats);

        // Verifikasi kursi VIP D1
        $d1Seat = collect($customerSeats)->firstWhere('seat_code', 'D1');
        $this->assertNotNull($d1Seat);
        $this->assertEquals('vip', $d1Seat['seat_type']);

        // Verifikasi kursi lorong/gang A1 pada koordinat grid 1
        $a1Aisle = collect($customerSeats)->first(fn ($s) => $s['row_label'] === 'A' && $s['grid_column'] === 1);
        $this->assertNotNull($a1Aisle);
        $this->assertEquals('aisle', $a1Aisle['seat_type']);
        $this->assertEquals('A-G1', $a1Aisle['seat_code']);

        // Verifikasi kursi fisik di sebelah gang (kolom grid 2) terurut menjadi A1
        $a1Physical = collect($customerSeats)->first(fn ($s) => $s['row_label'] === 'A' && $s['grid_column'] === 2);
        $this->assertNotNull($a1Physical);
        $this->assertEquals('standard', $a1Physical['seat_type']);
        $this->assertEquals('A1', $a1Physical['seat_code']);
    }

    public function test_super_admin_can_update_event_with_aisle_column_seats_and_persist_correctly(): void
    {
        Storage::fake('r2');
        $posterFile = UploadedFile::fake()->image('poster.jpg', 600, 900);
        $backdropFile = UploadedFile::fake()->image('backdrop.jpg', 1280, 720);

        // 1. Buat event awal dengan 6 baris x 10 kolom = 60 kursi
        $createPayload = [
            'title' => 'Cinema Hall With Aisle Column',
            'slug' => 'cinema-hall-with-aisle-column',
            'description' => 'Cinema hall testing aisle column persistence.',
            'synopsis_short' => 'Synopsis for hall with aisle column.',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'cinema_partner' => 'Cinema XXI',
            'venue_name' => 'Cinema XXI Senayan City',
            'venue_address' => 'Jl. Asia Afrika Lot 19',
            'city' => 'Jakarta Pusat',
            'director' => 'Christopher Nolan',
            'cast' => ['Actor 1'],
            'rules' => ['Rule 1'],
            'is_active' => true,
            'poster' => $posterFile,
            'backdrop' => $backdropFile,
            'venues' => [
                [
                    'venue_name' => 'Cinema XXI Senayan City',
                    'cinema_partner' => 'Cinema XXI',
                    'venue_address' => 'Jl. Asia Afrika Lot 19',
                    'city' => 'Jakarta Pusat',
                    'schedules' => [
                        [
                            'studio_name' => 'Studio 1',
                            'show_time' => now()->addDays(5)->setTime(19, 0)->toISOString(),
                            'ticket_price' => 50000,
                            'total_seats' => 60,
                            'seat_map_config' => [
                                'rows' => 6,
                                'columns' => 10,
                                'vip_seats' => [],
                                'disabled_seats' => [],
                                'aisle_seats' => [],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $createRes = $this->actingAs($this->superAdmin, 'sanctum')
            ->post('/api/v1/admin/events', $createPayload);
        $createRes->assertStatus(201);
        $eventId = $createRes->json('data.id');
        $venueId = $createRes->json('data.venues.0.id');
        $scheduleId = $createRes->json('data.schedules.0.id');

        // 2. Update event: jadikan seluruh kolom 6 sebagai Gang / Aisle (A6, B6, C6, D6, E6, F6)
        $column6Aisles = ['A6', 'B6', 'C6', 'D6', 'E6', 'F6'];
        $updatePayload = [
            'title' => 'Cinema Hall With Aisle Column Updated',
            'venues' => [
                [
                    'id' => $venueId,
                    'venue_name' => 'Cinema XXI Senayan City',
                    'cinema_partner' => 'Cinema XXI',
                    'venue_address' => 'Jl. Asia Afrika Lot 19',
                    'city' => 'Jakarta Pusat',
                    'schedules' => [
                        [
                            'id' => $scheduleId,
                            'studio_name' => 'Studio 1',
                            'show_time' => now()->addDays(5)->setTime(19, 0)->toISOString(),
                            'ticket_price' => 50000,
                            'total_seats' => 54, // 60 - 6 kursi gang = 54 kursi jual
                            'seat_map_config' => [
                                'rows' => 6,
                                'columns' => 10,
                                'vip_seats' => ['A1', 'A2'],
                                'disabled_seats' => [],
                                'aisle_seats' => $column6Aisles,
                                'total_capacity' => 54,
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $updateRes = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson("/api/v1/admin/events/{$eventId}", $updatePayload);
        $updateRes->assertStatus(200);

        // 3. Verifikasi show detail event mengembalikan aisle_seats kolom 6 secara konsisten
        $detailRes = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/events/{$eventId}");
        $detailRes->assertStatus(200);

        $savedSchedule = $detailRes->json('data.schedules.0');
        $this->assertEquals(54, $savedSchedule['total_seats']);
        $this->assertEquals(6, $savedSchedule['seat_map_config']['rows']);
        $this->assertEquals(10, $savedSchedule['seat_map_config']['columns']);
        $this->assertEquals(['A1', 'A2'], $savedSchedule['seat_map_config']['vip_seats']);
        $this->assertEquals($column6Aisles, $savedSchedule['seat_map_config']['aisle_seats']);

        // 4. Verifikasi customer seats endpoint
        $custRes = $this->getJson("/api/v1/schedules/{$scheduleId}/seats");
        $custRes->assertStatus(200);
        $seats = $custRes->json('data.seats');
        $this->assertCount(60, $seats);

        // Verifikasi semua sel di kolom grid 6 memiliki seat_type = aisle dan kode *-G6
        foreach (['A', 'B', 'C', 'D', 'E', 'F'] as $row) {
            $aisleItem = collect($seats)->first(fn ($s) => $s['row_label'] === $row && $s['grid_column'] === 6);
            $this->assertNotNull($aisleItem);
            $this->assertEquals('aisle', $aisleItem['seat_type']);
            $this->assertEquals("{$row}-G6", $aisleItem['seat_code']);
        }

        // Verifikasi kursi di kolom 5 adalah kursi fisik A5 (nomor 5)
        $a5Seat = collect($seats)->first(fn ($s) => $s['row_label'] === 'A' && $s['grid_column'] === 5);
        $this->assertEquals('standard', $a5Seat['seat_type']);
        $this->assertEquals('A5', $a5Seat['seat_code']);
        $this->assertEquals(5, $a5Seat['seat_number']);

        // Verifikasi kursi setelah gang di kolom 7 terurut sekuensial menjadi nomor 6 (A6)
        $a7Seat = collect($seats)->first(fn ($s) => $s['row_label'] === 'A' && $s['grid_column'] === 7);
        $this->assertEquals('standard', $a7Seat['seat_type']);
        $this->assertEquals('A6', $a7Seat['seat_code']);
        $this->assertEquals(6, $a7Seat['seat_number']);
    }

    public function test_super_admin_can_remove_poster_and_backdrop_by_setting_null(): void
    {
        $event = Event::create([
            'slug' => 'event-remove-images-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Remove Images Test',
            'description' => 'Deskripsi event',
            'synopsis_short' => 'Sinopsis singkat',
            'poster_path' => 'https://imagedelivery.net/Ej0iVL2MkGE4wj2UIskSSA/poster-id/public',
            'backdrop_path' => 'https://imagedelivery.net/Ej0iVL2MkGE4wj2UIskSSA/backdrop-id/public',
            'director' => 'Sutradara Test',
            'cast' => ['Aktor 1'],
            'venue_name' => 'Venue Test',
            'venue_address' => 'Alamat Test',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $this->assertNotNull($event->poster_path);
        $this->assertNotNull($event->backdrop_path);

        // Update event dengan mengirim poster_url: null dan backdrop_url: null
        $payload = [
            'poster_url' => null,
            'backdrop_url' => null,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson("/api/v1/admin/events/{$event->id}", $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Event berhasil diperbarui.',
            ]);

        $freshEvent = $event->fresh();
        $this->assertNull($freshEvent->poster_path);
        $this->assertNull($freshEvent->backdrop_path);
    }

    public function test_super_admin_can_update_event_metadata_when_schedule_has_paid_tickets(): void
    {
        $event = Event::create([
            'slug' => 'event-with-paid-tickets',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Avengers Endgame Original',
            'description' => 'Original description',
            'synopsis_short' => 'Original synopsis',
            'poster_path' => 'events/posters/test.jpg',
            'backdrop_path' => 'events/backdrops/test.jpg',
            'director' => 'Russo Brothers',
            'cast' => ['Robert Downey Jr.'],
            'rules' => ['No recording'],
            'is_active' => true,
        ]);

        $venue = $event->venues()->create([
            'venue_name' => 'Cinema XXI Grand Indonesia',
            'cinema_partner' => 'Cinema XXI',
            'venue_address' => 'Grand Indonesia West Mall Lt. 8',
            'city' => 'Jakarta Pusat',
        ]);

        $schedule = $event->schedules()->create([
            'event_venue_id' => $venue->id,
            'studio_name' => 'Studio 1',
            'show_time' => now()->addDays(5)->setTime(19, 0),
            'ticket_price' => 50000,
            'total_seats' => 60,
            'is_active' => true,
        ]);

        // Generate seats
        $seat = Seat::create([
            'schedule_id' => $schedule->id,
            'seat_code' => 'A1',
            'row_label' => 'A',
            'seat_number' => 1,
            'seat_type' => 'standard',
            'status' => 'booked',
        ]);

        // Ada transaksi paid
        EventTransaction::create([
            'order_id' => 'SNM-TKT-EXISTING-001',
            'user_id' => $this->customer->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 0,
            'net_amount' => 50000,
            'snap_token' => 'snap-existing',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'snapshot_event_data' => ['title' => 'Avengers Endgame Original'],
        ]);

        // Payload update dari frontend: kirim perubahan title bersama struktur venues & schedules
        $updatePayload = [
            'title' => 'Avengers Endgame: Extended Cut',
            'description' => 'Updated description',
            'venues' => [
                [
                    'id' => $venue->id,
                    'venue_name' => 'Cinema XXI Grand Indonesia',
                    'venue_address' => 'Grand Indonesia West Mall Lt. 8',
                    'city' => 'Jakarta Pusat',
                    'schedules' => [
                        [
                            'id' => $schedule->id,
                            'studio_name' => 'Studio 1',
                            'show_time' => $schedule->show_time->toIso8601String(),
                            'ticket_price' => 50000,
                            'total_seats' => 60,
                            'seat_map_config' => [
                                'rows' => 1,
                                'columns' => 1,
                                'vip_seats' => [],
                                'disabled_seats' => [],
                                'aisle_seats' => [],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson("/api/v1/admin/events/{$event->id}", $updatePayload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Event berhasil diperbarui.',
                'data' => [
                    'id' => $event->id,
                    'title' => 'Avengers Endgame: Extended Cut',
                ],
            ]);

        // Verifikasi kursi lama tidak terhapus
        $this->assertDatabaseHas('seats', [
            'id' => $seat->id,
            'schedule_id' => $schedule->id,
            'seat_code' => 'A1',
            'status' => 'booked',
        ]);

        $freshEvent = $event->fresh();
        $this->assertEquals('Avengers Endgame: Extended Cut', $freshEvent->title);
    }

    public function test_super_admin_cannot_modify_seats_of_schedule_with_paid_tickets(): void
    {
        $event = Event::create([
            'slug' => 'avengers-locked-layout-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Avengers Endgame Layout Locked',
            'description' => 'Original description',
            'synopsis_short' => 'Original synopsis',
            'poster_path' => 'events/posters/avengers.jpg',
            'backdrop_path' => 'events/backdrops/avengers.jpg',
            'director' => 'Anthony Russo',
            'cast' => ['Robert Downey Jr.'],
            'rules' => ['Dilarang merekam'],
            'venue_name' => 'Cinema XXI Grand Indonesia',
            'venue_address' => 'Grand Indonesia West Mall Lt. 8',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $venue = $event->venues()->create([
            'venue_name' => 'Cinema XXI Grand Indonesia',
            'cinema_partner' => 'Cinema XXI',
            'venue_address' => 'Grand Indonesia West Mall Lt. 8',
            'city' => 'Jakarta Pusat',
        ]);

        $schedule = $event->schedules()->create([
            'event_venue_id' => $venue->id,
            'studio_name' => 'Studio 1',
            'show_time' => now()->addDays(5)->setTime(19, 0),
            'ticket_price' => 50000,
            'total_seats' => 60,
            'is_active' => true,
        ]);

        $seat = Seat::create([
            'schedule_id' => $schedule->id,
            'seat_code' => 'A1',
            'row_label' => 'A',
            'seat_number' => 1,
            'seat_type' => 'standard',
            'status' => 'booked',
        ]);

        EventTransaction::create([
            'order_id' => 'SNM-TKT-PAID-LOCK-01',
            'user_id' => $this->customer->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 0,
            'net_amount' => 50000,
            'snap_token' => 'snap-locked',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'snapshot_seats' => ['A1'],
            'snapshot_event_data' => ['title' => 'Avengers Endgame Layout Locked'],
        ]);

        // Mencoba mengubah denah menjadi 6 baris x 10 kolom dengan gang
        $updatePayload = [
            'title' => 'Avengers Endgame Changed',
            'venues' => [
                [
                    'id' => $venue->id,
                    'venue_name' => 'Cinema XXI Grand Indonesia',
                    'venue_address' => 'Grand Indonesia West Mall Lt. 8',
                    'city' => 'Jakarta Pusat',
                    'schedules' => [
                        [
                            'id' => $schedule->id,
                            'studio_name' => 'Studio 1',
                            'show_time' => $schedule->show_time->toIso8601String(),
                            'ticket_price' => 50000,
                            'total_seats' => 50,
                            'seat_map_config' => [
                                'rows' => 6,
                                'columns' => 10,
                                'aisle_seats' => ['A5', 'A6'],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson("/api/v1/admin/events/{$event->id}", $updatePayload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'SEATMAP_LOCKED',
            ]);

        $this->assertStringContainsString('terkunci', $response->json('message'));
        $this->assertStringContainsString('A1', $response->json('message'));
    }

    public function test_super_admin_can_create_and_update_event_with_structured_cast_containing_actor_and_role(): void
    {
        Storage::fake('r2');

        $payload = [
            'title' => 'Film Habibi & Ainun Screening',
            'slug' => 'habibi-ainun-screening',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'synopsis_short' => 'Kisah cinta inspiratif.',
            'description' => 'Deskripsi lengkap pemutaran film.',
            'director' => 'Faozan Rizal',
            'cast' => [
                ['actor' => 'Reza Rahadian', 'role' => 'B.J. Habibie'],
                ['actor' => 'Bunga Citra Lestari', 'role' => 'Ainun'],
                ['actor' => 'Tio Pakusadewo', 'role' => null],
            ],
            'genre' => ['Drama', 'Biografi'],
            'venue_name' => 'Cinema XXI Epicentrum',
            'venue_address' => 'Jl. HR Rasuna Said, Jakarta Selatan',
            'city' => 'Jakarta Selatan',
            'poster_url' => 'https://assets.sinemus.id/posters/habibie.jpg',
            'backdrop_url' => 'https://assets.sinemus.id/backdrops/habibie.jpg',
            'is_published' => true,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/events', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Film Habibi & Ainun Screening',
                    'cast' => [
                        ['actor' => 'Reza Rahadian', 'role' => 'B.J. Habibie'],
                        ['actor' => 'Bunga Citra Lestari', 'role' => 'Ainun'],
                        ['actor' => 'Tio Pakusadewo', 'role' => null],
                    ],
                ],
            ]);

        $eventId = $response->json('data.id');

        // Test update
        $updatePayload = [
            'cast' => [
                ['actor' => 'Reza Rahadian', 'role' => 'Presiden B.J. Habibie'],
            ],
        ];

        $updateResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson("/api/v1/admin/events/{$eventId}", $updatePayload);

        $updateResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'cast' => [
                        ['actor' => 'Reza Rahadian', 'role' => 'Presiden B.J. Habibie'],
                    ],
                ],
            ]);
    }

    public function test_seats_are_renumbered_sequentially_skipping_aisles_for_real_cinema_layout(): void
    {
        $event = Event::create([
            'slug' => 'cinema-sequential-layout-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Cinema Sequential Layout Test',
            'description' => 'Test denah bioskop nomor sekuensial',
            'synopsis_short' => 'Sinopsis',
            'director' => 'Christopher Nolan',
            'cast' => ['Cillian Murphy'],
            'city' => 'Jakarta Pusat',
            'venue_name' => 'Cinema XXI Plaza Indonesia',
            'venue_address' => 'Jl. M.H. Thamrin Kav. 28-30',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'studio_name' => 'Studio 1 Premiere',
            'show_time' => now()->addDays(2),
            'ticket_price' => 50000,
            'vip_ticket_price' => 70000,
            'total_seats' => 60,
            'is_active' => true,
        ]);

        // Denah 6 baris x 10 kolom:
        // Kolom 5 & 6 dijadikan lorong/gang pada baris A sampai E (10 sel gang)
        // Baris A kolom 1..4 dan 7..10 adalah VIP (8 kursi VIP)
        $aisles = [];
        foreach (['A', 'B', 'C', 'D', 'E'] as $row) {
            $aisles[] = "{$row}5";
            $aisles[] = "{$row}6";
        }

        $vips = ['A1', 'A2', 'A3', 'A4', 'A7', 'A8', 'A9', 'A10'];

        $payload = [
            'rows' => 6,
            'columns' => 10,
            'vip_seats' => $vips,
            'aisle_seats' => $aisles,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$schedule->id}/seats/generate", $payload);

        $response->assertStatus(200);

        // 6 baris x 10 kolom = 60 sel denah
        $this->assertEquals(60, Seat::where('schedule_id', $schedule->id)->count());

        // Kapasitas riil: 60 - 10 gang = 50 kursi
        $schedule->refresh();
        $this->assertEquals(50, $schedule->total_seats);

        // Customer endpoint verifikasi
        $custRes = $this->getJson("/api/v1/schedules/{$schedule->id}/seats");
        $custRes->assertStatus(200);
        $seats = $custRes->json('data.seats');
        $this->assertCount(60, $seats);

        // Verifikasi Baris A:
        // Kursi sebelum gang: 1..4 (A1..A4, VIP)
        for ($c = 1; $c <= 4; $c++) {
            $seat = collect($seats)->first(fn ($s) => $s['row_label'] === 'A' && $s['grid_column'] === $c);
            $this->assertNotNull($seat);
            $this->assertEquals($c, $seat['seat_number']);
            $this->assertEquals("A{$c}", $seat['seat_code']);
            $this->assertEquals('vip', $seat['seat_type']);
            $this->assertEquals('available', $seat['status']);
        }

        // Gang di kolom 5 & 6:
        $gang5 = collect($seats)->first(fn ($s) => $s['row_label'] === 'A' && $s['grid_column'] === 5);
        $this->assertEquals('aisle', $gang5['seat_type']);
        $this->assertEquals('A-G5', $gang5['seat_code']);
        $this->assertEquals(0, $gang5['seat_number']);

        $gang6 = collect($seats)->first(fn ($s) => $s['row_label'] === 'A' && $s['grid_column'] === 6);
        $this->assertEquals('aisle', $gang6['seat_type']);
        $this->assertEquals('A-G6', $gang6['seat_code']);
        $this->assertEquals(0, $gang6['seat_number']);

        // Kursi setelah gang: Kolom 7, 8, 9, 10 TERURUT SEKUENSIAL menjadi 5, 6, 7, 8 (A5..A8, VIP)
        $colExpectedPairs = [
            7 => ['num' => 5, 'code' => 'A5'],
            8 => ['num' => 6, 'code' => 'A6'],
            9 => ['num' => 7, 'code' => 'A7'],
            10 => ['num' => 8, 'code' => 'A8'],
        ];

        foreach ($colExpectedPairs as $gridCol => $expected) {
            $seat = collect($seats)->first(fn ($s) => $s['row_label'] === 'A' && $s['grid_column'] === $gridCol);
            $this->assertNotNull($seat);
            $this->assertEquals($expected['num'], $seat['seat_number'], "Kolom {$gridCol} seharusnya bernomor fisik {$expected['num']}");
            $this->assertEquals($expected['code'], $seat['seat_code'], "Kolom {$gridCol} seharusnya berkode {$expected['code']}");
            $this->assertEquals('vip', $seat['seat_type']);
            $this->assertEquals('available', $seat['status']);
        }

        // Verifikasi Baris F (tanpa gang, seluruh 10 kursi terurut 1..10 standard)
        for ($c = 1; $c <= 10; $c++) {
            $seat = collect($seats)->first(fn ($s) => $s['row_label'] === 'F' && $s['grid_column'] === $c);
            $this->assertNotNull($seat);
            $this->assertEquals($c, $seat['seat_number']);
            $this->assertEquals("F{$c}", $seat['seat_code']);
            $this->assertEquals('standard', $seat['seat_type']);
            $this->assertEquals('available', $seat['status']);
        }
    }

    public function test_super_admin_can_update_event_without_changes_cleanly(): void
    {
        Storage::fake('r2');
        $posterFile = UploadedFile::fake()->image('poster.jpg', 600, 900);
        $backdropFile = UploadedFile::fake()->image('backdrop.jpg', 1280, 720);

        // 1. Buat event dengan multiple venues dan multiple schedules
        $createPayload = [
            'title' => 'Unchanged Event Save Test',
            'slug' => 'unchanged-event-save-test',
            'description' => 'Testing idempotency and clean update.',
            'synopsis_short' => 'Synopsis test.',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'cinema_partner' => 'Cinema XXI',
            'venue_name' => 'Venue 1',
            'venue_address' => 'Address 1',
            'city' => 'Jakarta',
            'director' => 'Director',
            'cast' => ['Actor 1'],
            'is_active' => true,
            'poster' => $posterFile,
            'backdrop' => $backdropFile,
            'venues' => [
                [
                    'venue_name' => 'Venue 1',
                    'cinema_partner' => 'Cinema XXI',
                    'venue_address' => 'Address 1',
                    'city' => 'Jakarta',
                    'schedules' => [
                        [
                            'studio_name' => 'Studio 1',
                            'show_time' => now()->addDays(5)->toISOString(),
                            'ticket_price' => 50000,
                            'total_seats' => 60,
                            'seat_map_config' => [
                                'rows' => 6,
                                'columns' => 10,
                                'vip_seats' => ['A1', 'A2'],
                                'disabled_seats' => [],
                                'aisle_seats' => ['A5', 'A6', 'B5', 'B6'],
                                'total_capacity' => 56,
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $createRes = $this->actingAs($this->superAdmin, 'sanctum')
            ->post('/api/v1/admin/events', $createPayload);
        $createRes->assertStatus(201);
        $eventId = $createRes->json('data.id');

        // 2. Ambil detail event via GET
        $getRes = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/events/{$eventId}");
        $getRes->assertStatus(200);
        $eventDetail = $getRes->json('data');

        // 3. Simulasikan frontend: gunakan data persis seperti yang di-return oleh detail
        $updatePayload = [
            'title' => $eventDetail['title'],
            'slug' => $eventDetail['slug'],
            'description' => $eventDetail['description'],
            'synopsis_short' => $eventDetail['synopsis_short'],
            'director' => $eventDetail['director'],
            'cast' => $eventDetail['cast'],
            'genre' => $eventDetail['genre'],
            'duration_minutes' => $eventDetail['duration_minutes'],
            'release_year' => $eventDetail['release_year'],
            'age_rating' => $eventDetail['age_rating'],
            'event_type' => $eventDetail['event_type'],
            'seating_type' => $eventDetail['seating_type'],
            'cinema_partner' => $eventDetail['cinema_partner'],
            'target_screening_month' => $eventDetail['target_screening_month'],
            'poster_url' => $eventDetail['poster_url'],
            'backdrop_url' => $eventDetail['backdrop_url'],
            'is_published' => $eventDetail['is_published'],
            'is_active' => $eventDetail['is_active'],
            'is_featured' => $eventDetail['is_featured'],
            'venues' => array_map(function ($venue) use ($eventDetail) {
                return [
                    'id' => $venue['id'],
                    'venue_name' => $venue['venue_name'],
                    'cinema_partner' => $venue['cinema_partner'],
                    'venue_address' => $venue['venue_address'],
                    'city' => $venue['city'],
                    'google_maps_url' => $venue['google_maps_url'],
                    'schedules' => array_map(function ($sched) {
                        return [
                            'id' => $sched['id'],
                            'studio_name' => $sched['studio_name'],
                            'show_time' => $sched['show_time'],
                            'ticket_price' => $sched['ticket_price'],
                            'vip_ticket_price' => $sched['vip_ticket_price'],
                            'total_seats' => $sched['total_seats'],
                            'seat_map_config' => $sched['seat_map_config'],
                        ];
                    }, $eventDetail['schedules']),
                ];
            }, $eventDetail['venues']),
            'schedules' => array_map(function ($sched) {
                return [
                    'id' => $sched['id'],
                    'studio_name' => $sched['studio_name'],
                    'show_time' => $sched['show_time'],
                    'ticket_price' => $sched['ticket_price'],
                    'vip_ticket_price' => $sched['vip_ticket_price'],
                    'total_seats' => $sched['total_seats'],
                    'seat_map_config' => $sched['seat_map_config'],
                ];
            }, $eventDetail['schedules']),
        ];

        $updateRes = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson("/api/v1/admin/events/{$eventId}", $updatePayload);

        $updateRes->assertStatus(200);
        $updateRes->assertJson([
            'success' => true,
            'message' => 'Event berhasil diperbarui.',
        ]);

        // Verifikasi kursi customer masih utuh 60 kursi dengan gang di A5, A6, B5, B6
        $scheduleId = $eventDetail['schedules'][0]['id'];
        $customerSeatsRes = $this->getJson("/api/v1/schedules/{$scheduleId}/seats");
        $customerSeatsRes->assertStatus(200);
        $seats = $customerSeatsRes->json('data.seats');
        $this->assertCount(60, $seats);
    }

    public function test_updating_event_synchronizes_linked_banner_title_synopsis_and_metadata(): void
    {
        Storage::fake('r2');

        $event = Event::create([
            'title' => 'Avengers Endgame: Encore',
            'slug' => 'avengers-endgame-encore',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'director' => 'Russo Brothers',
            'cast' => ['Robert Downey Jr.'],
            'rules' => [],
            'description' => 'Deskripsi lama',
            'synopsis_short' => 'Penayangan Spesial di Bandung',
            'age_rating' => '13+',
            'genre' => ['Drama', 'Sejarah'],
            'release_year' => 2024,
            'duration_minutes' => 135,
            'is_active' => true,
        ]);

        $banner = Banner::create([
            'title' => 'Avengers Endgame: Encore',
            'subtitle' => 'Penayangan Spesial di Bandung',
            'badge_text' => null,
            'age_rating' => '13+',
            'genre' => 'Drama, Sejarah',
            'release_year' => 2024,
            'duration_minutes' => 135,
            'image_path' => 'banners/dummy.jpg',
            'display_mode' => 'spotlight',
            'link_type' => 'event',
            'event_id' => $event->id,
            'button_text' => 'Beli Tiket Sekarang',
            'order_priority' => 1,
            'is_active' => true,
        ]);

        $updatePayload = [
            'title' => 'Cinta dan Sejarah',
            'slug' => 'cinta-dan-sejarah-updated',
            'synopsis_short' => 'Sinopsis kisah cinta dan sejarah yang monumental.',
            'age_rating' => '17+',
            'genre' => ['Romance', 'History'],
            'release_year' => 2025,
            'duration_minutes' => 140,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson("/api/v1/admin/events/{$event->id}", $updatePayload);

        $response->assertStatus(200);

        // Verifikasi database banner ikut terupdate
        $banner->refresh();
        $this->assertEquals('Cinta dan Sejarah', $banner->title);
        $this->assertEquals('Sinopsis kisah cinta dan sejarah yang monumental.', $banner->subtitle);
        $this->assertEquals('17+', $banner->age_rating);
        $this->assertEquals('Romance, History', $banner->genre);
        $this->assertEquals(2025, $banner->release_year);
        $this->assertEquals(140, $banner->duration_minutes);

        // Verifikasi response endpoint publik /api/v1/banners
        $publicBannerRes = $this->getJson('/api/v1/banners');
        $publicBannerRes->assertStatus(200);
        $bannerData = collect($publicBannerRes->json('data'))->firstWhere('id', $banner->id);
        $this->assertNotNull($bannerData);
        $this->assertEquals('Cinta dan Sejarah', $bannerData['title']);
        $this->assertEquals('Sinopsis kisah cinta dan sejarah yang monumental.', $bannerData['subtitle']);
    }
}
