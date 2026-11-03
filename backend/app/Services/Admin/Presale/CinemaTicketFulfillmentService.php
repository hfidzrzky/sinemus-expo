<?php

namespace App\Services\Admin\Presale;

use App\Jobs\ProcessBulkInjectCinemaTicketsJob;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Services\Admin\Presale\Actions\BatchFulfillmentConfirmationAction;
use App\Services\Admin\Presale\Actions\SingleTicketInjectionAction;
use App\Services\Admin\Presale\Actions\SmartIngestMatcherAction;
use App\Services\Admin\Presale\Support\CinemaTicketStorageManager;
use App\Services\Tickets\TicketPdfService;
use DomainException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CinemaTicketFulfillmentService
{
    public function __construct(
        protected CinemaPdfParserService $pdfParser,
        protected SingleTicketInjectionAction $singleInjectionAction,
        protected SmartIngestMatcherAction $matcherAction,
        protected BatchFulfillmentConfirmationAction $batchConfirmationAction
    ) {}

    /**
     * Mengambil seluruh pesanan presale terbayar untuk jadwal tayang yang dipilih.
     *
     * @param  array{status?: string|null, search?: string|null}  $filters
     * @return Collection<int, EventTransaction>
     */
    public function getScheduleFulfillmentOrders(Schedule $schedule, array $filters = []): Collection
    {
        $status = $filters['status'] ?? 'all';
        $search = isset($filters['search']) ? trim((string) $filters['search']) : null;

        $query = EventTransaction::where('schedule_id', $schedule->id)
            ->where('payment_status', 'paid')
            ->with([
                'user:id,name,email,phone_number',
                'schedule.event:id,title,venue_name,event_type',
                'schedule.venue:id,venue_name,cinema_partner,city',
            ]);

        if ($status === 'awaiting') {
            $query->where('fulfillment_status', 'awaiting_cinema_ticket');
        } elseif ($status === 'fulfilled') {
            $query->where('fulfillment_status', 'fulfilled');
        }

        if ($search !== null && $search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                    ->orWhere('cinema_booking_code', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone_number', 'like', "%{$search}%");
                    });
            });
        }

        return $query->orderBy('id', 'asc')->get();
    }

    /**
     * Injeksi Satuan via Modal Admin.
     *
     * @throws DomainException
     */
    public function injectSingleTicket(
        int $transactionId,
        int $adminUserId,
        string $bookingCode,
        string $passcode,
        ?UploadedFile $qrImage = null,
        ?string $notes = null,
        bool $sendNotification = true,
        bool $allowUpdate = false
    ): EventTransaction {
        return $this->singleInjectionAction->execute(
            transactionId: $transactionId,
            adminUserId: $adminUserId,
            bookingCode: $bookingCode,
            passcode: $passcode,
            qrImage: $qrImage,
            notes: $notes,
            sendNotification: $sendNotification,
            allowUpdate: $allowUpdate
        );
    }

    /**
     * Smart Batch Ingestion Preview: Ekstraksi Master PDF/ZIP dan pencocokan 4-Point Strict Match Matrix.
     *
     * @return array{
     *     total_detected: int,
     *     matched_count: int,
     *     unmatched_count: int,
     *     matched_items: array<int, array<string, mixed>>,
     *     unmatched_items: array<int, array<string, mixed>>
     * }
     */
    public function previewSmartIngest(Schedule $schedule, UploadedFile $file): array
    {
        $extractedTickets = $this->pdfParser->parse($file);

        return $this->matcherAction->match($schedule, $extractedTickets);
    }

    /**
     * Konfirmasi Final & Publikasi Massal Tiket Presale Terverifikasi.
     *
     * @param  array<int, array{
     *     transaction_id: int,
     *     detected_booking_code: string,
     *     detected_passcode: string,
     *     r2_qr_path: string,
     *     notes?: string|null
     * }>  $approvedItems
     * @return array{fulfilled_count: int, dispatched_notifications_count: int}
     */
    public function confirmSmartFulfillment(
        Schedule $schedule,
        array $approvedItems,
        int $adminUserId,
        bool $sendNotification = true
    ): array {
        return $this->batchConfirmationAction->execute(
            schedule: $schedule,
            approvedItems: $approvedItems,
            adminUserId: $adminUserId,
            sendNotification: $sendNotification
        );
    }

    /**
     * Mengantrekan proses bulk inject via CSV dan ZIP ke background worker.
     *
     * @return array{job_id: string, status: string, total_records_queued: int}
     */
    public function dispatchBulkInject(
        Schedule $schedule,
        UploadedFile $csvFile,
        ?UploadedFile $assetsZip,
        int $adminUserId,
        bool $sendNotification = true
    ): array {
        $sessionId = Str::uuid()->toString();

        // Simpan CSV ke local storage sementara
        $csvPath = $csvFile->storeAs('temp/bulk-inject/'.$sessionId, 'manifest.csv', 'local');

        // Simpan ZIP aset ke local storage sementara jika ada
        $zipPath = null;
        if ($assetsZip !== null) {
            $zipPath = $assetsZip->storeAs('temp/bulk-inject/'.$sessionId, 'assets.zip', 'local');
        }

        // Hitung total baris CSV untuk estimasi antrean
        $totalRecords = 0;
        if (Storage::disk('local')->exists($csvPath)) {
            $content = Storage::disk('local')->get($csvPath);
            $lines = array_filter(explode("\n", (string) $content), fn ($line) => trim($line) !== '');
            $totalRecords = max(0, count($lines) - 1); // kurangi baris header
        }

        $jobId = Str::uuid()->toString();

        ProcessBulkInjectCinemaTicketsJob::dispatch(
            scheduleId: $schedule->id,
            csvPath: $csvPath,
            assetsZipPath: $zipPath,
            adminUserId: $adminUserId,
            sendNotification: $sendNotification
        );

        return [
            'job_id' => $jobId,
            'status' => 'processing',
            'total_records_queued' => $totalRecords,
        ];
    }

    /**
     * Mereset status injeksi tiket bioskop (kembali ke awaiting) dan menghapus berkas QR dari R2.
     *
     * @throws DomainException
     */
    public function resetTicketFulfillment(int $transactionId, int $adminUserId): EventTransaction
    {
        return DB::transaction(function () use ($transactionId) {
            /** @var EventTransaction $transaction */
            $transaction = EventTransaction::lockForUpdate()->findOrFail($transactionId);

            if ($transaction->fulfillment_status !== 'fulfilled') {
                throw new DomainException('Transaksi ini belum pernah diinjeksi tiket.', 422);
            }

            // Hapus file QR dari Cloudflare R2 dan storage publik jika ada
            if (! empty($transaction->cinema_qr_image_path)) {
                CinemaTicketStorageManager::deleteFile($transaction->cinema_qr_image_path);
            }

            // Invalidate cache PDF
            app(TicketPdfService::class)->purgeCache($transaction->order_id);

            // Reset field fulfillment ke state awal
            $transaction->update([
                'fulfillment_status' => 'awaiting_cinema_ticket',
                'cinema_booking_code' => null,
                'cinema_passcode' => null,
                'cinema_qr_image_path' => null,
                'cinema_ticket_notes' => null,
                'fulfilled_at' => null,
                'fulfilled_by_admin_id' => null,
            ]);

            return $transaction->refresh();
        });
    }
}
