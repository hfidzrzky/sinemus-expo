<?php

namespace Tests\Feature\Admin\Presale;

use App\Http\Resources\Admin\V1\Presale\CinemaTicketInjectionResource;
use App\Jobs\ProcessBulkInjectCinemaTicketsJob;
use App\Jobs\SendCinemaTicketReadyEmailJob;
use App\Mail\Tickets\TicketConfirmationMail;
use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\User;
use App\Services\Admin\Presale\CinemaPdfParserService;
use App\Services\Admin\Presale\Support\CinemaQrImageExtractor;
use App\Services\Admin\Presale\Support\CinemaTicketTextExtractor;
use App\Services\Tickets\TicketEmailPayloadBuilder;
use App\Services\Tickets\TicketPdfService;
use DomainException;
use Dompdf\Dompdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Zxing\QrReader;

class AdminPresaleInjectTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $customer;

    protected Event $presaleEvent;

    protected Schedule $presaleSchedule;

    protected EventTransaction $pendingPresaleTransaction;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Setup Actor: Super Admin
        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Presale',
            'email' => 'admin.presale@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081199990001',
            'is_phone_locked' => true,
        ]);

        // 2. Setup Actor: Customer
        $this->customer = User::factory()->create([
            'name' => 'Penonton Budi',
            'email' => 'budi.penonton@gmail.com',
            'role' => 'customer',
            'phone_number' => '081288492019',
            'is_phone_locked' => true,
        ]);

        // 3. Setup Master Presale Event
        $this->presaleEvent = Event::create([
            'title' => 'Cinta dan Sejarah (CDS) - Special Screening XXI',
            'slug' => 'cinta-dan-sejarah-xxi',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'description' => 'Penayangan eksklusif presale bioskop XXI Plaza Senayan.',
            'synopsis_short' => 'Sinopsis film presale CDS.',
            'poster_path' => 'events/posters/cds-poster.jpg',
            'backdrop_path' => 'events/backdrops/cds-backdrop.jpg',
            'director' => 'Surya Wijaya',
            'cast' => ['Reza Rahadian', 'Dian Sastrowardoyo'],
            'rules' => ['Dilarang merekam', 'Cetak tiket mandiri di kiosk M-Tix XXI'],
            'venue_name' => 'Cinema XXI Plaza Senayan - Studio 2',
            'cinema_partner' => 'Cinema XXI',
            'city' => 'Jakarta Pusat',
            'venue_address' => 'Plaza Senayan Lt. 5, Jl. Asia Afrika No. 8',
            'target_screening_month' => 'November 2026',
            'is_active' => true,
            'is_featured' => true,
        ]);

        // 4. Setup Schedule
        $this->presaleSchedule = Schedule::create([
            'event_id' => $this->presaleEvent->id,
            'studio_name' => 'Studio 2 XXI',
            'show_time' => now()->addDays(30)->setTime(19, 0),
            'ticket_price' => 65000,
            'total_seats' => 150,
            'is_active' => true,
        ]);

        // 5. Setup Paid Presale Transaction (Awaiting Cinema Ticket)
        $this->pendingPresaleTransaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-2026-9001',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->presaleSchedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 130000,
            'discount_amount' => 0,
            'net_amount' => 130000,
            'payment_status' => 'paid',
            'paid_at' => now()->subDay(),
            'fulfillment_status' => 'awaiting_cinema_ticket',
            'snapshot_event_data' => [
                'event_title' => $this->presaleEvent->title,
                'event_type' => 'presale_cinema',
                'venue_name' => $this->presaleEvent->venue_name,
                'studio_name' => $this->presaleSchedule->studio_name,
                'show_time' => $this->presaleSchedule->show_time->toIso8601String(),
            ],
            'snapshot_seats' => ['C5', 'C6'],
        ]);
    }

    /**
     * 1. Test unauthenticated request diproteksi 401 Unauthorized.
     */
    public function test_unauthenticated_user_cannot_access_inject_endpoints(): void
    {
        $this->postJson("/api/v1/admin/transactions/{$this->pendingPresaleTransaction->id}/inject-cinema-ticket")
            ->assertStatus(401);

        $this->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview")
            ->assertStatus(401);

        $this->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/confirm")
            ->assertStatus(401);

        $this->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/bulk-inject-tickets")
            ->assertStatus(401);
    }

    /**
     * 2. Test role non-admin (customer) ditolak dengan 403 Forbidden.
     */
    public function test_customer_role_cannot_inject_ticket_and_receives_403(): void
    {
        $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/admin/transactions/{$this->pendingPresaleTransaction->id}/inject-cinema-ticket", [
                'cinema_booking_code' => 'MTX-849201',
                'cinema_passcode' => '382910',
            ])
            ->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'FORBIDDEN_ROLE_ACCESS',
            ]);
    }

    /**
     * 3. Test Super Admin berhasil menginjeksi single ticket dengan upload gambar QR.
     */
    public function test_super_admin_can_inject_single_cinema_ticket_with_qr_image(): void
    {
        Storage::fake('r2');
        Queue::fake();

        $fakeQrImage = UploadedFile::fake()->image('kiosk_qr.png', 400, 400);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/transactions/{$this->pendingPresaleTransaction->id}/inject-cinema-ticket", [
                'cinema_booking_code' => 'MTX-849201',
                'cinema_passcode' => '382910',
                'qr_image' => $fakeQrImage,
                'notes' => 'Cetak mandiri di Kiosk XXI Lantai 3 samping Studio 2',
                'send_notification' => true,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'order_id',
                    'fulfillment_status',
                    'cinema_booking_code',
                    'cinema_passcode',
                    'qr_image_url',
                    'notes',
                    'fulfilled_at',
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_id' => 'SNM-TKT-2026-9001',
                    'fulfillment_status' => 'fulfilled',
                    'cinema_booking_code' => 'MTX-849201',
                    'cinema_passcode' => '382910',
                    'notes' => 'Cetak mandiri di Kiosk XXI Lantai 3 samping Studio 2',
                ],
            ]);

        // Verifikasi database state
        $this->pendingPresaleTransaction->refresh();
        $this->assertEquals('fulfilled', $this->pendingPresaleTransaction->fulfillment_status);
        $this->assertEquals('MTX-849201', $this->pendingPresaleTransaction->cinema_booking_code);
        $this->assertEquals('382910', $this->pendingPresaleTransaction->cinema_passcode);
        $this->assertEquals($this->superAdmin->id, $this->pendingPresaleTransaction->fulfilled_by_admin_id);
        $this->assertNotNull($this->pendingPresaleTransaction->fulfilled_at);
        $this->assertNotNull($this->pendingPresaleTransaction->cinema_qr_image_path);

        // Verifikasi file QR tersimpan di disk permanent R2
        Storage::disk('r2')->assertExists($this->pendingPresaleTransaction->cinema_qr_image_path);

        // Verifikasi Job Notifikasi ter-dispatch
        Queue::assertPushed(SendCinemaTicketReadyEmailJob::class, function ($job) {
            return $job->transactionId === $this->pendingPresaleTransaction->id;
        });
    }

    /**
     * 4. Test validasi input wajib pada injeksi single (422 Unprocessable Entity).
     */
    public function test_single_inject_validates_required_fields(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/transactions/{$this->pendingPresaleTransaction->id}/inject-cinema-ticket", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['cinema_booking_code', 'cinema_passcode']);
    }

    /**
     * 5. Test penolakan injeksi tiket bioskop pada transaksi regular (non-presale).
     */
    public function test_single_inject_rejects_non_presale_transaction(): void
    {
        $regularEvent = Event::create([
            'title' => 'Screening Indie Komunitas',
            'slug' => 'screening-indie-komunitas',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'description' => 'Regular screening.',
            'synopsis_short' => 'Sinopsis.',
            'poster_path' => 'events/posters/indie.jpg',
            'backdrop_path' => 'events/backdrops/indie.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor 1'],
            'rules' => ['Aturan 1'],
            'venue_name' => 'Sinemus Space',
            'city' => 'Jakarta',
            'venue_address' => 'Jl. Tebet No. 5',
            'is_active' => true,
        ]);

        $regularSchedule = Schedule::create([
            'event_id' => $regularEvent->id,
            'studio_name' => 'Hall A',
            'show_time' => now()->addDays(5),
            'ticket_price' => 50000,
            'total_seats' => 50,
            'is_active' => true,
        ]);

        $regularTransaction = EventTransaction::create([
            'order_id' => 'SNM-TKT-REG-1001',
            'user_id' => $this->customer->id,
            'schedule_id' => $regularSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 0,
            'net_amount' => 50000,
            'payment_status' => 'paid',
            'fulfillment_status' => 'unfulfilled',
            'snapshot_event_data' => [
                'event_type' => 'regular',
            ],
            'snapshot_seats' => ['A1'],
        ]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/transactions/{$regularTransaction->id}/inject-cinema-ticket", [
                'cinema_booking_code' => 'MTX-999999',
                'cinema_passcode' => '123456',
            ])
            ->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'INJECTION_FAILED',
            ]);
    }

    /**
     * 6. Test penolakan injeksi tiket yang sudah berstatus fulfilled (409 Conflict).
     */
    public function test_single_inject_rejects_already_fulfilled_transaction(): void
    {
        $this->pendingPresaleTransaction->update([
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-EXISTING',
            'cinema_passcode' => '111222',
        ]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/transactions/{$this->pendingPresaleTransaction->id}/inject-cinema-ticket", [
                'cinema_booking_code' => 'MTX-NEWCODE',
                'cinema_passcode' => '999999',
            ])
            ->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error_code' => 'TRANSACTION_ALREADY_FULFILLED',
            ]);
    }

    /**
     * 7. Test notifikasi dilewati saat flag send_notification bernilai false.
     */
    public function test_single_inject_skips_notification_when_flag_is_false(): void
    {
        Queue::fake();

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/transactions/{$this->pendingPresaleTransaction->id}/inject-cinema-ticket", [
                'cinema_booking_code' => 'MTX-849201',
                'cinema_passcode' => '382910',
                'send_notification' => false,
            ])
            ->assertStatus(200);

        Queue::assertNotPushed(SendCinemaTicketReadyEmailJob::class);
    }

    /**
     * 8. Test validasi ekstensi berkas pada Smart Ingest Preview (422).
     */
    public function test_smart_ingest_preview_validates_pdf_or_zip_mimes(): void
    {
        $fakeInvalidFile = UploadedFile::fake()->create('manifest.txt', 100, 'text/plain');

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $fakeInvalidFile,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    /**
     * 9. Test Smart Ingest Preview menghasilkan 4-Point Matching Matrix (matched vs unmatched).
     */
    public function test_smart_ingest_preview_returns_4point_matching_matrix(): void
    {
        // Mocking CinemaPdfParserService agar pengujian deterministik dan terisolasi
        $mockParser = $this->createMock(CinemaPdfParserService::class);
        $mockParser->expects($this->once())
            ->method('parse')
            ->willReturn([
                // Tiket 1: Cocok persis dengan kursi C5, C6 milik pendingPresaleTransaction
                [
                    'seat_codes' => ['C5', 'C6'],
                    'booking_code' => 'MTX-849201',
                    'passcode' => '382910',
                    'r2_qr_path' => 'cinema-tickets/temp/sess-1/qr_c5c6.png',
                    'r2_preview_url' => 'https://media.sinemus.id/cinema-tickets/temp/sess-1/qr_c5c6.png',
                ],
                // Tiket 2: Kursi Z99 (tidak ada di database pemesanan)
                [
                    'seat_codes' => ['Z99'],
                    'booking_code' => 'MTX-999999',
                    'passcode' => '999999',
                    'r2_qr_path' => 'cinema-tickets/temp/sess-1/qr_z99.png',
                    'r2_preview_url' => 'https://media.sinemus.id/cinema-tickets/temp/sess-1/qr_z99.png',
                ],
            ]);

        $this->app->instance(CinemaPdfParserService::class, $mockParser);

        $fakePdf = UploadedFile::fake()->create('cinema_master.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'total_detected',
                    'matched_count',
                    'unmatched_count',
                    'matched_items' => [
                        '*' => [
                            'transaction_id',
                            'order_id',
                            'user_name',
                            'seats',
                            'detected_booking_code',
                            'detected_passcode',
                            'r2_qr_path',
                            'r2_preview_url',
                            'match_status',
                        ],
                    ],
                    'unmatched_items' => [
                        '*' => [
                            'detected_seats',
                            'detected_booking_code',
                            'r2_qr_path',
                            'r2_preview_url',
                            'match_status',
                        ],
                    ],
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_detected' => 2,
                    'matched_count' => 1,
                    'unmatched_count' => 1,
                    'matched_items' => [
                        [
                            'transaction_id' => $this->pendingPresaleTransaction->id,
                            'order_id' => $this->pendingPresaleTransaction->order_id,
                            'detected_booking_code' => 'MTX-849201',
                            'detected_passcode' => '382910',
                            'match_status' => 'exact_match',
                        ],
                    ],
                    'unmatched_items' => [
                        [
                            'detected_seats' => ['Z99'],
                            'detected_booking_code' => 'MTX-999999',
                            'match_status' => 'unmatched_seat',
                        ],
                    ],
                ],
            ]);
    }

    /**
     * 10. Test Confirm Smart Fulfillment mempromosikan QR R2 (temp -> permanent) & update DB atomik.
     */
    public function test_confirm_smart_ingest_promotes_temp_r2_to_permanent_and_fulfills_transactions(): void
    {
        Storage::fake('r2');
        Queue::fake();

        // Simpan file simulasi di R2 temporary disk
        $tempPath = 'cinema-tickets/temp/sess-test/fake_qr.png';
        Storage::disk('r2')->put($tempPath, 'fake-qr-binary-content', 'public');

        $payload = [
            'approved_items' => [
                [
                    'transaction_id' => $this->pendingPresaleTransaction->id,
                    'detected_booking_code' => 'MTX-849201',
                    'detected_passcode' => '382910',
                    'r2_qr_path' => $tempPath,
                    'notes' => 'Konfirmasi batch smart ingest',
                ],
            ],
            'send_notification' => true,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/confirm", $payload);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'fulfilled_count',
                    'dispatched_notifications_count',
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'fulfilled_count' => 1,
                    'dispatched_notifications_count' => 1,
                ],
            ]);

        // Verifikasi database terupdate
        $this->pendingPresaleTransaction->refresh();
        $this->assertEquals('fulfilled', $this->pendingPresaleTransaction->fulfillment_status);
        $this->assertEquals('MTX-849201', $this->pendingPresaleTransaction->cinema_booking_code);
        $this->assertEquals('382910', $this->pendingPresaleTransaction->cinema_passcode);
        $this->assertStringStartsWith('cinema-tickets/permanent/', $this->pendingPresaleTransaction->cinema_qr_image_path);

        // Verifikasi file R2 dipromosikan ke permanent dan temp dihapus
        Storage::disk('r2')->assertExists($this->pendingPresaleTransaction->cinema_qr_image_path);
        Storage::disk('r2')->assertMissing($tempPath);

        // Verifikasi queue notification terkirim
        Queue::assertPushed(SendCinemaTicketReadyEmailJob::class, 1);
    }

    /**
     * 11. Test pengamanan Anti-Zip Slip menolak path traversal dengan DomainException.
     */
    public function test_zip_slip_path_traversal_is_blocked_and_throws_exception(): void
    {
        $parserService = app(CinemaPdfParserService::class);

        // Refleksi method private guardAntiZipSlip untuk verifikasi keamanan
        $reflection = new \ReflectionClass(CinemaPdfParserService::class);
        $method = $reflection->getMethod('guardAntiZipSlip');
        $method->setAccessible(true);

        $safeDir = storage_path('app/temp/test-safe');

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Upaya eksploitasi Zip Slip / Path Traversal terdeteksi');

        $method->invokeArgs($parserService, ['../../../../etc/passwd', $safeDir]);
    }

    /**
     * 12. Test Bulk Ingest via CSV dan ZIP mengantrekan background queue job.
     */
    public function test_bulk_inject_tickets_dispatches_background_job(): void
    {
        Queue::fake();
        Storage::fake('local');

        $csvContent = "order_id,cinema_booking_code,cinema_passcode,qr_filename,notes\n";
        $csvContent .= "SNM-TKT-2026-9001,MTX-849201,382910,qr1.png,Catatan Kiosk\n";

        $fakeCsv = UploadedFile::fake()->createWithContent('manifest.csv', $csvContent);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/bulk-inject-tickets", [
                'csv_file' => $fakeCsv,
                'send_notification' => true,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'job_id',
                    'status',
                    'total_records_queued',
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'processing',
                    'total_records_queued' => 1,
                ],
            ]);

        Queue::assertPushed(ProcessBulkInjectCinemaTicketsJob::class);
    }

    /**
     * 13. Test SendCinemaTicketReadyEmailJob mengirim email TicketConfirmationMail ke pengguna.
     */
    public function test_send_cinema_ticket_ready_email_job_sends_mail(): void
    {
        Mail::fake();

        $this->pendingPresaleTransaction->update([
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-849201',
            'cinema_passcode' => '382910',
        ]);

        $job = new SendCinemaTicketReadyEmailJob($this->pendingPresaleTransaction->id);
        $job->handle();

        Mail::assertSent(TicketConfirmationMail::class, function ($mail) {
            return $mail->hasTo($this->customer->email) &&
                $mail->payload['isCinemaPresale'] === true &&
                $mail->payload['isFulfilled'] === true &&
                $mail->payload['cinemaBookingCode'] === 'MTX-849201' &&
                $mail->payload['cinemaPasscode'] === '382910' &&
                $mail->payload['viewTemplate'] === 'emails.tickets.presale-fulfilled';
        });
    }

    /**
     * 14. Test Jaminan Konsistensi 100% QR Code di 3 Kanal (Web Resource, PDF, dan Email).
     */
    public function test_triple_channel_qr_consistency_between_web_resource_pdf_and_email(): void
    {
        Storage::fake('r2');

        // 1. Simpan gambar binary QR lossless di Cloudflare R2
        $pngBytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $r2Path = 'cinema-tickets/permanent/2026/09/unique_qr_lossless.png';
        Storage::disk('r2')->put($r2Path, $pngBytes, 'public');

        $this->pendingPresaleTransaction->update([
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-849201',
            'cinema_passcode' => '382910',
            'cinema_qr_image_path' => $r2Path,
        ]);

        // Kanal 1: Web Resource
        config(['filesystems.disks.r2.url' => 'https://media.sinemus.id']);
        $resource = (new CinemaTicketInjectionResource($this->pendingPresaleTransaction))->resolve();
        $this->assertEquals('https://media.sinemus.id/'.$r2Path, $resource['qr_image_url']);

        // Kanal 2: Email Notification Data URI
        $emailBuilder = app(TicketEmailPayloadBuilder::class);
        $emailPayload = $emailBuilder->build($this->pendingPresaleTransaction);
        $expectedDataUri = 'data:image/png;base64,'.base64_encode($pngBytes);
        $this->assertEquals($expectedDataUri, $emailPayload['qrDataUri']);

        // Kanal 3: PDF Generation Data URI
        $pdfService = app(TicketPdfService::class);
        $reflection = new \ReflectionClass(TicketPdfService::class);
        $generateQrMethod = $reflection->getMethod('generateQrDataUri');
        $generateQrMethod->setAccessible(true);
        $pdfQrDataUri = $generateQrMethod->invokeArgs($pdfService, [$this->pendingPresaleTransaction]);
        $this->assertEquals($expectedDataUri, $pdfQrDataUri);
    }

    /**
     * 15. Test endpoint admin presale memiliki middleware rate limiter yang tepat.
     */
    public function test_presale_routes_have_throttle_middleware(): void
    {
        $singleInjectRoute = Route::getRoutes()->getByName('admin.presale.inject-single');
        $this->assertNotNull($singleInjectRoute);
        $this->assertContains('throttle:20,1', $singleInjectRoute->gatherMiddleware());

        $previewRoute = Route::getRoutes()->getByName('admin.presale.smart-ingest-preview');
        $this->assertNotNull($previewRoute);
        $this->assertContains('throttle:30,1', $previewRoute->gatherMiddleware());

        $confirmRoute = Route::getRoutes()->getByName('admin.presale.smart-ingest-confirm');
        $this->assertNotNull($confirmRoute);
        $this->assertContains('throttle:30,1', $confirmRoute->gatherMiddleware());

        $bulkRoute = Route::getRoutes()->getByName('admin.presale.bulk-inject');
        $this->assertNotNull($bulkRoute);
        $this->assertContains('throttle:30,1', $bulkRoute->gatherMiddleware());

        $fulfillmentRoute = Route::getRoutes()->getByName('admin.presale.fulfillment-orders');
        $this->assertNotNull($fulfillmentRoute);
        $this->assertContains('throttle:60,1', $fulfillmentRoute->gatherMiddleware());
    }

    /**
     * 16. Test pengguna tanpa autentikasi ditolak 401 saat mengakses fulfillment orders.
     */
    public function test_unauthenticated_user_cannot_access_fulfillment_orders(): void
    {
        $response = $this->getJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/fulfillment");
        $response->assertStatus(401);
    }

    /**
     * 17. Test pengguna dengan peran customer ditolak 403 saat mengakses fulfillment orders.
     */
    public function test_customer_role_cannot_access_fulfillment_orders(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->getJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/fulfillment");

        $response->assertStatus(403);
    }

    /**
     * 18. Test super admin dapat mengambil daftar pesanan fulfillment dengan amplop dan DTO baku.
     */
    public function test_super_admin_can_get_schedule_fulfillment_orders(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/fulfillment");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'transaction_id',
                        'order_id',
                        'user_name',
                        'user_email',
                        'user_phone',
                        'event_title',
                        'schedule_show_time',
                        'venue_name',
                        'ticket_quantity',
                        'seats',
                        'gross_amount',
                        'discount_amount',
                        'net_amount',
                        'payment_status',
                        'fulfillment_status',
                        'cinema_booking_code',
                        'cinema_passcode',
                        'cinema_qr_image_path',
                        'cinema_ticket_notes',
                        'fulfilled_at',
                        'created_at',
                    ],
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
            ]);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        $this->assertEquals($this->pendingPresaleTransaction->order_id, $data[0]['order_id']);
        $this->assertEquals(['C5', 'C6'], $data[0]['seats']);
        $this->assertEquals('awaiting_cinema_ticket', $data[0]['fulfillment_status']);
    }

    /**
     * 19. Test penolakan 422 jika jadwal yang diminta bukan event bertipe presale_cinema.
     */
    public function test_fulfillment_orders_rejects_non_presale_event_schedule(): void
    {
        $regularEvent = Event::create([
            'title' => 'Screening Biasa Non Bioskop',
            'slug' => 'screening-biasa-non-bioskop-'.uniqid(),
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'description' => 'Deskripsi event komunitas indie.',
            'synopsis_short' => 'Sinopsis singkat indie.',
            'poster_path' => 'events/posters/indie.jpg',
            'backdrop_path' => 'events/backdrops/indie.jpg',
            'director' => 'Sutradara Indie',
            'cast' => ['Aktor 1'],
            'rules' => ['Tertib'],
            'venue_name' => 'Studio Indie',
            'city' => 'Jakarta Selatan',
            'venue_address' => 'Jl. Tebet No. 1',
            'is_active' => true,
        ]);

        $regularSchedule = Schedule::create([
            'event_id' => $regularEvent->id,
            'studio_name' => 'Ruang 1',
            'show_time' => now()->addDays(5),
            'ticket_price' => 50000,
            'total_seats' => 50,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/schedules/{$regularSchedule->id}/fulfillment");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'NOT_PRESALE_EVENT_SCHEDULE',
            ]);
    }

    /**
     * 20. Test filter status pesanan fulfillment (awaiting vs fulfilled).
     */
    public function test_fulfillment_orders_filters_by_status(): void
    {
        // Buat transaksi kedua yang sudah fulfilled pada schedule yang sama
        EventTransaction::create([
            'order_id' => 'SNM-TKT-FULFILLED-001',
            'user_id' => $this->customer->id,
            'schedule_id' => $this->presaleSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 60000,
            'discount_amount' => 0,
            'net_amount' => 60000,
            'payment_status' => 'paid',
            'paid_at' => now(),
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-XXI-DONE',
            'cinema_passcode' => '123456',
            'snapshot_event_data' => [
                'event_title' => $this->presaleEvent->title,
                'event_type' => 'presale_cinema',
                'venue_name' => $this->presaleEvent->venue_name,
                'studio_name' => $this->presaleSchedule->studio_name,
                'show_time' => $this->presaleSchedule->show_time->toIso8601String(),
            ],
            'snapshot_seats' => ['A1'],
        ]);

        // Filter awaiting
        $awaitingResp = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/fulfillment?status=awaiting");

        $awaitingResp->assertStatus(200);
        $awaitingData = $awaitingResp->json('data');
        $this->assertCount(1, $awaitingData);
        $this->assertEquals('awaiting_cinema_ticket', $awaitingData[0]['fulfillment_status']);

        // Filter fulfilled
        $fulfilledResp = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/fulfillment?status=fulfilled");

        $fulfilledResp->assertStatus(200);
        $fulfilledData = $fulfilledResp->json('data');
        $this->assertCount(1, $fulfilledData);
        $this->assertEquals('fulfilled', $fulfilledData[0]['fulfillment_status']);

        // Filter all
        $allResp = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/fulfillment?status=all");

        $allResp->assertStatus(200);
        $this->assertCount(2, $allResp->json('data'));
    }

    /**
     * 21. Test filter pencarian order_id / nama penonton pada fulfillment orders.
     */
    public function test_fulfillment_orders_searches_by_keyword(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/fulfillment?search=2026-9001");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($this->pendingPresaleTransaction->order_id, $data[0]['order_id']);

        // Search non existent
        $emptyResp = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/fulfillment?search=NONEXISTENT_KEYWORD");

        $emptyResp->assertStatus(200);
        $this->assertCount(0, $emptyResp->json('data'));
    }

    /**
     * 22. Test 5-Point Match Matrix menolak karcis milik film lain (Cross-Movie Guard).
     */
    public function test_smart_ingest_rejects_foreign_movie_tickets(): void
    {
        // Buat film presale lain di database untuk memicu deteksi film asing
        Event::create([
            'title' => 'Bumi Manusia 4K Special Roadshow',
            'slug' => 'bumi-manusia-4k-special-roadshow',
            'event_type' => 'presale_cinema',
            'seating_type' => 'assigned_seating',
            'description' => 'Film lain.',
            'synopsis_short' => 'Sinopsis.',
            'poster_path' => 'events/posters/bumi.jpg',
            'backdrop_path' => 'events/backdrops/bumi.jpg',
            'director' => 'Hanung',
            'cast' => ['Iqbaal'],
            'rules' => ['Aturan'],
            'venue_name' => 'Cinema XXI Plaza Senayan',
            'city' => 'Jakarta',
            'venue_address' => 'Plaza Senayan',
            'is_active' => true,
        ]);

        $mockParser = $this->createMock(CinemaPdfParserService::class);
        $mockParser->expects($this->once())
            ->method('parse')
            ->willReturn([
                [
                    'seat_codes' => ['C5', 'C6'],
                    'booking_code' => 'MTX-849201',
                    'passcode' => '382910',
                    'raw_text' => "TIKET CINEMA XXI\nTITLE: BUMI MANUSIA 4K\nKURSI: C5, C6",
                    'r2_qr_path' => 'cinema-tickets/temp/sess-1/qr_c5c6.png',
                    'r2_preview_url' => 'https://media.sinemus.id/cinema-tickets/temp/sess-1/qr_c5c6.png',
                ],
            ]);

        $this->app->instance(CinemaPdfParserService::class, $mockParser);

        $fakePdf = UploadedFile::fake()->create('foreign_movie_tickets.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(0, $data['matched_count']);
        $this->assertEquals(1, $data['unmatched_count']);
        $this->assertEquals('rejected_foreign_movie', $data['unmatched_items'][0]['match_status']);
        $this->assertStringContainsString('Bumi Manusia', $data['unmatched_items'][0]['unmatched_reason']);
    }

    /**
     * 23. Test 5-Point Match Matrix menolak karcis dengan nomor studio tidak cocok (Studio Guard).
     */
    public function test_smart_ingest_rejects_mismatched_studio_tickets(): void
    {
        // presaleSchedule adalah Studio 2 XXI
        $mockParser = $this->createMock(CinemaPdfParserService::class);
        $mockParser->expects($this->once())
            ->method('parse')
            ->willReturn([
                [
                    'seat_codes' => ['C5', 'C6'],
                    'booking_code' => 'MTX-849201',
                    'passcode' => '382910',
                    'detected_studio' => 'Studio 1',
                    'raw_text' => "TIKET CINEMA XXI\nSTUDIO 1\nKURSI: C5, C6",
                    'r2_qr_path' => 'cinema-tickets/temp/sess-1/qr_c5c6.png',
                    'r2_preview_url' => 'https://media.sinemus.id/cinema-tickets/temp/sess-1/qr_c5c6.png',
                ],
            ]);

        $this->app->instance(CinemaPdfParserService::class, $mockParser);

        $fakePdf = UploadedFile::fake()->create('studio1_tickets.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(0, $data['matched_count']);
        $this->assertEquals(1, $data['unmatched_count']);
        $this->assertEquals('rejected_mismatched_studio', $data['unmatched_items'][0]['match_status']);
        $this->assertStringContainsString('Studio 1', $data['unmatched_items'][0]['unmatched_reason']);
    }

    /**
     * 24. Test 5-Point Match Matrix menolak karcis dengan jam tayang berselisih jauh (Time Guard).
     */
    public function test_smart_ingest_rejects_mismatched_time_tickets(): void
    {
        // presaleSchedule adalah jam 19:30
        $mockParser = $this->createMock(CinemaPdfParserService::class);
        $mockParser->expects($this->once())
            ->method('parse')
            ->willReturn([
                [
                    'seat_codes' => ['C5', 'C6'],
                    'booking_code' => 'MTX-849201',
                    'passcode' => '382910',
                    'detected_time' => '14:00', // Selisih lebih dari 30 menit
                    'raw_text' => "TIKET CINEMA XXI\nJAM: 14:00 WIB\nKURSI: C5, C6",
                    'r2_qr_path' => 'cinema-tickets/temp/sess-1/qr_c5c6.png',
                    'r2_preview_url' => 'https://media.sinemus.id/cinema-tickets/temp/sess-1/qr_c5c6.png',
                ],
            ]);

        $this->app->instance(CinemaPdfParserService::class, $mockParser);

        $fakePdf = UploadedFile::fake()->create('time_mismatch_tickets.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(0, $data['matched_count']);
        $this->assertEquals(1, $data['unmatched_count']);
        $this->assertEquals('rejected_mismatched_time', $data['unmatched_items'][0]['match_status']);
        $this->assertStringContainsString('14:00', $data['unmatched_items'][0]['unmatched_reason']);
    }

    /**
     * 25. Test admin dapat memperbarui tiket bioskop yang sudah fulfilled saat allow_update bernilai true.
     */
    public function test_single_inject_allows_updating_fulfilled_ticket_when_allow_update_flag_is_true(): void
    {
        $this->pendingPresaleTransaction->update([
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-OLD-CODE',
            'cinema_passcode' => '111111',
            'cinema_ticket_notes' => 'Catatan lama',
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/transactions/{$this->pendingPresaleTransaction->id}/inject-cinema-ticket", [
                'cinema_booking_code' => 'MTX-UPDATED-CODE',
                'cinema_passcode' => '999888',
                'notes' => 'Catatan revisi kiosk',
                'send_notification' => false,
                'allow_update' => true,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Data tiket bioskop berhasil diperbarui.',
                'data' => [
                    'order_id' => $this->pendingPresaleTransaction->order_id,
                    'fulfillment_status' => 'fulfilled',
                    'cinema_booking_code' => 'MTX-UPDATED-CODE',
                    'cinema_passcode' => '999888',
                    'notes' => 'Catatan revisi kiosk',
                ],
            ]);

        $this->pendingPresaleTransaction->refresh();
        $this->assertEquals('MTX-UPDATED-CODE', $this->pendingPresaleTransaction->cinema_booking_code);
        $this->assertEquals('999888', $this->pendingPresaleTransaction->cinema_passcode);
        $this->assertEquals('Catatan revisi kiosk', $this->pendingPresaleTransaction->cinema_ticket_notes);
    }

    /**
     * 26. Test penolakan injeksi saat kursi bertabrakan dengan pesanan lain yang sudah fulfilled (Cross-Order Collision Guard).
     */
    public function test_single_inject_rejects_cross_order_duplicate_seat_collision(): void
    {
        // Buat order lain pada schedule yang sama yang sudah fulfilled dan memegang kursi C6
        $otherCustomer = User::factory()->create([
            'name' => 'Muhammad Hafidz',
            'email' => 'hafidz@gmail.com',
            'phone_number' => '081299998888',
        ]);

        EventTransaction::create([
            'order_id' => 'SNM-TKT-HAFIDZ-001',
            'user_id' => $otherCustomer->id,
            'schedule_id' => $this->presaleSchedule->id,
            'ticket_quantity' => 1,
            'gross_amount' => 65000,
            'discount_amount' => 0,
            'net_amount' => 65000,
            'payment_status' => 'paid',
            'paid_at' => now(),
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-HAFIDZ-01',
            'cinema_passcode' => '123456',
            'snapshot_event_data' => [
                'event_type' => 'presale_cinema',
            ],
            'snapshot_seats' => ['C6'], // Bertabrakan dengan C5, C6 milik pendingPresaleTransaction
        ]);

        // Coba injeksi pendingPresaleTransaction yang memiliki kursi C5 dan C6
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/transactions/{$this->pendingPresaleTransaction->id}/inject-cinema-ticket", [
                'cinema_booking_code' => 'MTX-SINEMUS-01',
                'cinema_passcode' => '654321',
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error_code' => 'SEAT_COLLISION_CONFLICT',
            ]);

        $this->assertStringContainsString('Konflik Kursi Bioskop', (string) $response->json('message'));
        $this->assertStringContainsString('C6', (string) $response->json('message'));
        $this->assertStringContainsString('SNM-TKT-HAFIDZ-001', (string) $response->json('message'));
        $this->assertStringContainsString('Muhammad Hafidz', (string) $response->json('message'));
    }

    /**
     * 27. Test Smart Ingest menghasilkan binary PNG QR yang valid (bukan teks SVG) dan terbaca scanner.
     */
    public function test_smart_ingest_generates_valid_lossless_png_qr_for_preview(): void
    {
        Storage::fake('r2');

        // Render PDF menggunakan DomPDF dengan teks tiket lengkap
        $html = '
            <html>
            <body>
                <h1>CINEMA XXI</h1>
                <p>CINTA DAN SEJARAH (CDS) - SPECIAL SCREENING XXI</p>
                <p>Studio 2 XXI</p>
                <p>KURSI: C5, C6</p>
                <p>BOOKING CODE: MTX-849201</p>
                <p>PASSCODE: 382910</p>
            </body>
            </html>
        ';

        $dompdf = new Dompdf;
        $dompdf->loadHtml($html);
        $dompdf->render();
        $pdfContent = $dompdf->output();

        $uploadedPdf = UploadedFile::fake()->createWithContent('master_xxi_tickets.pdf', $pdfContent);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $uploadedPdf,
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals(1, $data['matched_count']);
        $matchedItem = $data['matched_items'][0];
        $this->assertEquals('MTX-849201', $matchedItem['detected_booking_code']);
        $this->assertEquals('382910', $matchedItem['detected_passcode']);

        // Verifikasi bahwa file QR di storage adalah valid PNG murni ber-header 89504e470d0a1a0a
        $r2Path = $matchedItem['r2_qr_path'];
        Storage::disk('r2')->assertExists($r2Path);

        $fileBytes = Storage::disk('r2')->get($r2Path);
        $this->assertStringStartsWith("\x89PNG\r\n\x1a\n", $fileBytes, 'QR file yang disimpan harus berformat binary PNG murni.');

        // Verifikasi bahwa QR code dapat didecode kembali
        $reader = new QrReader($fileBytes, QrReader::SOURCE_TYPE_BLOB);
        $decodedText = $reader->text();
        $this->assertNotEmpty($decodedText);
        $this->assertStringContainsString('MTX-849201', $decodedText);
    }

    /**
     * 28. Test Smart Ingest menolak film luar yang tidak ada di database (misal SPIDERMAN) jika judul berbeda dengan target event aktif.
     */
    public function test_smart_ingest_rejects_external_foreign_movie_like_spiderman(): void
    {
        $mockParser = $this->createMock(CinemaPdfParserService::class);
        $mockParser->expects($this->once())
            ->method('parse')
            ->willReturn([
                [
                    'seat_codes' => ['C5', 'C6'],
                    'booking_code' => 'MTX-849201',
                    'passcode' => '382910',
                    'detected_movie_title' => 'SPIDERMAN: NO WAY HOME',
                    'raw_text' => "TIKET CINEMA XXI\nFILM: SPIDERMAN: NO WAY HOME\nKURSI: C5, C6",
                    'r2_qr_path' => 'cinema-tickets/temp/sess-1/qr_c5c6.png',
                    'r2_preview_url' => 'https://media.sinemus.id/cinema-tickets/temp/sess-1/qr_c5c6.png',
                ],
            ]);

        $this->app->instance(CinemaPdfParserService::class, $mockParser);

        $fakePdf = UploadedFile::fake()->create('spiderman_tickets.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(0, $data['matched_count'], 'Film asing tidak boleh masuk ke daftar cocok (0 matched)');
        $this->assertEquals(1, $data['unmatched_count']);
        $this->assertEquals('rejected_foreign_movie', $data['unmatched_items'][0]['match_status']);
        $this->assertStringContainsString('SPIDERMAN', $data['unmatched_items'][0]['unmatched_reason']);
        $this->assertStringContainsString($this->presaleEvent->title, $data['unmatched_items'][0]['unmatched_reason']);
    }

    /**
     * 29. Test Smart Ingest menolak karcis tanpa PIN/Passcode masuk ke matched_items, dan merutekannya ke unmatched_items dengan flag can_manual_fulfill = true.
     */
    public function test_smart_ingest_routes_ticket_with_missing_passcode_to_unmatched_items_with_can_manual_fulfill(): void
    {
        $mockParser = $this->createMock(CinemaPdfParserService::class);
        $mockParser->expects($this->once())
            ->method('parse')
            ->willReturn([
                [
                    'seat_codes' => ['C5', 'C6'],
                    'booking_code' => 'MTX-849201',
                    'passcode' => null, // PIN kosong/hilang
                    'detected_movie_title' => null,
                    'raw_text' => "TIKET CINEMA XXI\nSTUDIO 2\nKURSI: C5, C6\nBOOKING CODE: MTX-849201",
                    'r2_qr_path' => 'cinema-tickets/temp/sess-1/qr_c5c6.png',
                    'r2_preview_url' => 'https://media.sinemus.id/cinema-tickets/temp/sess-1/qr_c5c6.png',
                ],
            ]);

        $this->app->instance(CinemaPdfParserService::class, $mockParser);

        $fakePdf = UploadedFile::fake()->create('missing_pin_tickets.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(0, $data['matched_count'], 'Karcis tanpa PIN tidak boleh lolos ke matched_items.');
        $this->assertEquals(1, $data['unmatched_count']);

        $unmatched = $data['unmatched_items'][0];
        $this->assertEquals('rejected_missing_passcode', $unmatched['match_status']);
        $this->assertTrue($unmatched['can_manual_fulfill'], 'Harus dapat di-fulfill manual oleh admin dengan mengisikan PIN di matrix.');
        $this->assertEquals($this->pendingPresaleTransaction->id, $unmatched['transaction_id']);
        $this->assertEquals($this->pendingPresaleTransaction->order_id, $unmatched['order_id']);
        $this->assertEquals($this->customer->name, $unmatched['user_name']);
        $this->assertStringContainsString('Passcode PIN kiosk tidak terdeteksi', $unmatched['unmatched_reason']);
    }

    /**
     * 30. Test Smart Ingest menolak passcode dummy '000000' dan memperlakukannya sebagai missing passcode.
     */
    public function test_smart_ingest_rejects_dummy_zero_passcode(): void
    {
        $mockParser = $this->createMock(CinemaPdfParserService::class);
        $mockParser->expects($this->once())
            ->method('parse')
            ->willReturn([
                [
                    'seat_codes' => ['C5', 'C6'],
                    'booking_code' => 'MTX-849201',
                    'passcode' => '000000', // Dummy placeholder
                    'detected_movie_title' => null,
                    'raw_text' => "TIKET CINEMA XXI\nSTUDIO 2\nKURSI: C5, C6\nBOOKING CODE: MTX-849201",
                    'r2_qr_path' => 'cinema-tickets/temp/sess-1/qr_c5c6.png',
                    'r2_preview_url' => 'https://media.sinemus.id/cinema-tickets/temp/sess-1/qr_c5c6.png',
                ],
            ]);

        $this->app->instance(CinemaPdfParserService::class, $mockParser);

        $fakePdf = UploadedFile::fake()->create('dummy_pin_tickets.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(0, $data['matched_count'], 'Passcode dummy 000000 tidak boleh lolos sebagai exact match.');
        $this->assertEquals(1, $data['unmatched_count']);
        $this->assertEquals('rejected_missing_passcode', $data['unmatched_items'][0]['match_status']);
    }

    /**
     * 31. Test CinemaQrImageExtractor mendeteksi QR pembayaran QRIS dan melakukan pemotongan QR presisi dengan Quiet Zone 18px.
     */
    public function test_cinema_qr_image_extractor_detects_payment_qris_and_crops_qr(): void
    {
        $qrExtractor = app(CinemaQrImageExtractor::class);

        // 1. Verifikasi deteksi payload pembayaran QRIS
        $qrisPayload = '00020101021226590014ID.CO.QRIS.WWW01189360099800000102435204581253033605802ID5911Cinema XXI6007Jakarta6304ABCD';
        $this->assertTrue($qrExtractor->isPaymentQrisPayload($qrisPayload));
        $this->assertFalse($qrExtractor->isPaymentQrisPayload('MTX-849201'));
        $this->assertFalse($qrExtractor->isPaymentQrisPayload('MTX-849201-382910'));

        // 2. Buat binary QR karcis bioskop
        $ticketPayload = 'MTX-849201';
        $qrPngBinary = $qrExtractor->generateVectorQrPngBinary($ticketPayload);

        // Uji coba cropQrFromBinaryWithPadding
        $cropped = $qrExtractor->cropQrFromBinaryWithPadding($qrPngBinary);
        $this->assertNotNull($cropped);
        $this->assertStringStartsWith("\x89PNG\r\n\x1a\n", $cropped);

        // Pastikan QR hasil crop dapat didecode kembali secara akurat
        $reader = new QrReader($cropped, QrReader::SOURCE_TYPE_BLOB);
        $decoded = $reader->text();
        $this->assertEquals('MTX-849201', $decoded);
    }

    /**
     * 32. Test Smart Ingest mendeteksi karcis yang kursinya sudah pernah diinjeksi sebelumnya (already_fulfilled) dan tidak ambigu.
     */
    public function test_smart_ingest_identifies_already_fulfilled_tickets_with_order_details(): void
    {
        // Ubah transaksi pending menjadi fulfilled terlebih dahulu
        $this->pendingPresaleTransaction->update([
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-EXISTING',
            'cinema_passcode' => '112233',
            'fulfilled_at' => now(),
        ]);

        $mockParser = $this->createMock(CinemaPdfParserService::class);
        $mockParser->expects($this->once())
            ->method('parse')
            ->willReturn([
                [
                    'seat_codes' => ['C5', 'C6'],
                    'booking_code' => 'MTX-849201',
                    'passcode' => '382910',
                    'detected_movie_title' => null,
                    'raw_text' => "TIKET CINEMA XXI\nSTUDIO 2\nKURSI: C5, C6\nBOOKING CODE: MTX-849201\nPIN: 382910",
                    'r2_qr_path' => 'cinema-tickets/temp/sess-1/qr_c5c6.png',
                    'r2_preview_url' => 'https://media.sinemus.id/cinema-tickets/temp/sess-1/qr_c5c6.png',
                ],
            ]);

        $this->app->instance(CinemaPdfParserService::class, $mockParser);

        $fakePdf = UploadedFile::fake()->create('already_fulfilled_tickets.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(0, $data['matched_count'], 'Karcis yang sudah diinjeksi tidak boleh masuk matched_items.');
        $this->assertEquals(1, $data['unmatched_count']);

        $unmatched = $data['unmatched_items'][0];
        $this->assertEquals('already_fulfilled', $unmatched['match_status']);
        $this->assertFalse($unmatched['can_manual_fulfill']);
        $this->assertEquals($this->pendingPresaleTransaction->id, $unmatched['transaction_id']);
        $this->assertEquals($this->pendingPresaleTransaction->order_id, $unmatched['order_id']);
        $this->assertEquals($this->customer->name, $unmatched['user_name']);
        $this->assertStringContainsString('sudah pernah diinjeksi sebelumnya', $unmatched['unmatched_reason']);
        $this->assertStringContainsString($this->pendingPresaleTransaction->order_id, $unmatched['unmatched_reason']);
    }

    /**
     * 33. Test Konfirmasi Ulang (Idempoten) Tidak Memicu Email Ganda (Anti-Double-Send Guard).
     */
    public function test_confirm_smart_ingest_is_idempotent_and_prevents_duplicate_email_on_retry(): void
    {
        Storage::fake('r2');
        Queue::fake();

        // Siapkan transaksi yang sudah fulfilled sebelumnya
        $tempPath = 'cinema-tickets/temp/sess-retry/fake_qr.png';
        Storage::disk('r2')->put($tempPath, 'fake-qr-binary-content', 'public');

        $this->pendingPresaleTransaction->update([
            'fulfillment_status' => 'fulfilled',
            'cinema_booking_code' => 'MTX-849201',
            'cinema_passcode' => '382910',
            'cinema_qr_image_path' => 'cinema-tickets/permanent/2026/10/fake_qr.png',
        ]);

        $payload = [
            'approved_items' => [
                [
                    'transaction_id' => $this->pendingPresaleTransaction->id,
                    'detected_booking_code' => 'MTX-849201',
                    'detected_passcode' => '382910',
                    'r2_qr_path' => $tempPath,
                    'notes' => 'Retry konfirmasi',
                ],
            ],
            'send_notification' => true,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/confirm", $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'fulfilled_count' => 1,
                    'dispatched_notifications_count' => 0, // 0 email karena sudah fulfilled!
                ],
            ]);

        // Verifikasi tidak ada job email baru yang diantrekan
        Queue::assertNotPushed(SendCinemaTicketReadyEmailJob::class);
    }

    /**
     * 34. Test CinemaTicketTextExtractor mengenali variasi 'Kode pesanan' dan QR payload m.tix Cinema XXI.
     */
    public function test_cinema_text_extractor_recognizes_kode_pesanan_and_mtix_qr_payload(): void
    {
        $extractor = app(CinemaTicketTextExtractor::class);

        // Ekstraksi teks dari e-tiket Cinema XXI
        $rawText = "Kode pesanan\n67240\nAVENGERS ENDGAME\nCinema XXI\nFESTIVAL CITYLINK XXI, Studio 5\nSenin, 12 Oktober 2026, 14:30\nC7";
        $result = $extractor->extract($rawText);

        $this->assertEquals('67240', $result['booking_code']);
        $this->assertContains('C7', $result['seat_codes']);
        $this->assertEquals('Studio 5', $result['detected_studio']);
        $this->assertEquals('14:30', $result['detected_time']);

        // Ekstraksi dari string muatan QR Code m.tix
        $qrResult = $extractor->extractFromQrPayload('#6289658301529;67240');
        $this->assertEquals('67240', $qrResult['booking_code']);
        $this->assertEquals('6289658301529', $qrResult['detected_phone']);
    }

    /**
     * 35. Test Smart Ingest mencocokkan karcis PDF Flat via nomor HP pemesan (Fallback Matcher).
     */
    public function test_smart_ingest_matches_flat_ticket_via_phone_number_fallback(): void
    {
        $this->customer->update(['phone_number' => '+6289658301529']);

        $mockParser = $this->createMock(CinemaPdfParserService::class);
        $mockParser->expects($this->once())
            ->method('parse')
            ->willReturn([
                [
                    'seat_codes' => [], // Kosong karena PDF Flat tanpa layer teks
                    'booking_code' => '67240',
                    'passcode' => '482910',
                    'detected_phone' => '6289658301529', // Terdeteksi dari payload QR #6289658301529;67240
                    'raw_text' => '',
                    'r2_qr_path' => 'cinema-tickets/temp/sess-flat/qr_cropped.png',
                    'r2_preview_url' => 'https://media.sinemus.id/cinema-tickets/temp/sess-flat/qr_cropped.png',
                    'qr_source' => 'original_pdf',
                ],
            ]);

        $this->app->instance(CinemaPdfParserService::class, $mockParser);

        $fakePdf = UploadedFile::fake()->create('bentuk1_flat.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/admin/schedules/{$this->presaleSchedule->id}/smart-ingest/preview", [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals(1, $data['matched_count'], 'Karcis Flat harus berhasil dicocokkan via nomor telepon pemesan.');
        $this->assertEquals(0, $data['unmatched_count']);

        $matchedItem = $data['matched_items'][0];
        $this->assertEquals($this->pendingPresaleTransaction->id, $matchedItem['transaction_id']);
        $this->assertEquals('67240', $matchedItem['detected_booking_code']);
        $this->assertEquals('482910', $matchedItem['detected_passcode']);
        // Kursi harus otomatis terisi dari snapshot_seats milik transaksi
        $this->assertEquals($this->pendingPresaleTransaction->snapshot_seats, $matchedItem['seats']);
    }
}
