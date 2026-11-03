<?php

namespace Tests\Feature\Admin\Orders;

use App\Jobs\SendTransactionEmailJob;
use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\Schedule;
use App\Models\User;
use App\Models\UserMovieAccess;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AdminOrderAuditTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $customer;

    protected Event $event;

    protected Schedule $schedule;

    protected Movie $movie;

    protected Voucher $voucher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Sinemus',
            'email' => 'admin@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081100000001',
            'is_phone_locked' => true,
        ]);

        $this->customer = User::factory()->create([
            'name' => 'Dimas Setiawan',
            'email' => 'dimas@example.com',
            'role' => 'customer',
            'phone_number' => '081288492011',
            'is_phone_locked' => true,
            'birth_date' => '2000-01-15',
        ]);

        $this->event = Event::create([
            'slug' => 'cinta-dan-sejarah',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Cinta dan Sejarah',
            'description' => 'Special screening cinta dan sejarah.',
            'synopsis_short' => 'Sinopsis pendek film.',
            'poster_path' => 'events/posters/cds.jpg',
            'backdrop_path' => 'events/backdrops/cds.jpg',
            'director' => 'Arya Sinema',
            'cast' => ['Aktor 1', 'Aktris 2'],
            'rules' => ['Dilarang merekam'],
            'venue_name' => 'Cinema XXI Plaza Senayan',
            'venue_address' => 'Plaza Senayan Lantai 5, Jakarta',
            'city' => 'Jakarta Pusat',
            'cinema_partner' => 'Cinema XXI',
            'is_active' => true,
        ]);

        $this->schedule = Schedule::create([
            'event_id' => $this->event->id,
            'studio_name' => 'Studio 2',
            'show_time' => now()->addDays(7)->setTime(19, 30),
            'ticket_price' => 65000.00,
            'total_seats' => 120,
            'is_active' => true,
        ]);

        $this->movie = Movie::create([
            'slug' => 'laut-bercerita',
            'title' => 'Laut Bercerita',
            'synopsis' => 'Sinopsis film Laut Bercerita.',
            'poster_path' => 'movies/posters/laut.jpg',
            'backdrop_path' => 'movies/backdrops/laut.jpg',
            'director' => 'Pritagita Arianegara',
            'cast' => ['Reza Rahadian', 'Ayushita'],
            'genre' => 'Drama',
            'age_rating' => '17+',
            'access_model' => 'rental',
            'duration_minutes' => 105,
            'price' => 25000.00,
            'rental_duration_hours' => 48,
            'cloudflare_video_uid' => 'stream-laut-1234',
            'release_year' => 2026,
            'is_published' => true,
        ]);

        $this->voucher = Voucher::create([
            'code' => 'CDSINDIE',
            'discount_type' => 'fixed',
            'discount_value' => 5000.00,
            'min_purchase' => 20000.00,
            'item_type' => 'all',
            'quota_total' => 100,
            'quota_used' => 2,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
            'is_active' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_orders_endpoints(): void
    {
        $this->getJson('/api/v1/admin/orders')->assertStatus(401);
        $this->getJson('/api/v1/admin/orders/export')->assertStatus(401);
        $this->getJson('/api/v1/admin/orders/SNM-TKT-1')->assertStatus(401);
        $this->postJson('/api/v1/admin/orders/SNM-TKT-1/resend')->assertStatus(401);
    }

    public function test_customer_role_cannot_access_orders_endpoints_and_receives_403(): void
    {
        $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/v1/admin/orders')
            ->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'FORBIDDEN_ROLE_ACCESS',
            ]);

        $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/v1/admin/orders/export')
            ->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'FORBIDDEN_ROLE_ACCESS',
            ]);

        $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/v1/admin/orders/SNM-TKT-1')
            ->assertStatus(403);

        $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/admin/orders/SNM-TKT-1/resend')
            ->assertStatus(403);
    }

    public function test_super_admin_can_list_orders_with_empty_state_and_envelope_structure(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Daftar riwayat pesanan berhasil diambil.',
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'from' => null,
                    'last_page' => 1,
                    'per_page' => 20,
                    'to' => null,
                    'total' => 0,
                ],
            ]);

        $this->assertNotNull($response->json('server_time'));
    }

    public function test_super_admin_can_list_combined_orders_matching_contract_schema(): void
    {
        // 1. Buat pesanan tiket paid
        $ticketTx = EventTransaction::create([
            'order_id' => 'SNM-TKT-849201',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'voucher_id' => $this->voucher->id,
            'ticket_quantity' => 2,
            'gross_amount' => 130000.00,
            'discount_amount' => 5000.00,
            'net_amount' => 125000.00,
            'snap_token' => 'snap-tk-849201',
            'payment_status' => 'paid',
            'payment_type' => 'qris',
            'paid_at' => now()->subMinutes(10),
            'ticket_code' => 'TKT-2026-0001',
            'qr_hash' => 'hash-ticket-849201',
            'checkin_status' => 'pending',
            'fulfillment_status' => 'fulfilled',
            'snapshot_event_data' => [
                'title' => $this->event->title,
                'venue_name' => $this->event->venue_name,
                'ticket_price' => 65000,
            ],
            'snapshot_seats' => ['B8', 'B9'],
        ]);
        $ticketTx->forceFill(['created_at' => now()->subMinutes(15)])->saveQuietly();

        // 2. Buat pesanan sewa film VoD paid
        $movieTx = MovieTransaction::create([
            'order_id' => 'SNM-VOD-774019',
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'voucher_id' => null,
            'gross_amount' => 25000.00,
            'discount_amount' => 0.00,
            'net_amount' => 25000.00,
            'snap_token' => 'snap-vod-774019',
            'payment_status' => 'paid',
            'payment_type' => 'bank_transfer',
            'paid_at' => now()->subMinutes(5),
            'snapshot_movie_data' => [
                'title' => $this->movie->title,
                'price' => 25000,
                'duration_minutes' => 105,
            ],
        ]);
        $movieTx->forceFill(['created_at' => now()->subMinutes(8)])->saveQuietly();

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(2, $data);

        // Verifikasi kepatuhan skema kontrak AdminOrderItem
        $firstItem = $data[0];
        $this->assertEquals('SNM-VOD-774019', $firstItem['order_id']);
        $this->assertEquals('movie_rental', $firstItem['order_type']);
        $this->assertEquals('dimas@example.com', $firstItem['user_email']);
        $this->assertEquals('Dimas Setiawan', $firstItem['user_name']);
        $this->assertEquals('Laut Bercerita', $firstItem['item_title']);
        $this->assertEquals(25000.0, (float) $firstItem['gross_amount']);
        $this->assertEquals(0.0, (float) $firstItem['discount_amount']);
        $this->assertEquals(25000.0, (float) $firstItem['net_amount']);
        $this->assertEquals('paid', $firstItem['payment_status']);
        $this->assertNotNull($firstItem['paid_at']);
        $this->assertNotNull($firstItem['created_at']);

        $secondItem = $data[1];
        $this->assertEquals('SNM-TKT-849201', $secondItem['order_id']);
        $this->assertEquals('ticket', $secondItem['order_type']);
        $this->assertEquals('Cinta dan Sejarah', $secondItem['item_title']);
        $this->assertEquals(125000.0, (float) $secondItem['net_amount']);

        // Verifikasi PaginationMeta
        $meta = $response->json('meta');
        $this->assertEquals(1, $meta['current_page']);
        $this->assertEquals(2, $meta['total']);
        $this->assertEquals(20, $meta['per_page']);
    }

    public function test_super_admin_can_filter_orders_by_type(): void
    {
        EventTransaction::create([
            'order_id' => 'SNM-TKT-101',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 65000.00,
            'discount_amount' => 0.00,
            'net_amount' => 65000.00,
            'payment_status' => 'paid',
            'snapshot_event_data' => ['title' => 'Tiket CDS'],
            'created_at' => now()->subMinutes(10),
        ]);

        MovieTransaction::create([
            'order_id' => 'SNM-VOD-202',
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'gross_amount' => 25000.00,
            'discount_amount' => 0.00,
            'net_amount' => 25000.00,
            'payment_status' => 'paid',
            'snapshot_movie_data' => ['title' => 'Sewa Laut'],
            'created_at' => now()->subMinutes(5),
        ]);

        // Filter tiket saja
        $ticketResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders?type=ticket');

        $ticketResponse->assertStatus(200);
        $this->assertCount(1, $ticketResponse->json('data'));
        $this->assertEquals('SNM-TKT-101', $ticketResponse->json('data.0.order_id'));
        $this->assertEquals('ticket', $ticketResponse->json('data.0.order_type'));

        // Filter movie_rental saja
        $movieResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders?type=movie_rental');

        $movieResponse->assertStatus(200);
        $this->assertCount(1, $movieResponse->json('data'));
        $this->assertEquals('SNM-VOD-202', $movieResponse->json('data.0.order_id'));
        $this->assertEquals('movie_rental', $movieResponse->json('data.0.order_type'));

        // Filter all
        $allResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders?type=all');

        $allResponse->assertStatus(200);
        $this->assertCount(2, $allResponse->json('data'));
    }

    public function test_super_admin_can_filter_orders_by_status(): void
    {
        EventTransaction::create([
            'order_id' => 'SNM-TKT-PAID',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 65000.00,
            'discount_amount' => 0.00,
            'net_amount' => 65000.00,
            'payment_status' => 'paid',
            'snapshot_event_data' => ['title' => 'Tiket CDS'],
            'created_at' => now()->subMinutes(10),
        ]);

        EventTransaction::create([
            'order_id' => 'SNM-TKT-PENDING',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 65000.00,
            'discount_amount' => 0.00,
            'net_amount' => 65000.00,
            'payment_status' => 'pending',
            'snapshot_event_data' => ['title' => 'Tiket CDS'],
            'created_at' => now()->subMinutes(5),
        ]);

        $responsePaid = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders?status=paid');

        $responsePaid->assertStatus(200);
        $this->assertCount(1, $responsePaid->json('data'));
        $this->assertEquals('SNM-TKT-PAID', $responsePaid->json('data.0.order_id'));

        $responsePending = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders?status=pending');

        $responsePending->assertStatus(200);
        $this->assertCount(1, $responsePending->json('data'));
        $this->assertEquals('SNM-TKT-PENDING', $responsePending->json('data.0.order_id'));
    }

    public function test_super_admin_can_filter_orders_by_date_range(): void
    {
        Carbon::setTestNow('2026-09-28 12:00:00');

        $tx1 = EventTransaction::create([
            'order_id' => 'SNM-TKT-SEP20',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 65000.00,
            'discount_amount' => 0.00,
            'net_amount' => 65000.00,
            'payment_status' => 'paid',
            'snapshot_event_data' => ['title' => 'Tiket CDS'],
        ]);
        $tx1->forceFill(['created_at' => Carbon::parse('2026-09-20 10:00:00')])->saveQuietly();

        $tx2 = EventTransaction::create([
            'order_id' => 'SNM-TKT-SEP28',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 65000.00,
            'discount_amount' => 0.00,
            'net_amount' => 65000.00,
            'payment_status' => 'paid',
            'snapshot_event_data' => ['title' => 'Tiket CDS'],
        ]);
        $tx2->forceFill(['created_at' => Carbon::parse('2026-09-28 09:00:00')])->saveQuietly();

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders?start_date=2026-09-27&end_date=2026-09-29');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('SNM-TKT-SEP28', $response->json('data.0.order_id'));

        Carbon::setTestNow();
    }

    public function test_super_admin_can_search_orders_by_order_id_user_name_email_and_phone(): void
    {
        $secondUser = User::factory()->create([
            'name' => 'Siti Nurhaliza',
            'email' => 'siti.nurhaliza@example.com',
            'phone_number' => '081399204412',
            'role' => 'customer',
        ]);

        EventTransaction::create([
            'order_id' => 'SNM-TKT-UNIQUE88',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 65000.00,
            'discount_amount' => 0.00,
            'net_amount' => 65000.00,
            'payment_status' => 'paid',
            'snapshot_event_data' => ['title' => 'Tiket CDS'],
        ]);

        MovieTransaction::create([
            'order_id' => 'SNM-VOD-UNIQUE99',
            'user_id' => $secondUser->id,
            'movie_id' => $this->movie->id,
            'gross_amount' => 25000.00,
            'discount_amount' => 0.00,
            'net_amount' => 25000.00,
            'payment_status' => 'paid',
            'snapshot_movie_data' => ['title' => 'Sewa Laut'],
        ]);

        // Cari berdasarkan substring order_id
        $resOrder = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders?search=UNIQUE88');
        $resOrder->assertStatus(200);
        $this->assertCount(1, $resOrder->json('data'));
        $this->assertEquals('SNM-TKT-UNIQUE88', $resOrder->json('data.0.order_id'));

        // Cari berdasarkan nama pembeli
        $resName = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders?search=Nurhaliza');
        $resName->assertStatus(200);
        $this->assertCount(1, $resName->json('data'));
        $this->assertEquals('SNM-VOD-UNIQUE99', $resName->json('data.0.order_id'));

        // Cari berdasarkan email
        $resEmail = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders?search=dimas@example.com');
        $resEmail->assertStatus(200);
        $this->assertCount(1, $resEmail->json('data'));
        $this->assertEquals('SNM-TKT-UNIQUE88', $resEmail->json('data.0.order_id'));

        // Cari berdasarkan nomor telepon
        $resPhone = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders?search=081399204412');
        $resPhone->assertStatus(200);
        $this->assertCount(1, $resPhone->json('data'));
        $this->assertEquals('SNM-VOD-UNIQUE99', $resPhone->json('data.0.order_id'));
    }

    public function test_super_admin_can_get_ticket_order_detail_snapshot(): void
    {
        EventTransaction::create([
            'order_id' => 'SNM-TKT-849201',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'voucher_id' => $this->voucher->id,
            'ticket_quantity' => 2,
            'gross_amount' => 130000.00,
            'discount_amount' => 5000.00,
            'net_amount' => 125000.00,
            'snap_token' => 'snap-tk-849201',
            'payment_status' => 'paid',
            'payment_type' => 'qris',
            'paid_at' => now()->subMinutes(10),
            'ticket_code' => 'TKT-2026-0001',
            'qr_hash' => 'hash-ticket-849201',
            'checkin_status' => 'checked_in',
            'checkin_at' => now()->subMinutes(2),
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-849201',
            'cinema_passcode' => '382910',
            'cinema_qr_image_path' => 'cinema-tickets/permanent/mtx-849201.png',
            'cinema_ticket_notes' => 'Cetak di Kiosk Studio 2',
            'fulfilled_at' => now()->subMinutes(12),
            'fulfilled_by_admin_id' => $this->superAdmin->id,
            'snapshot_event_data' => [
                'event_title' => $this->event->title,
                'venue_name' => $this->event->venue_name,
                'cinema_partner' => $this->event->cinema_partner,
                'studio_name' => $this->schedule->studio_name,
                'show_time' => $this->schedule->show_time->toIso8601String(),
                'ticket_price' => 65000,
            ],
            'snapshot_seats' => ['B8', 'B9'],
            'created_at' => now()->subMinutes(20),
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders/SNM-TKT-849201');

        $response->assertStatus(200);

        $data = $response->json('data');

        $this->assertEquals('SNM-TKT-849201', $data['order_id']);
        $this->assertEquals('ticket', $data['order_type']);
        $this->assertEquals('paid', $data['payment_status']);
        $this->assertEquals('qris', $data['payment_type']);

        // Data Pembeli Snapshot
        $this->assertEquals($this->customer->id, $data['buyer']['user_id']);
        $this->assertEquals('Dimas Setiawan', $data['buyer']['name']);
        $this->assertEquals('dimas@example.com', $data['buyer']['email']);
        $this->assertEquals('081288492011', $data['buyer']['phone_number']);
        $this->assertTrue($data['buyer']['is_phone_locked']);
        $this->assertEquals('2000-01-15', $data['buyer']['birth_date']);

        // Rincian Tiket & Kursi
        $this->assertEquals('Cinta dan Sejarah', $data['item_details']['event_title']);
        $this->assertEquals('Cinema XXI Plaza Senayan', $data['item_details']['venue_name']);
        $this->assertEquals('Studio 2', $data['item_details']['studio_name']);
        $this->assertEquals(['B8', 'B9'], $data['item_details']['seats']);
        $this->assertEquals('TKT-2026-0001', $data['item_details']['ticket_code']);
        $this->assertEquals('checked_in', $data['item_details']['checkin_status']);
        $this->assertEquals('MTX-849201', $data['item_details']['cinema_booking_code']);
        $this->assertEquals('382910', $data['item_details']['cinema_passcode']);

        // Finansial
        $this->assertEquals(130000.0, (float) $data['financials']['gross_amount']);
        $this->assertEquals(5000.0, (float) $data['financials']['discount_amount']);
        $this->assertEquals(125000.0, (float) $data['financials']['net_amount']);
        $this->assertEquals('Rp 125.000', $data['financials']['formatted_net_amount']);
        $this->assertEquals('CDSINDIE', $data['financials']['voucher']['code']);
    }

    public function test_super_admin_can_get_movie_rental_order_detail_snapshot(): void
    {
        $movieTx = MovieTransaction::create([
            'order_id' => 'SNM-VOD-774019',
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'voucher_id' => null,
            'gross_amount' => 25000.00,
            'discount_amount' => 0.00,
            'net_amount' => 25000.00,
            'snap_token' => 'snap-vod-774019',
            'payment_status' => 'paid',
            'payment_type' => 'bank_transfer',
            'paid_at' => now()->subMinutes(5),
            'snapshot_movie_data' => [
                'title' => $this->movie->title,
                'price' => 25000,
                'duration_minutes' => 105,
            ],
            'created_at' => now()->subMinutes(8),
        ]);

        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'transaction_id' => $movieTx->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subMinutes(5),
            'rental_expires_at' => now()->addHours(48),
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders/SNM-VOD-774019');

        $response->assertStatus(200);

        $data = $response->json('data');

        $this->assertEquals('SNM-VOD-774019', $data['order_id']);
        $this->assertEquals('movie_rental', $data['order_type']);
        $this->assertEquals('paid', $data['payment_status']);
        $this->assertEquals('Laut Bercerita', $data['item_details']['movie_title']);
        $this->assertEquals(105, $data['item_details']['duration_minutes']);
        $this->assertEquals('active', $data['item_details']['access_status']);
        $this->assertNotNull($data['item_details']['rental_start_at']);
        $this->assertNotNull($data['item_details']['rental_expires_at']);
        $this->assertEquals(25000.0, (float) $data['financials']['net_amount']);
    }

    public function test_order_detail_returns_404_when_not_found(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/orders/SNM-TKT-DOES-NOT-EXIST');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_super_admin_can_resend_ticket_notification_email_successfully(): void
    {
        Queue::fake();

        $transaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-RESEND-OK',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 65000.00,
            'discount_amount' => 0.00,
            'net_amount' => 65000.00,
            'payment_status' => 'paid',
            'snapshot_event_data' => ['title' => 'Cinta dan Sejarah'],
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/orders/SNM-TKT-RESEND-OK/resend', [
                'channel' => 'email',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Notifikasi tiket berhasil dikirim ulang ke email pembeli.',
                'data' => [
                    'order_id' => 'SNM-TKT-RESEND-OK',
                    'recipient_email' => 'dimas@example.com',
                    'channel' => 'email',
                ],
            ]);

        Queue::assertPushed(SendTransactionEmailJob::class, function ($job) use ($transaction) {
            return $job->transactionId === $transaction->id;
        });
    }

    public function test_resend_ticket_notification_fails_for_unpaid_order(): void
    {
        Queue::fake();

        EventTransaction::create([
            'order_id' => 'SNM-TKT-UNPAID',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 65000.00,
            'discount_amount' => 0.00,
            'net_amount' => 65000.00,
            'payment_status' => 'pending',
            'snapshot_event_data' => ['title' => 'Cinta dan Sejarah'],
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/orders/SNM-TKT-UNPAID/resend', [
                'channel' => 'email',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'NOTIFICATION_RESEND_FAILED',
            ]);

        Queue::assertNothingPushed();
    }

    public function test_resend_ticket_notification_fails_for_movie_rental_order(): void
    {
        Queue::fake();

        MovieTransaction::create([
            'order_id' => 'SNM-VOD-NORESEND',
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'gross_amount' => 25000.00,
            'discount_amount' => 0.00,
            'net_amount' => 25000.00,
            'payment_status' => 'paid',
            'snapshot_movie_data' => ['title' => 'Laut Bercerita'],
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/orders/SNM-VOD-NORESEND/resend', [
                'channel' => 'email',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'NOTIFICATION_RESEND_FAILED',
            ]);

        Queue::assertNothingPushed();
    }

    public function test_resend_ticket_notification_fails_for_unsupported_whatsapp_channel(): void
    {
        Queue::fake();

        EventTransaction::create([
            'order_id' => 'SNM-TKT-WA-TEST',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 65000.00,
            'discount_amount' => 0.00,
            'net_amount' => 65000.00,
            'payment_status' => 'paid',
            'snapshot_event_data' => ['title' => 'Cinta dan Sejarah'],
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/orders/SNM-TKT-WA-TEST/resend', [
                'channel' => 'whatsapp',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'NOTIFICATION_RESEND_FAILED',
            ]);

        Queue::assertNothingPushed();
    }

    public function test_super_admin_can_export_orders_csv(): void
    {
        $ticketTx = EventTransaction::create([
            'order_id' => 'SNM-TKT-CSV1',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 130000.00,
            'discount_amount' => 0.00,
            'net_amount' => 130000.00,
            'payment_status' => 'paid',
            'payment_type' => 'qris',
            'paid_at' => '2026-09-28 14:15:00',
            'snapshot_event_data' => ['title' => 'Cinta dan Sejarah'],
        ]);
        $ticketTx->forceFill(['created_at' => Carbon::parse('2026-09-28 14:10:00')])->saveQuietly();

        $movieTx = MovieTransaction::create([
            'order_id' => 'SNM-VOD-CSV2',
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'gross_amount' => 25000.00,
            'discount_amount' => 0.00,
            'net_amount' => 25000.00,
            'payment_status' => 'paid',
            'payment_type' => 'gopay',
            'paid_at' => '2026-09-28 15:00:00',
            'snapshot_movie_data' => ['title' => 'Laut Bercerita'],
        ]);
        $movieTx->forceFill(['created_at' => Carbon::parse('2026-09-28 14:55:00')])->saveQuietly();

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->get('/api/v1/admin/orders/export');

        $response->assertStatus(200);
        $this->assertEquals('text/csv; charset=UTF-8', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename="sinemus_orders_export_', (string) $response->headers->get('Content-Disposition'));

        $content = $response->streamedContent();

        // Verifikasi Header Kolom CSV (fputcsv menambahkan tanda kutip)
        $this->assertStringContainsString('"Order ID","Tipe Pesanan","Nama Pembeli","Email Pembeli","No. WhatsApp","Item / Produk"', $content);

        // Verifikasi Baris Tiket
        $this->assertStringContainsString('SNM-TKT-CSV1', $content);
        $this->assertStringContainsString('Tiket Bioskop', $content);
        $this->assertStringContainsString('Dimas Setiawan', $content);
        $this->assertStringContainsString('dimas@example.com', $content);
        $this->assertStringContainsString('130000.00', $content);

        // Verifikasi Baris Sewa VoD
        $this->assertStringContainsString('SNM-VOD-CSV2', $content);
        $this->assertStringContainsString('Sewa Film VoD', $content);
        $this->assertStringContainsString('25000.00', $content);
    }

    public function test_admin_orders_routes_have_throttle_middleware(): void
    {
        $routes = collect(Route::getRoutes()->getRoutes());

        $indexRoute = $routes->first(fn ($r) => $r->getName() === 'admin.orders.index');
        $this->assertNotNull($indexRoute);
        $this->assertTrue(collect($indexRoute->gatherMiddleware())->contains(fn ($m) => str_starts_with($m, 'throttle:60')));

        $exportRoute = $routes->first(fn ($r) => $r->getName() === 'admin.orders.export');
        $this->assertNotNull($exportRoute);
        $this->assertTrue(collect($exportRoute->gatherMiddleware())->contains(fn ($m) => str_starts_with($m, 'throttle:10')));

        $showRoute = $routes->first(fn ($r) => $r->getName() === 'admin.orders.show');
        $this->assertNotNull($showRoute);
        $this->assertTrue(collect($showRoute->gatherMiddleware())->contains(fn ($m) => str_starts_with($m, 'throttle:60')));

        $resendRoute = $routes->first(fn ($r) => $r->getName() === 'admin.orders.resend');
        $this->assertNotNull($resendRoute);
        $this->assertTrue(collect($resendRoute->gatherMiddleware())->contains(fn ($m) => str_starts_with($m, 'throttle:10')));
    }
}
