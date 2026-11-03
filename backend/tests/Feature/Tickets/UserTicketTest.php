<?php

namespace Tests\Feature\Tickets;

use App\Mail\Tickets\TicketConfirmationMail;
use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\SeatLock;
use App\Models\User;
use App\Services\Tickets\TicketPdfService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserTicketTest extends TestCase
{
    use RefreshDatabase;

    protected User $userA;

    protected User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->userA = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        $this->userB = User::factory()->create([
            'name' => 'Siti Rahma',
            'email' => 'siti@example.com',
            'phone_number' => '081298765432',
            'is_phone_locked' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_tickets_list(): void
    {
        $response = $this->getJson('/api/v1/user/tickets');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_access_ticket_detail(): void
    {
        $response = $this->getJson('/api/v1/user/tickets/TKT-SAMPLE-123');

        $response->assertStatus(401);
    }

    public function test_user_can_get_empty_tickets_list_when_no_tickets_owned(): void
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Daftar tiket penonton berhasil diambil.',
                'data' => [],
            ]);

        $this->assertNotNull($response->json('server_time'));
    }

    public function test_user_can_list_my_tickets_with_contract_conformance(): void
    {
        $event = Event::create([
            'slug' => 'cinta-dan-sejarah-premiere',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Cinta dan Sejarah (Special Premiere)',
            'description' => 'Screening eksklusif bersama sutradara.',
            'synopsis_short' => 'Film romansa sejarah.',
            'poster_path' => 'posters/cds.jpg',
            'backdrop_path' => 'backdrops/cds.jpg',
            'director' => 'Arya Sinema',
            'cast' => ['Aktor 1', 'Aktris 2'],
            'rules' => ['Dilarang Merekam'],
            'venue_name' => 'Cinema XXI Plaza Senayan (Studio 2)',
            'venue_address' => 'Plaza Senayan Lt. 5, Jl. Asia Afrika No.8, Jakarta Pusat',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(5)->setHour(19)->setMinute(0)->setSecond(0),
            'ticket_price' => 55000.00,
            'total_seats' => 120,
            'is_active' => true,
            'studio_name' => 'Studio 2',
        ]);

        EventTransaction::create([
            'order_id' => 'SNM-TKT-20261101-0001',
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 110000.00,
            'discount_amount' => 0.00,
            'net_amount' => 110000.00,
            'snap_token' => 'snap_token_123',
            'payment_status' => 'paid',
            'payment_type' => 'gopay',
            'paid_at' => now(),
            'ticket_code' => 'TKT-CDS-001',
            'qr_hash' => '9f8e7d6c5b4a3120',
            'checkin_status' => 'pending',
            'snapshot_event_data' => [
                'event_title' => $event->title,
                'venue_name' => $event->venue_name,
                'city' => $event->city,
                'show_time' => $schedule->show_time->toIso8601String(),
            ],
            'snapshot_seats' => ['C5', 'C6'],
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'order_id',
                        'event_type',
                        'ticket_code',
                        'qr_hash',
                        'event_title',
                        'poster_url',
                        'venue_name',
                        'city',
                        'show_time',
                        'seat_codes',
                        'payment_status',
                        'checkin_status',
                        'fulfillment_status',
                        'cinema_ticket',
                        'is_upcoming',
                    ],
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    [
                        'order_id' => 'SNM-TKT-20261101-0001',
                        'ticket_code' => 'TKT-CDS-001',
                        'qr_hash' => '9f8e7d6c5b4a3120',
                        'event_title' => 'Cinta dan Sejarah (Special Premiere)',
                        'venue_name' => 'Cinema XXI Plaza Senayan (Studio 2)',
                        'city' => 'Jakarta Pusat',
                        'seat_codes' => ['C5', 'C6'],
                        'payment_status' => 'paid',
                        'checkin_status' => 'pending',
                        'is_upcoming' => true,
                    ],
                ],
            ]);
    }

    public function test_user_can_filter_upcoming_past_and_all_tickets(): void
    {
        $event = Event::create([
            'slug' => 'festival-film',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Festival Film Jakarta',
            'description' => 'Event festival.',
            'synopsis_short' => 'Event sinema.',
            'poster_path' => 'posters/fest.jpg',
            'backdrop_path' => 'backdrops/fest.jpg',
            'director' => 'Sutradara Festival',
            'cast' => ['Cast 1'],
            'rules' => ['Rule 1'],
            'venue_name' => 'Teater Wahyu Sihombing',
            'venue_address' => 'TIM Cikini, Jakarta Pusat',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        // Schedule 1: Future
        $futureSchedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(3),
            'ticket_price' => 50000.00,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Auditorium 1',
        ]);

        // Schedule 2: Past
        $pastSchedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->subDays(2),
            'ticket_price' => 50000.00,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Auditorium 2',
        ]);

        $snapshotEventData = [
            'event_title' => $event->title,
            'venue_name' => $event->venue_name,
            'city' => $event->city,
        ];

        // Ticket 1: Upcoming (Future & checkin pending)
        EventTransaction::create([
            'order_id' => 'SNM-TKT-UPCOMING',
            'user_id' => $this->userA->id,
            'schedule_id' => $futureSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'paid',
            'ticket_code' => 'TKT-UPCOMING-01',
            'qr_hash' => 'hash_upcoming_01',
            'checkin_status' => 'pending',
            'snapshot_event_data' => $snapshotEventData,
            'snapshot_seats' => ['A1'],
        ]);

        // Ticket 2: Past by show_time
        EventTransaction::create([
            'order_id' => 'SNM-TKT-PAST-TIME',
            'user_id' => $this->userA->id,
            'schedule_id' => $pastSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'paid',
            'ticket_code' => 'TKT-PAST-02',
            'qr_hash' => 'hash_past_02',
            'checkin_status' => 'pending',
            'snapshot_event_data' => $snapshotEventData,
            'snapshot_seats' => ['A2'],
        ]);

        // Ticket 3: Past by checkin (Future show_time but already checked_in)
        EventTransaction::create([
            'order_id' => 'SNM-TKT-PAST-CHECKEDIN',
            'user_id' => $this->userA->id,
            'schedule_id' => $futureSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'paid',
            'ticket_code' => 'TKT-CHECKEDIN-03',
            'qr_hash' => 'hash_checkedin_03',
            'checkin_status' => 'checked_in',
            'checkin_at' => now()->subHour(),
            'snapshot_event_data' => $snapshotEventData,
            'snapshot_seats' => ['A3'],
        ]);

        // 1. Filter status=upcoming
        $upcomingResponse = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets?status=upcoming');

        $upcomingResponse->assertStatus(200);
        $this->assertCount(1, $upcomingResponse->json('data'));
        $this->assertEquals('SNM-TKT-UPCOMING', $upcomingResponse->json('data.0.order_id'));
        $this->assertTrue($upcomingResponse->json('data.0.is_upcoming'));

        // 2. Filter filter=active (alias upcoming)
        $activeResponse = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets?filter=active');

        $activeResponse->assertStatus(200);
        $this->assertCount(1, $activeResponse->json('data'));
        $this->assertEquals('SNM-TKT-UPCOMING', $activeResponse->json('data.0.order_id'));

        // 3. Filter status=past
        $pastResponse = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets?status=past');

        $pastResponse->assertStatus(200);
        $this->assertCount(2, $pastResponse->json('data'));
        $pastOrderIds = collect($pastResponse->json('data'))->pluck('order_id')->all();
        $this->assertContains('SNM-TKT-PAST-TIME', $pastOrderIds);
        $this->assertContains('SNM-TKT-PAST-CHECKEDIN', $pastOrderIds);

        // 4. Filter status=all
        $allResponse = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets?status=all');

        $allResponse->assertStatus(200);
        $this->assertCount(3, $allResponse->json('data'));
    }

    public function test_user_can_get_ticket_detail_by_ticket_code_and_order_id(): void
    {
        $event = Event::create([
            'slug' => 'imtihan-screening',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Imtihan (Screening & Diskusi Komunitas)',
            'description' => 'Pemutaran film independen.',
            'synopsis_short' => 'Film religi kontemplatif.',
            'poster_path' => 'posters/imtihan.jpg',
            'backdrop_path' => 'backdrops/imtihan.jpg',
            'director' => 'Sutradara Imtihan',
            'cast' => ['Aktor Imtihan'],
            'rules' => ['Tepat Waktu'],
            'venue_name' => 'Auditorium IFI Thamrin',
            'venue_address' => 'Jl. M.H. Thamrin No.20, Menteng, Jakarta Pusat',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::parse('2026-11-29T15:30:00+07:00'),
            'ticket_price' => 45000.00,
            'total_seats' => 80,
            'is_active' => true,
            'studio_name' => 'Main Hall',
        ]);

        $transaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-20261103-0003',
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 90000.00,
            'discount_amount' => 0.00,
            'net_amount' => 90000.00,
            'payment_status' => 'paid',
            'payment_type' => 'qris',
            'paid_at' => Carbon::parse('2026-11-03T09:40:00+07:00'),
            'ticket_code' => 'TKT-IMT-003',
            'qr_hash' => 'snm_reg_7a8b9c0d1e2f3a4b',
            'checkin_status' => 'pending',
            'snapshot_event_data' => [
                'event_title' => $event->title,
                'venue_name' => $event->venue_name,
                'city' => $event->city,
                'show_time' => $schedule->show_time->toIso8601String(),
            ],
            'snapshot_seats' => ['B8', 'B9'],
        ]);

        // 1. Ambil detail via ticket_code
        $responseCode = $this->actingAs($this->userA, 'sanctum')
            ->getJson("/api/v1/user/tickets/{$transaction->ticket_code}");

        $responseCode->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Detail e-tiket penonton berhasil diambil.',
                'data' => [
                    'order_id' => 'SNM-TKT-20261103-0003',
                    'ticket_code' => 'TKT-IMT-003',
                    'qr_hash' => 'snm_reg_7a8b9c0d1e2f3a4b',
                    'buyer_name' => 'Budi Santoso',
                    'buyer_phone' => '081234567890',
                    'event_title' => 'Imtihan (Screening & Diskusi Komunitas)',
                    'venue_name' => 'Auditorium IFI Thamrin',
                    'venue_address' => 'Jl. M.H. Thamrin No.20, Menteng, Jakarta Pusat',
                    'city' => 'Jakarta Pusat',
                    'seat_codes' => ['B8', 'B9'],
                    'paid_amount' => 90000.0,
                    'formatted_paid_amount' => 'Rp 90.000',
                    'checkin_status' => 'pending',
                    'checkin_at' => null,
                    'fulfillment_status' => null,
                    'cinema_ticket' => null,
                ],
            ]);

        // 2. Ambil detail via order_id
        $responseOrderId = $this->actingAs($this->userA, 'sanctum')
            ->getJson("/api/v1/user/tickets/{$transaction->order_id}");

        $responseOrderId->assertStatus(200)
            ->assertJsonPath('data.ticket_code', 'TKT-IMT-003');
    }

    public function test_presale_cinema_ticket_with_injected_mtix_credentials(): void
    {
        $event = Event::create([
            'slug' => 'cinta-sejarah-presale',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Cinta dan Sejarah (Special Premiere XXI)',
            'description' => 'Premiere resmi di XXI.',
            'synopsis_short' => 'Presale cinema premiere.',
            'poster_path' => 'posters/cds.jpg',
            'backdrop_path' => 'backdrops/cds.jpg',
            'director' => 'Sutradara CDS',
            'cast' => ['Cast CDS'],
            'rules' => ['Rule XXI'],
            'venue_name' => 'Cinema XXI Plaza Senayan (Studio 2)',
            'venue_address' => 'Plaza Senayan Lt. 5, Jakarta Pusat',
            'city' => 'Jakarta Pusat',
            'cinema_partner' => 'Cinema XXI',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::parse('2026-11-28T19:00:00+07:00'),
            'ticket_price' => 55000.00,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio 2',
        ]);

        EventTransaction::create([
            'order_id' => 'SNM-TKT-20261102-0002',
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 110000.00,
            'discount_amount' => 0.00,
            'net_amount' => 110000.00,
            'payment_status' => 'paid',
            'payment_type' => 'bca_va',
            'paid_at' => Carbon::parse('2026-11-02T11:20:00+07:00'),
            'ticket_code' => 'TKT-CDS-002',
            'qr_hash' => '1a2b3c4d5e6f7890',
            'checkin_status' => 'pending',
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-849201',
            'cinema_passcode' => '382910',
            'cinema_qr_image_path' => 'cinema-tickets/permanent/mtx-849201.png',
            'cinema_ticket_notes' => 'Pencetakan karcis fisik di Self-Service Ticketing Kiosk XXI.',
            'fulfilled_at' => Carbon::parse('2026-11-25T14:30:00+07:00'),
            'snapshot_event_data' => [
                'event_title' => $event->title,
                'venue_name' => $event->venue_name,
                'city' => $event->city,
                'show_time' => $schedule->show_time->toIso8601String(),
            ],
            'snapshot_seats' => ['D10', 'D11'],
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets/TKT-CDS-002');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'event_type' => 'presale_cinema',
                    'fulfillment_status' => 'fulfilled',
                    'cinema_ticket' => [
                        'booking_code' => 'MTX-849201',
                        'passcode' => '382910',
                        'notes' => 'Pencetakan karcis fisik di Self-Service Ticketing Kiosk XXI.',
                    ],
                ],
            ]);

        $this->assertNotNull($response->json('data.cinema_ticket.qr_image_url'));
        $this->assertNotNull($response->json('data.cinema_ticket.fulfilled_at'));
    }

    public function test_anti_idor_user_b_cannot_view_user_a_ticket_detail(): void
    {
        $event = Event::create([
            'slug' => 'private-event',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Private Screening',
            'description' => 'Event deskripsi.',
            'synopsis_short' => 'Sinopsis.',
            'poster_path' => 'posters/private.jpg',
            'backdrop_path' => 'backdrops/private.jpg',
            'director' => 'Sutradara',
            'cast' => ['Cast'],
            'rules' => ['Rule'],
            'venue_name' => 'Studio Private',
            'venue_address' => 'Alamat Private',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(2),
            'ticket_price' => 50000.00,
            'total_seats' => 50,
            'is_active' => true,
            'studio_name' => 'Studio Private',
        ]);

        $ticketUserA = EventTransaction::create([
            'order_id' => 'SNM-TKT-USER-A-SECRET',
            'user_id' => $this->userA->id, // Milik User A
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'paid',
            'ticket_code' => 'TKT-SECRET-A',
            'qr_hash' => 'super_secret_qr_hash_a',
            'checkin_status' => 'pending',
            'snapshot_event_data' => [
                'event_title' => $event->title,
                'venue_name' => $event->venue_name,
                'city' => $event->city,
            ],
            'snapshot_seats' => ['A1'],
        ]);

        // User B mencoba mengakses tiket User A menggunakan ticket_code
        $responseByCode = $this->actingAs($this->userB, 'sanctum')
            ->getJson("/api/v1/user/tickets/{$ticketUserA->ticket_code}");

        // Wajib Fail-Closed 404 (mencegah enumerasi eksistensi tiket milik user lain)
        $responseByCode->assertStatus(404)
            ->assertJson([
                'success' => false,
            ]);

        // User B mencoba mengakses tiket User A menggunakan order_id
        $responseByOrder = $this->actingAs($this->userB, 'sanctum')
            ->getJson("/api/v1/user/tickets/{$ticketUserA->order_id}");

        $responseByOrder->assertStatus(404)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_anti_idor_user_b_cannot_see_user_a_ticket_in_tickets_list(): void
    {
        $event = Event::create([
            'slug' => 'event-list-idor',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event List IDOR Test',
            'description' => 'Event deskripsi.',
            'synopsis_short' => 'Sinopsis.',
            'poster_path' => 'posters/test.jpg',
            'backdrop_path' => 'backdrops/test.jpg',
            'director' => 'Sutradara',
            'cast' => ['Cast'],
            'rules' => ['Rule'],
            'venue_name' => 'Venue Test',
            'venue_address' => 'Alamat Test',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(2),
            'ticket_price' => 50000.00,
            'total_seats' => 50,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        // Tiket milik User A
        EventTransaction::create([
            'order_id' => 'SNM-TKT-ONLY-FOR-A',
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'paid',
            'ticket_code' => 'TKT-FOR-A',
            'qr_hash' => 'hash_for_a',
            'checkin_status' => 'pending',
            'snapshot_event_data' => [
                'event_title' => $event->title,
                'venue_name' => $event->venue_name,
                'city' => $event->city,
            ],
            'snapshot_seats' => ['A1'],
        ]);

        // User B mengambil daftar tiketnya sendiri
        $response = $this->actingAs($this->userB, 'sanctum')
            ->getJson('/api/v1/user/tickets?status=all');

        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data'));
    }

    public function test_invalid_status_filter_fails_validation(): void
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets?status=invalid_status_value');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_ticket_routes_have_throttle_middleware(): void
    {
        $routes = Route::getRoutes();

        $ticketsListRoute = $routes->getByName('api.v1.user.tickets.index')
            ?? collect($routes)->first(fn ($r) => $r->uri() === 'api/v1/user/tickets' && in_array('GET', $r->methods(), true));

        $this->assertNotNull($ticketsListRoute);
        $this->assertContains('throttle:60,1', $ticketsListRoute->middleware());

        $ticketDetailRoute = collect($routes)->first(fn ($r) => $r->uri() === 'api/v1/user/tickets/{code}' && in_array('GET', $r->methods(), true));

        $this->assertNotNull($ticketDetailRoute);
        $this->assertContains('throttle:60,1', $ticketDetailRoute->middleware());

        $pdfRoute = collect($routes)->first(fn ($r) => $r->uri() === 'api/v1/user/tickets/{order_id}/pdf' && in_array('GET', $r->methods(), true));
        $this->assertNotNull($pdfRoute);
        $this->assertContains('throttle:20,1', $pdfRoute->middleware());
    }

    private function createTestEvent(array $overrides = []): Event
    {
        return Event::create(array_merge([
            'slug' => 'event-'.uniqid(),
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Judul Film Test',
            'description' => 'Deskripsi film test lengkap.',
            'synopsis_short' => 'Sinopsis singkat film test.',
            'poster_path' => 'posters/test.jpg',
            'backdrop_path' => 'backdrops/test.jpg',
            'director' => 'Sutradara Test',
            'cast' => ['Aktor A', 'Aktor B'],
            'rules' => ['Aturan 1'],
            'venue_name' => 'Bioskop Test',
            'venue_address' => 'Alamat Bioskop Test',
            'city' => 'Jakarta Selatan',
            'is_active' => true,
        ], $overrides));
    }

    public function test_user_can_download_regular_ticket_pdf_successfully(): void
    {
        $event = $this->createTestEvent([
            'event_type' => 'regular',
            'title' => 'Screening Indie Klasik',
            'venue_name' => 'Bioskop Komunitas',
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->addDays(2),
            'ticket_price' => 50000,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        $transaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-TEST-REG-01',
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 100000,
            'discount_amount' => 0,
            'net_amount' => 100000,
            'snap_token' => 'snap_reg_01',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'ticket_code' => 'TKT-REG-01',
            'qr_hash' => 'hash_reg_01',
            'snapshot_event_data' => ['event_title' => $event->title],
            'snapshot_seats' => ['A1', 'A2'],
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->get('/api/v1/user/tickets/'.$transaction->order_id.'/pdf');

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename="Sinemus-Tiket-SNM-TKT-TEST-REG-01.pdf"', (string) $response->headers->get('Content-Disposition'));
        $this->assertNotEmpty($response->getContent());
    }

    public function test_user_can_download_presale_awaiting_receipt_pdf(): void
    {
        $event = $this->createTestEvent([
            'event_type' => 'presale_cinema',
            'title' => 'Film Layar Lebar Premiere',
            'venue_name' => 'Cinema XXI Senayan',
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->addDays(5),
            'ticket_price' => 60000,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio XXI',
        ]);

        $transaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-TEST-PRE-01',
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 60000,
            'discount_amount' => 0,
            'net_amount' => 60000,
            'snap_token' => 'snap_pre_01',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'fulfillment_status' => 'awaiting_cinema_ticket',
            'snapshot_event_data' => ['event_title' => $event->title],
            'snapshot_seats' => ['E10'],
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->get('/api/v1/user/tickets/'.$transaction->order_id.'/pdf');

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename="Sinemus-Bukti-Presale-SNM-TKT-TEST-PRE-01.pdf"', (string) $response->headers->get('Content-Disposition'));
    }

    public function test_user_can_download_presale_fulfilled_ticket_pdf(): void
    {
        $event = $this->createTestEvent([
            'event_type' => 'presale_cinema',
            'title' => 'Film Layar Lebar Premiere',
            'venue_name' => 'Cinema XXI Senayan',
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->addDays(5),
            'ticket_price' => 60000,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio XXI',
        ]);

        $transaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-TEST-FUL-01',
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 60000,
            'discount_amount' => 0,
            'net_amount' => 60000,
            'snap_token' => 'snap_ful_01',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-998877',
            'cinema_passcode' => '123456',
            'snapshot_event_data' => ['event_title' => $event->title],
            'snapshot_seats' => ['E10'],
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->get('/api/v1/user/tickets/'.$transaction->order_id.'/pdf');

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename="Sinemus-Tiket-Bioskop-SNM-TKT-TEST-FUL-01.pdf"', (string) $response->headers->get('Content-Disposition'));
    }

    public function test_anti_idor_user_b_cannot_download_user_a_ticket_pdf(): void
    {
        $event = $this->createTestEvent([
            'title' => 'IDOR Test Event',
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->addDays(1),
            'ticket_price' => 30000,
            'total_seats' => 50,
            'is_active' => true,
            'studio_name' => 'Hall A',
        ]);

        $transaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-IDOR-CHECK',
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 30000,
            'discount_amount' => 0,
            'net_amount' => 30000,
            'snap_token' => 'snap_idor',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'snapshot_event_data' => ['event_title' => $event->title],
        ]);

        // User B mencoba mengunduh PDF tiket milik User A
        $response = $this->actingAs($this->userB, 'sanctum')
            ->get('/api/v1/user/tickets/'.$transaction->order_id.'/pdf');

        $response->assertStatus(404);
    }

    public function test_ticket_confirmation_mail_has_pdf_attachment_and_accurate_payload(): void
    {
        $event = $this->createTestEvent([
            'event_type' => 'regular',
            'title' => 'Indie Cinema Festival 2026',
            'venue_name' => 'Goethe-Institut Jakarta',
            'city' => 'Jakarta Pusat',
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->addDays(2),
            'ticket_price' => 45000,
            'total_seats' => 80,
            'is_active' => true,
            'studio_name' => 'Auditorium Utama',
        ]);

        $transaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-ACCURACY-01',
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 90000,
            'discount_amount' => 0,
            'net_amount' => 90000,
            'snap_token' => 'snap_acc_01',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'ticket_code' => 'TKT-20260926-ACC01',
            'qr_hash' => 'hash_32chars_random_string_1234',
            'fulfillment_status' => 'fulfilled',
            'snapshot_event_data' => [
                'event_title' => $event->title,
                'venue_name' => $event->venue_name,
                'city' => $event->city,
                'studio_name' => $schedule->studio_name,
            ],
            'snapshot_seats' => ['C1', 'C2'],
        ]);

        $mailable = new TicketConfirmationMail($transaction);

        // 1. Verifikasi Email bebas attachment (berkas PDF diunduh via tombol on-demand)
        $attachments = $mailable->attachments();
        $this->assertCount(0, $attachments);

        // 2. Verifikasi Payload data sinkron, akurat, dan memiliki link unduh PDF resmi
        $this->assertEquals('SNM-TKT-ACCURACY-01', $mailable->payload['orderId']);
        $this->assertEquals('TKT-20260926-ACC01', $mailable->payload['ticketCode']);
        $this->assertEquals('Indie Cinema Festival 2026', $mailable->payload['eventTitle']);
        $this->assertEquals('Auditorium Utama', $mailable->payload['studioName']);
        $this->assertEquals('C1, C2', $mailable->payload['seatsText']);
        $this->assertNotEmpty($mailable->payload['qrDataUri']);
        $this->assertStringContainsString('/api/v1/user/tickets/SNM-TKT-ACCURACY-01/pdf', $mailable->payload['ticketPdfUrl']);
    }

    public function test_presale_fulfilled_mail_and_pdf_use_cinema_booking_credentials_for_kiosk(): void
    {
        $event = $this->createTestEvent([
            'event_type' => 'presale_cinema',
            'title' => 'Blockbuster Cinema Screening',
            'venue_name' => 'CGV Grand Indonesia',
            'city' => 'Jakarta Pusat',
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->addDays(3),
            'ticket_price' => 75000,
            'total_seats' => 120,
            'is_active' => true,
            'studio_name' => 'Starium 1',
        ]);

        $transaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-CGV-FULFILL',
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 75000,
            'discount_amount' => 0,
            'net_amount' => 75000,
            'snap_token' => 'snap_cgv_01',
            'payment_status' => 'paid',
            'paid_at' => now(),
            'ticket_code' => 'TKT-20260926-CGV01',
            'qr_hash' => 'sinemus_internal_hash_32chars',
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'CGV-BKG-9921',
            'cinema_passcode' => '8812',
            'snapshot_event_data' => [
                'event_title' => $event->title,
                'venue_name' => $event->venue_name,
                'city' => $event->city,
                'studio_name' => $schedule->studio_name,
            ],
            'snapshot_seats' => ['H10'],
        ]);

        $mailable = new TicketConfirmationMail($transaction);

        // Kredensial kiosk bioskop harus presisi
        $this->assertEquals('CGV-BKG-9921', $mailable->payload['cinemaBookingCode']);
        $this->assertEquals('8812', $mailable->payload['cinemaPasscode']);
        $this->assertEquals('Starium 1', $mailable->payload['studioName']);
        $this->assertStringContainsString('/api/v1/user/tickets/SNM-TKT-CGV-FULFILL/pdf', $mailable->payload['ticketPdfUrl']);

        // Verifikasi PDF viewData menghasilkan studio dan kredensial yang tepat
        $pdfService = app(TicketPdfService::class);
        $pdf = $pdfService->generateTicketPdf($this->userA->id, $transaction->order_id);
        $this->assertEquals('Sinemus-Tiket-Bioskop-SNM-TKT-CGV-FULFILL.pdf', $pdf['filename']);
        $this->assertNotEmpty($pdf['content']);
    }

    /**
     * Memverifikasi transisi siklus hidup tiket Presale Bioskop (XXI / CGV)
     * berbasis waktu sesi penayangan (show_time):
     * - Saat show_time >= now() -> Masuk filter upcoming & is_upcoming = true
     * - Saat show_time < now()  -> Masuk filter past & is_upcoming = false (meskipun checkin_status tidak di-scan oleh super admin)
     */
    public function test_presale_cinema_tickets_lifecycle_transition_based_on_show_time(): void
    {
        $event = Event::create([
            'slug' => 'cinta-dan-sejarah-presale-lifecycle',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Cinta dan Sejarah (Presale XXI)',
            'description' => 'Presale penayangan khusus di Cinema XXI.',
            'synopsis_short' => 'Film romansa sejarah.',
            'poster_path' => 'posters/cds-presale.jpg',
            'backdrop_path' => 'backdrops/cds-presale.jpg',
            'director' => 'Sutradara CDS',
            'cast' => ['Aktor 1'],
            'rules' => ['Rule 1'],
            'venue_name' => 'Cinema XXI Plaza Senayan (Studio 1)',
            'venue_address' => 'Plaza Senayan Lt. 5, Jakarta Pusat',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        // Sesi Masa Depan (Upcoming Presale)
        $upcomingSchedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->addDays(2)->setHour(19)->setMinute(0)->setSecond(0),
            'ticket_price' => 50000,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        // Sesi Masa Lampau (Past Presale)
        $pastSchedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->subHours(3),
            'ticket_price' => 50000,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        $snapshotEventData = [
            'event_title' => $event->title,
            'venue_name' => $event->venue_name,
            'city' => $event->city,
        ];

        // 1. Tiket Presale Masa Depan: Fulfilled & Upcoming
        EventTransaction::create([
            'order_id' => 'SNM-TKT-PRESALE-UPCOMING',
            'user_id' => $this->userA->id,
            'schedule_id' => $upcomingSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 0,
            'net_amount' => 50000,
            'payment_status' => 'paid',
            'paid_at' => now(),
            'ticket_code' => 'TKT-PRE-UPCOMING',
            'qr_hash' => 'hash_pre_upcoming',
            'checkin_status' => 'pending', // Presale tidak di-scan oleh super admin
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'XXI-BKG-UPCOMING',
            'cinema_passcode' => '1234',
            'snapshot_event_data' => $snapshotEventData,
            'snapshot_seats' => ['C5'],
        ]);

        // 2. Tiket Presale Masa Lalu: Fulfilled & Past by Session Time
        EventTransaction::create([
            'order_id' => 'SNM-TKT-PRESALE-PAST',
            'user_id' => $this->userA->id,
            'schedule_id' => $pastSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 0,
            'net_amount' => 50000,
            'payment_status' => 'paid',
            'paid_at' => now()->subDays(1),
            'ticket_code' => 'TKT-PRE-PAST',
            'qr_hash' => 'hash_pre_past',
            'checkin_status' => 'pending', // Tetap pending karena validasi di Kiosk pihak ketiga
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'XXI-BKG-PAST',
            'cinema_passcode' => '5678',
            'snapshot_event_data' => $snapshotEventData,
            'snapshot_seats' => ['C6'],
        ]);

        // Verifikasi Filter Upcoming: Hanya tiket dengan show_time >= now() yang muncul
        $upcomingResponse = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets?status=upcoming');

        $upcomingResponse->assertStatus(200);
        $upcomingOrderIds = collect($upcomingResponse->json('data'))->pluck('order_id')->all();
        $this->assertContains('SNM-TKT-PRESALE-UPCOMING', $upcomingOrderIds);
        $this->assertNotContains('SNM-TKT-PRESALE-PAST', $upcomingOrderIds);

        $upcomingItem = collect($upcomingResponse->json('data'))->firstWhere('order_id', 'SNM-TKT-PRESALE-UPCOMING');
        $this->assertTrue($upcomingItem['is_upcoming']);
        $this->assertEquals('fulfilled', $upcomingItem['fulfillment_status']);
        $this->assertEquals('presale_cinema', $upcomingItem['event_type']);

        // Verifikasi Filter Past: Tiket presale yang sesi tayangnya telah lewat otomatis masuk ke sini
        $pastResponse = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets?status=past');

        $pastResponse->assertStatus(200);
        $pastOrderIds = collect($pastResponse->json('data'))->pluck('order_id')->all();
        $this->assertContains('SNM-TKT-PRESALE-PAST', $pastOrderIds);
        $this->assertNotContains('SNM-TKT-PRESALE-UPCOMING', $pastOrderIds);

        $pastItem = collect($pastResponse->json('data'))->firstWhere('order_id', 'SNM-TKT-PRESALE-PAST');
        $this->assertFalse($pastItem['is_upcoming']);
        $this->assertEquals('fulfilled', $pastItem['fulfillment_status']);
        $this->assertEquals('presale_cinema', $pastItem['event_type']);
    }

    /**
     * Memverifikasi Solusi 1: Grace Period (Toleransi Waktu 120 Menit) Khusus Presale Bioskop.
     * Skenario UX:
     * 1. Penonton telat 15 menit dari show_time -> tiket tetap aktif di tab 'upcoming' & is_upcoming = true.
     * 2. Penonton telat 90 menit dari show_time -> tiket tetap aktif di tab 'upcoming' & is_upcoming = true.
     * 3. Sesi telah melewati batas toleransi 120 menit (150 menit lalu) -> tiket otomatis beralih ke tab 'past' & is_upcoming = false.
     */
    public function test_presale_cinema_tickets_grace_period_late_attendees_can_still_access_kiosk_ticket(): void
    {
        $event = Event::create([
            'slug' => 'presale-grace-period-test',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Cinta dan Sejarah (Presale Grace Period)',
            'description' => 'Uji toleransi cetak kiosk presale bioskop.',
            'synopsis_short' => 'Sinopsis uji grace period.',
            'poster_path' => 'posters/grace.jpg',
            'backdrop_path' => 'backdrops/grace.jpg',
            'director' => 'Sutradara Test',
            'cast' => ['Aktor Test'],
            'rules' => ['Rule'],
            'venue_name' => 'Cinema XXI Senayan City',
            'venue_address' => 'Senayan City Lt. 5',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        // Skenario 1: Penonton telat 15 menit (show_time 15 menit lalu, masih dalam toleransi 120m)
        $scheduleLate15m = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->subMinutes(15),
            'ticket_price' => 50000,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        // Skenario 2: Penonton telat 90 menit (film sedang tayang, masih dalam toleransi 120m)
        $scheduleLate90m = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->subMinutes(90),
            'ticket_price' => 50000,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio 2',
        ]);

        // Skenario 3: Penayangan telah lewat 150 menit (melewati batas toleransi 120 menit)
        $scheduleExpired150m = Schedule::create([
            'event_id' => $event->id,
            'show_time' => Carbon::now()->subMinutes(150),
            'ticket_price' => 50000,
            'total_seats' => 100,
            'is_active' => true,
            'studio_name' => 'Studio 3',
        ]);

        $snapshot = [
            'event_title' => $event->title,
            'venue_name' => $event->venue_name,
            'city' => $event->city,
        ];

        // Buat tiket 1 (telat 15 menit)
        EventTransaction::create([
            'order_id' => 'SNM-TKT-LATE-15M',
            'user_id' => $this->userA->id,
            'schedule_id' => $scheduleLate15m->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 0,
            'net_amount' => 50000,
            'payment_status' => 'paid',
            'paid_at' => now()->subHour(),
            'ticket_code' => 'TKT-PRE-15M',
            'qr_hash' => 'hash_pre_15m',
            'checkin_status' => 'pending',
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'XXI-15M',
            'cinema_passcode' => '1515',
            'snapshot_event_data' => $snapshot,
            'snapshot_seats' => ['A1'],
        ]);

        // Buat tiket 2 (telat 90 menit)
        EventTransaction::create([
            'order_id' => 'SNM-TKT-LATE-90M',
            'user_id' => $this->userA->id,
            'schedule_id' => $scheduleLate90m->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 0,
            'net_amount' => 50000,
            'payment_status' => 'paid',
            'paid_at' => now()->subHours(2),
            'ticket_code' => 'TKT-PRE-90M',
            'qr_hash' => 'hash_pre_90m',
            'checkin_status' => 'pending',
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'XXI-90M',
            'cinema_passcode' => '9090',
            'snapshot_event_data' => $snapshot,
            'snapshot_seats' => ['A2'],
        ]);

        // Buat tiket 3 (lewat 150 menit)
        EventTransaction::create([
            'order_id' => 'SNM-TKT-EXPIRED-150M',
            'user_id' => $this->userA->id,
            'schedule_id' => $scheduleExpired150m->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 0,
            'net_amount' => 50000,
            'payment_status' => 'paid',
            'paid_at' => now()->subHours(3),
            'ticket_code' => 'TKT-PRE-150M',
            'qr_hash' => 'hash_pre_150m',
            'checkin_status' => 'pending',
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'XXI-150M',
            'cinema_passcode' => '0000',
            'snapshot_event_data' => $snapshot,
            'snapshot_seats' => ['A3'],
        ]);

        // 1. Verifikasi Filter Upcoming: Tiket telat 15m dan 90m WAJIB muncul (is_upcoming = true)
        $upcomingResponse = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets?status=upcoming');

        $upcomingResponse->assertStatus(200);
        $upcomingOrders = collect($upcomingResponse->json('data'))->pluck('order_id')->all();

        $this->assertContains('SNM-TKT-LATE-15M', $upcomingOrders, 'Tiket telat 15 menit wajib tetap dapat diakses di tab upcoming');
        $this->assertContains('SNM-TKT-LATE-90M', $upcomingOrders, 'Tiket telat 90 menit wajib tetap dapat diakses di tab upcoming');
        $this->assertNotContains('SNM-TKT-EXPIRED-150M', $upcomingOrders, 'Tiket lewat 150 menit harus keluar dari tab upcoming');

        $item15m = collect($upcomingResponse->json('data'))->firstWhere('order_id', 'SNM-TKT-LATE-15M');
        $this->assertTrue($item15m['is_upcoming']);
        $this->assertEquals('XXI-15M', $item15m['cinema_ticket']['booking_code']);

        $item90m = collect($upcomingResponse->json('data'))->firstWhere('order_id', 'SNM-TKT-LATE-90M');
        $this->assertTrue($item90m['is_upcoming']);
        $this->assertEquals('XXI-90M', $item90m['cinema_ticket']['booking_code']);

        // 2. Verifikasi Filter Past: Hanya tiket yang lewat toleransi 120m yang masuk tab past
        $pastResponse = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets?status=past');

        $pastResponse->assertStatus(200);
        $pastOrders = collect($pastResponse->json('data'))->pluck('order_id')->all();

        $this->assertContains('SNM-TKT-EXPIRED-150M', $pastOrders);
        $this->assertNotContains('SNM-TKT-LATE-15M', $pastOrders);
        $this->assertNotContains('SNM-TKT-LATE-90M', $pastOrders);

        $itemExpired = collect($pastResponse->json('data'))->firstWhere('order_id', 'SNM-TKT-EXPIRED-150M');
        $this->assertFalse($itemExpired['is_upcoming']);

        // 3. Verifikasi Detail Tiket via endpoint detail juga konsisten mengembalikan is_upcoming
        $detail15m = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets/TKT-PRE-15M');
        $detail15m->assertStatus(200)
            ->assertJsonPath('data.is_upcoming', true);

        $detailExpired = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets/TKT-PRE-150M');
        $detailExpired->assertStatus(200)
            ->assertJsonPath('data.is_upcoming', false);
    }

    /**
     * Test streaming QR image berhasil dengan parameter hash yang valid (Anti-ISP Blockage).
     */
    public function test_stream_qr_image_returns_png_with_valid_hash(): void
    {
        Storage::fake('public');
        $fakePng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $filePath = 'cinema-tickets/permanent/2026/10/test_qr.png';
        Storage::disk('public')->put($filePath, $fakePng);

        $event = Event::create([
            'slug' => 'test-stream-movie',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Film Stream Test',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'posters/test.jpg',
            'backdrop_path' => 'backdrops/test.jpg',
            'director' => 'Sutradara',
            'cast' => ['Cast A'],
            'rules' => ['Rule A'],
            'venue_name' => 'Cinema XXI',
            'venue_address' => 'Mall',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(2),
            'ticket_price' => 50000.00,
            'total_seats' => 50,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        $tx = EventTransaction::create([
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'order_id' => 'SNM-TKT-STREAM-001',
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'paid',
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-999',
            'cinema_passcode' => '1234',
            'cinema_qr_image_path' => $filePath,
            'qr_hash' => 'hash_secret_1234567890abcdef',
            'snapshot_event_data' => ['event_title' => 'Film Stream Test'],
            'snapshot_seats' => ['A1'],
        ]);

        $response = $this->get("/api/v1/tickets/{$tx->order_id}/qr-image?h={$tx->qr_hash}");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'image/png');
        $this->assertEquals($fakePng, $response->getContent());
    }

    /**
     * Test streaming QR image ditolak 403 jika hash salah dan tidak terautentikasi (Anti-IDOR).
     */
    public function test_stream_qr_image_rejects_invalid_hash_with_403(): void
    {
        $event = Event::create([
            'slug' => 'test-stream-movie-2',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'title' => 'Film Stream Test 2',
            'description' => 'Deskripsi',
            'synopsis_short' => 'Sinopsis',
            'poster_path' => 'posters/test.jpg',
            'backdrop_path' => 'backdrops/test.jpg',
            'director' => 'Sutradara',
            'cast' => ['Cast A'],
            'rules' => ['Rule A'],
            'venue_name' => 'Cinema XXI',
            'venue_address' => 'Mall',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(2),
            'ticket_price' => 50000.00,
            'total_seats' => 50,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        $tx = EventTransaction::create([
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'order_id' => 'SNM-TKT-STREAM-002',
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'paid',
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-888',
            'cinema_passcode' => '5678',
            'cinema_qr_image_path' => 'cinema-tickets/dummy.png',
            'qr_hash' => 'correct_hash_value',
            'snapshot_event_data' => ['event_title' => 'Film Stream Test 2'],
            'snapshot_seats' => ['A2'],
        ]);

        $response = $this->get("/api/v1/tickets/{$tx->order_id}/qr-image?h=wrong_hash");

        $response->assertStatus(403);
    }

    public function test_user_can_retrieve_active_pending_transactions_only(): void
    {
        $event = Event::create([
            'title' => 'Film Pending Test',
            'slug' => 'film-pending-test',
            'description' => 'Deskripsi film pending test',
            'synopsis_short' => 'Sinopsis pendek film.',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'age_rating' => '13+',
            'duration_minutes' => 90,
            'synopsis' => 'Sinopsis',
            'director' => 'Sutradara',
            'cast' => ['Cast A'],
            'rules' => ['Rule A'],
            'venue_name' => 'Studio Komunitas',
            'venue_address' => 'Jakarta',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(1),
            'ticket_price' => 45000.00,
            'total_seats' => 50,
            'is_active' => true,
            'studio_name' => 'Studio Mini',
        ]);

        // 1. Transaksi pending aktif (dibuat 3 menit lalu, lock 15 menit)
        $activePending = EventTransaction::create([
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'order_id' => 'SNM-TKT-PENDING-001',
            'ticket_quantity' => 2,
            'gross_amount' => 90000.00,
            'discount_amount' => 0.00,
            'net_amount' => 90000.00,
            'payment_status' => 'pending',
            'snap_token' => 'snap_token_active_pending',
            'snapshot_event_data' => ['event_title' => 'Film Pending Test'],
            'snapshot_seats' => ['A1', 'A2'],
        ]);
        DB::table('event_transactions')
            ->where('order_id', 'SNM-TKT-PENDING-001')
            ->update(['created_at' => now()->subMinutes(3)]);

        // 2. Transaksi pending kedaluwarsa (dibuat 30 menit lalu)
        EventTransaction::create([
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'order_id' => 'SNM-TKT-PENDING-EXPIRED',
            'ticket_quantity' => 1,
            'gross_amount' => 45000.00,
            'discount_amount' => 0.00,
            'net_amount' => 45000.00,
            'payment_status' => 'pending',
            'snap_token' => 'snap_token_expired',
            'snapshot_event_data' => ['event_title' => 'Film Pending Test'],
            'snapshot_seats' => ['B1'],
        ]);
        DB::table('event_transactions')
            ->where('order_id', 'SNM-TKT-PENDING-EXPIRED')
            ->update(['created_at' => now()->subMinutes(30)]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/tickets?status=pending');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_id', 'SNM-TKT-PENDING-001')
            ->assertJsonPath('data.0.payment_status', 'pending')
            ->assertJsonPath('data.0.ticket_code', null)
            ->assertJsonPath('data.0.qr_hash', null)
            ->assertJsonPath('data.0.snap_token', 'snap_token_active_pending')
            ->assertJsonPath('data.0.net_amount', 90000);
    }

    public function test_user_can_cancel_pending_order_and_free_seat_locks(): void
    {
        $event = Event::create([
            'title' => 'Film Cancel Test',
            'slug' => 'film-cancel-test',
            'description' => 'Deskripsi film cancel test',
            'synopsis_short' => 'Sinopsis pendek film.',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'age_rating' => '13+',
            'duration_minutes' => 90,
            'synopsis' => 'Sinopsis',
            'director' => 'Sutradara',
            'cast' => ['Cast A'],
            'rules' => ['Rule A'],
            'venue_name' => 'Studio Komunitas',
            'venue_address' => 'Jakarta',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(1),
            'ticket_price' => 50000.00,
            'total_seats' => 50,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        $orderId = 'SNM-TKT-CANCEL-001';

        $tx = EventTransaction::create([
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'order_id' => $orderId,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'pending',
            'snap_token' => 'snap_token_cancel',
            'snapshot_event_data' => ['event_title' => 'Film Cancel Test'],
            'snapshot_seats' => ['A1'],
        ]);

        $seat = Seat::create([
            'schedule_id' => $schedule->id,
            'row_label' => 'A',
            'grid_column' => 1,
            'seat_number' => 1,
            'seat_code' => 'A1',
            'seat_type' => 'standard',
            'status' => 'available',
        ]);

        SeatLock::create([
            'schedule_id' => $schedule->id,
            'seat_id' => $seat->id,
            'user_id' => $this->userA->id,
            'quantity' => 1,
            'order_id' => $orderId,
            'expires_at' => now()->addMinutes(15),
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->postJson("/api/v1/checkout/orders/{$orderId}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order_id', $orderId)
            ->assertJsonPath('data.status', 'cancelled');

        // Verifikasi database: seat_locks terhapus & transaksi berstatus cancelled
        $this->assertDatabaseMissing('seat_locks', ['order_id' => $orderId]);
        $this->assertDatabaseHas('event_transactions', [
            'order_id' => $orderId,
            'payment_status' => 'cancelled',
        ]);
    }

    public function test_user_cannot_cancel_already_paid_order(): void
    {
        $event = Event::create([
            'title' => 'Film Paid Cancel Test',
            'slug' => 'film-paid-cancel-test',
            'description' => 'Deskripsi film paid cancel test',
            'synopsis_short' => 'Sinopsis pendek film.',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'age_rating' => '13+',
            'duration_minutes' => 90,
            'synopsis' => 'Sinopsis',
            'director' => 'Sutradara',
            'cast' => ['Cast A'],
            'rules' => ['Rule A'],
            'venue_name' => 'Studio',
            'venue_address' => 'Jakarta',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(1),
            'ticket_price' => 50000.00,
            'total_seats' => 50,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        $orderId = 'SNM-TKT-PAID-001';

        EventTransaction::create([
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'order_id' => $orderId,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'paid',
            'snapshot_event_data' => ['event_title' => 'Film Paid Cancel Test'],
            'snapshot_seats' => [],
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->postJson("/api/v1/checkout/orders/{$orderId}/cancel");

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Pesanan yang sudah lunas tidak dapat dibatalkan.');
    }

    public function test_user_cannot_cancel_another_users_pending_order(): void
    {
        $event = Event::create([
            'title' => 'IDOR Event',
            'slug' => 'idor-event',
            'description' => 'Deskripsi IDOR event',
            'synopsis_short' => 'Sinopsis pendek film.',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'age_rating' => '13+',
            'duration_minutes' => 90,
            'synopsis' => 'Sinopsis',
            'director' => 'Sutradara',
            'cast' => ['Cast A'],
            'rules' => ['Rule A'],
            'venue_name' => 'Studio',
            'venue_address' => 'Jakarta',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(1),
            'ticket_price' => 50000.00,
            'total_seats' => 50,
            'is_active' => true,
            'studio_name' => 'Studio 1',
        ]);

        $orderId = 'SNM-TKT-USER-A-ORDER';

        EventTransaction::create([
            'user_id' => $this->userA->id,
            'schedule_id' => $schedule->id,
            'order_id' => $orderId,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'pending',
            'snapshot_event_data' => ['event_title' => 'IDOR Test'],
            'snapshot_seats' => [],
        ]);

        // User B mencoba membatalkan pesanan milik User A (Anti-IDOR)
        $response = $this->actingAs($this->userB, 'sanctum')
            ->postJson("/api/v1/checkout/orders/{$orderId}/cancel");

        $response->assertStatus(404);
    }
}
