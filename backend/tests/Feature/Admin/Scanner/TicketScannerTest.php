<?php

namespace Tests\Feature\Admin\Scanner;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\TicketCheckin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TicketScannerTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $gatekeeperStaff;

    protected User $customer;

    protected Event $event;

    protected Schedule $schedule;

    protected EventTransaction $paidTransaction;

    protected string $qrHash;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Utama',
            'email' => 'admin@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081100000001',
            'is_phone_locked' => true,
        ]);

        $this->gatekeeperStaff = User::factory()->create([
            'name' => 'Petugas Budi',
            'email' => 'budi.gate@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081100000002',
            'is_phone_locked' => true,
        ]);

        $this->customer = User::factory()->create([
            'name' => 'Dimas Setiawan',
            'email' => 'dimas.setiawan@example.com',
            'role' => 'customer',
            'phone_number' => '081288492011',
            'is_phone_locked' => true,
        ]);

        $this->event = Event::create([
            'title' => 'Sebelum Pagi Datang',
            'slug' => 'sebelum-pagi-datang',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'description' => 'Deskripsi event pemutaran sebelum pagi datang.',
            'synopsis_short' => 'Sinopsis film sebelum pagi datang.',
            'poster_path' => 'events/posters/sebelum-pagi.jpg',
            'backdrop_path' => 'events/backdrops/sebelum-pagi.jpg',
            'director' => 'Sutradara Sinemus',
            'cast' => ['Aktor 1', 'Aktor 2'],
            'rules' => ['Dilarang merekam', 'Harap hadir tepat waktu'],
            'venue_name' => 'Sinemus Space Jakarta',
            'city' => 'Jakarta Selatan',
            'venue_address' => 'Jl. Merdeka No. 10',
            'is_active' => true,
        ]);

        $this->schedule = Schedule::create([
            'event_id' => $this->event->id,
            'studio_name' => 'Studio A',
            'show_time' => now()->addHours(2),
            'ticket_price' => 50000.00,
            'total_seats' => 60,
            'is_active' => true,
        ]);

        $this->qrHash = hash('sha256', Str::random(32));

        $this->paidTransaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-2026-9812',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 100000.00,
            'discount_amount' => 0.00,
            'net_amount' => 100000.00,
            'payment_status' => 'paid',
            'paid_at' => now()->subHour(),
            'ticket_code' => 'TKT-2026-9812',
            'qr_hash' => $this->qrHash,
            'checkin_status' => 'pending',
            'checkin_at' => null,
            'fulfillment_status' => 'fulfilled',
            'snapshot_event_data' => [
                'title' => 'Sebelum Pagi Datang',
                'buyer_name' => 'Dimas Setiawan',
                'seating_type' => 'assigned_seating',
            ],
            'snapshot_seats' => ['B8', 'B9'],
        ]);
    }

    /**
     * Uji otorisasi: unauthenticated user ditolak 401.
     */
    public function test_unauthenticated_user_cannot_access_scanner_validate(): void
    {
        $response = $this->postJson('/api/v1/admin/tickets/validate', [
            'qr_hash' => $this->qrHash,
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * Uji otorisasi: customer biasa ditolak 403 Forbidden.
     */
    public function test_customer_role_cannot_access_scanner_and_receives_403(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', [
                'qr_hash' => $this->qrHash,
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'FORBIDDEN_ROLE_ACCESS',
            ]);
    }

    /**
     * Uji validasi input FormRequest (qr_hash wajib).
     */
    public function test_validate_ticket_requires_qr_hash(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', []);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonValidationErrors(['qr_hash']);
    }

    /**
     * Uji scan pertama sukses 200 OK dengan detail penonton, kursi, dan audit check-in.
     */
    public function test_first_valid_scan_succeeds_with_200_ok(): void
    {
        $response = $this->actingAs($this->gatekeeperStaff, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', [
                'qr_hash' => $this->qrHash,
                'device_info' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'ticket_code',
                    'event_title',
                    'buyer_name',
                    'seating_type',
                    'ticket_quantity',
                    'seat_codes',
                    'checkin_status',
                    'scanned_at',
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Tiket valid! Penonton berhasil check-in ke venue.',
                'data' => [
                    'ticket_code' => 'TKT-2026-9812',
                    'event_title' => 'Sebelum Pagi Datang',
                    'buyer_name' => 'Dimas Setiawan',
                    'seating_type' => 'assigned_seating',
                    'ticket_quantity' => 2,
                    'seat_codes' => ['B8', 'B9'],
                    'checkin_status' => 'checked_in',
                ],
            ]);

        // Verifikasi mutasi database event_transactions
        $this->assertDatabaseHas('event_transactions', [
            'id' => $this->paidTransaction->id,
            'checkin_status' => 'checked_in',
        ]);

        // Verifikasi audit log di ticket_checkins
        $this->assertDatabaseHas('ticket_checkins', [
            'transaction_id' => $this->paidTransaction->id,
            'scanned_by_user_id' => $this->gatekeeperStaff->id,
            'device_info' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        ]);
    }

    /**
     * Uji anti double check-in: scan kedua ditolak 409 Conflict dengan informasi staf dan waktu pemindaian sebelumnya.
     */
    public function test_second_scan_rejected_with_409_conflict_and_audit_details(): void
    {
        // 1. Scan pertama berhasil oleh Petugas Budi
        $this->actingAs($this->gatekeeperStaff, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', [
                'qr_hash' => $this->qrHash,
                'device_info' => 'Device-Gate-A',
            ])
            ->assertStatus(200);

        // 2. Scan kedua oleh Super Admin Utama pada tiket yang sama (misal screenshot diserahkan penonton lain)
        $secondResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', [
                'qr_hash' => $this->qrHash,
                'device_info' => 'Device-Gate-B',
            ]);

        $secondResponse->assertStatus(409)
            ->assertJsonStructure([
                'success',
                'message',
                'error_code',
                'errors' => [
                    'scanned_at',
                    'scanned_by',
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => false,
                'error_code' => 'TICKET_ALREADY_CHECKED_IN',
                'errors' => [
                    'scanned_by' => 'Petugas Budi',
                ],
            ]);

        $this->assertStringContainsString('SUDAH DIGUNAKAN', $secondResponse->json('message'));
        $this->assertStringContainsString('Petugas Budi', $secondResponse->json('message'));

        // Pastikan tidak ada duplikasi data check-in baru (tetap hanya 1 record)
        $this->assertEquals(1, TicketCheckin::where('transaction_id', $this->paidTransaction->id)->count());
    }

    /**
     * Uji penolakan QR hash yang tidak terdaftar di sistem (404 Not Found).
     */
    public function test_invalid_qr_hash_returns_404_not_found(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', [
                'qr_hash' => 'invalid-non-existent-hash-999999',
            ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * Uji penolakan tiket yang belum dibayar / unpaid (422 Unprocessable Entity).
     */
    public function test_unpaid_ticket_is_rejected_with_422(): void
    {
        $unpaidQrHash = hash('sha256', Str::random(32));

        EventTransaction::create([
            'order_id' => 'SNM-TKT-2026-UNPAID',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'pending',
            'qr_hash' => $unpaidQrHash,
            'checkin_status' => 'pending',
            'snapshot_event_data' => [
                'title' => 'Sebelum Pagi Datang',
            ],
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', [
                'qr_hash' => $unpaidQrHash,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertStringContainsString('belum dibayar', $response->json('message'));
    }

    /**
     * Uji penolakan tiket yang sesinya sudah kadaluarsa (show_time lewat lebih dari 12 jam).
     */
    public function test_expired_session_ticket_is_rejected_with_422(): void
    {
        $expiredSchedule = Schedule::create([
            'event_id' => $this->event->id,
            'studio_name' => 'Studio B',
            'show_time' => now()->subHours(15), // Lewat 15 jam
            'ticket_price' => 50000.00,
            'total_seats' => 60,
            'is_active' => true,
        ]);

        $expiredQrHash = hash('sha256', Str::random(32));

        EventTransaction::create([
            'order_id' => 'SNM-TKT-2026-EXPIRED',
            'user_id' => $this->customer->id,
            'schedule_id' => $expiredSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'paid',
            'qr_hash' => $expiredQrHash,
            'checkin_status' => 'pending',
            'snapshot_event_data' => [
                'title' => 'Sebelum Pagi Datang',
            ],
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', [
                'qr_hash' => $expiredQrHash,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertStringContainsString('telah berakhir', $response->json('message'));
    }

    /**
     * Uji general admission: format seat_codes null jika tidak ada penomoran kursi.
     */
    public function test_general_admission_ticket_handles_null_seat_codes(): void
    {
        $gaEvent = Event::create([
            'title' => 'Sinemus Community Festival',
            'slug' => 'sinemus-community-festival',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'description' => 'Deskripsi community festival',
            'synopsis_short' => 'Sinopsis singkat festival',
            'poster_path' => 'events/posters/festival.jpg',
            'backdrop_path' => 'events/backdrops/festival.jpg',
            'director' => 'Festival Director',
            'cast' => ['Performer 1'],
            'rules' => ['Bebas memilih tempat duduk'],
            'venue_name' => 'Sinemus Outdoor Space',
            'venue_address' => 'Jl. Outdoor No. 5',
            'city' => 'Jakarta Selatan',
            'is_active' => true,
        ]);

        $gaSchedule = Schedule::create([
            'event_id' => $gaEvent->id,
            'studio_name' => 'Open Lawn',
            'show_time' => now()->addHours(3),
            'ticket_price' => 25000.00,
            'total_seats' => 100,
            'is_active' => true,
        ]);

        $gaQrHash = hash('sha256', Str::random(32));

        EventTransaction::create([
            'order_id' => 'SNM-TKT-2026-GA-01',
            'user_id' => $this->customer->id,
            'schedule_id' => $gaSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 25000.00,
            'discount_amount' => 0.00,
            'net_amount' => 25000.00,
            'payment_status' => 'paid',
            'qr_hash' => $gaQrHash,
            'checkin_status' => 'pending',
            'snapshot_event_data' => [
                'title' => 'Sinemus Community Festival',
                'seating_type' => 'general_admission',
            ],
            'snapshot_seats' => null,
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', [
                'qr_hash' => $gaQrHash,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'seating_type' => 'general_admission',
                    'seat_codes' => null,
                ],
            ]);
    }

    /**
     * Uji konkurensi: simulasi scan serentak tiket yang sama (tepat 1 transaksi sukses 200, request lainnya terlempar 409).
     */
    public function test_simulation_of_concurrent_scans_yields_exactly_one_success_and_others_409(): void
    {
        $concurrentQrHash = hash('sha256', Str::random(32));

        $concurrentTx = EventTransaction::create([
            'order_id' => 'SNM-TKT-2026-CONCURRENCY',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->schedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000.00,
            'discount_amount' => 0.00,
            'net_amount' => 50000.00,
            'payment_status' => 'paid',
            'paid_at' => now()->subMinutes(10),
            'ticket_code' => 'TKT-2026-CONCURRENCY',
            'qr_hash' => $concurrentQrHash,
            'checkin_status' => 'pending',
            'checkin_at' => null,
            'fulfillment_status' => 'fulfilled',
            'snapshot_event_data' => [
                'title' => 'Sebelum Pagi Datang',
                'buyer_name' => 'Dimas Setiawan',
                'seating_type' => 'assigned_seating',
            ],
            'snapshot_seats' => ['C1'],
        ]);

        $gatekeepers = User::factory()->count(10)->create([
            'role' => 'super_admin',
        ]);

        $successCount = 0;
        $conflictCount = 0;

        foreach ($gatekeepers as $staff) {
            $response = $this->actingAs($staff, 'sanctum')
                ->postJson('/api/v1/admin/tickets/validate', [
                    'qr_hash' => $concurrentQrHash,
                    'device_info' => 'Staff-'.$staff->id,
                ]);

            if ($response->status() === 200) {
                $successCount++;
            } elseif ($response->status() === 409) {
                $conflictCount++;
                $response->assertJson([
                    'success' => false,
                    'error_code' => 'TICKET_ALREADY_CHECKED_IN',
                ]);
            }
        }

        // Tepat 1 gatekeeper sukses dan 9 lainnya tertolak dengan HTTP 409 TICKET_ALREADY_CHECKED_IN
        $this->assertEquals(1, $successCount, 'Tepat 1 scan tiket yang berhasil check-in.');
        $this->assertEquals(9, $conflictCount, '9 pemindaian lainnya harus ditolak HTTP 409.');
        $this->assertEquals(1, TicketCheckin::where('transaction_id', $concurrentTx->id)->count());
    }

    /**
     * Uji penolakan tiket presale bioskop (422 Unprocessable Entity - hanya untuk reguler screening).
     */
    public function test_presale_cinema_ticket_is_rejected_with_422(): void
    {
        $presaleEvent = Event::create([
            'title' => 'Cinta dan Sejarah (Presale XXI)',
            'slug' => 'cds-presale-xxi-test',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'description' => 'Presale cinema premiere test.',
            'synopsis_short' => 'Sinopsis presale.',
            'poster_path' => 'events/posters/cds.jpg',
            'backdrop_path' => 'events/backdrops/cds.jpg',
            'director' => 'Sutradara CDS',
            'cast' => ['Aktor A'],
            'rules' => ['Cetak di kiosk bioskop'],
            'venue_name' => 'Cinema XXI Plaza Senayan',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $presaleSchedule = Schedule::create([
            'event_id' => $presaleEvent->id,
            'studio_name' => 'Studio XXI 1',
            'show_time' => now()->addHours(5),
            'ticket_price' => 60000.00,
            'total_seats' => 120,
            'is_active' => true,
        ]);

        $presaleQrHash = hash('sha256', Str::random(32));

        EventTransaction::create([
            'order_id' => 'SNM-TKT-2026-PRESALE',
            'user_id' => $this->customer->id,
            'schedule_id' => $presaleSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 60000.00,
            'discount_amount' => 0.00,
            'net_amount' => 60000.00,
            'payment_status' => 'paid',
            'ticket_code' => 'TKT-PRESALE-01',
            'qr_hash' => $presaleQrHash,
            'checkin_status' => 'pending',
            'fulfillment_status' => 'fulfilled',
            'snapshot_event_data' => [
                'title' => 'Cinta dan Sejarah (Presale XXI)',
                'event_type' => 'presale_cinema',
            ],
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', [
                'qr_hash' => $presaleQrHash,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertStringContainsString('Presale Bioskop', $response->json('message'));
    }

    /**
     * Uji input manual menggunakan ticket_code atau order_id berhasil check-in.
     */
    public function test_manual_checkin_via_ticket_code_or_order_id_succeeds(): void
    {
        $response = $this->actingAs($this->gatekeeperStaff, 'sanctum')
            ->postJson('/api/v1/admin/tickets/validate', [
                'qr_hash' => 'TKT-2026-9812', // Menggunakan ticket_code alih-alih hash
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ticket_code' => 'TKT-2026-9812',
                    'buyer_name' => 'Dimas Setiawan',
                    'checkin_status' => 'checked_in',
                ],
            ]);
    }
}
