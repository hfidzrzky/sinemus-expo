<?php

namespace App\Http\Controllers\Admin\V1\Presale;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Presale\AdminFulfillmentFilterRequest;
use App\Http\Requests\Admin\V1\Presale\BulkInjectTicketsRequest;
use App\Http\Requests\Admin\V1\Presale\ConfirmSmartIngestRequest;
use App\Http\Requests\Admin\V1\Presale\InjectCinemaTicketRequest;
use App\Http\Requests\Admin\V1\Presale\PreviewSmartIngestRequest;
use App\Http\Resources\Admin\V1\Presale\CinemaFulfillmentOrderResource;
use App\Http\Resources\Admin\V1\Presale\CinemaTicketInjectionResource;
use App\Http\Resources\Admin\V1\Presale\SmartIngestConfirmResource;
use App\Http\Resources\Admin\V1\Presale\SmartIngestPreviewResource;
use App\Models\Schedule;
use App\Services\Admin\Presale\CinemaTicketFulfillmentService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPresaleInjectController extends Controller
{
    public function __construct(
        protected CinemaTicketFulfillmentService $fulfillmentService
    ) {}

    /**
     * Mengambil daftar seluruh pesanan presale tiket bioskop pada jadwal tertentu.
     */
    public function fulfillmentOrders(AdminFulfillmentFilterRequest $request, string|int $schedule_id): JsonResponse
    {
        $scheduleId = (int) $schedule_id;
        if ($scheduleId <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'ID Jadwal sesi tayang tidak valid.',
                'error_code' => 'INVALID_SCHEDULE_ID',
                'server_time' => now()->toISOString(),
            ], 404);
        }

        /** @var Schedule $schedule */
        $schedule = Schedule::with(['event', 'venue'])->findOrFail($scheduleId);

        if ($schedule->event?->event_type !== 'presale_cinema') {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal yang dipilih bukan merupakan penayangan presale bioskop mitra.',
                'error_code' => 'NOT_PRESALE_EVENT_SCHEDULE',
                'server_time' => now()->toISOString(),
            ], 422);
        }

        $orders = $this->fulfillmentService->getScheduleFulfillmentOrders(
            schedule: $schedule,
            filters: $request->validatedWithDefaults()
        );

        return response()->json([
            'success' => true,
            'message' => 'Daftar pesanan tiket presale bioskop berhasil diambil.',
            'data' => CinemaFulfillmentOrderResource::collection($orders)->resolve($request),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Injeksi manual Booking Code, Passcode, dan QR M-Tix bioskop ke pesanan presale tunggal.
     */
    public function injectSingle(InjectCinemaTicketRequest $request, string|int $id): JsonResponse
    {
        $transactionId = (int) $id;
        if ($transactionId <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'ID Transaksi tidak valid.',
                'error_code' => 'INVALID_TRANSACTION_ID',
                'server_time' => now()->toISOString(),
            ], 404);
        }

        $isUpdate = $request->boolean('allow_update', false);

        try {
            $transaction = $this->fulfillmentService->injectSingleTicket(
                transactionId: $transactionId,
                adminUserId: (int) $request->user()->id,
                bookingCode: (string) $request->validated('cinema_booking_code'),
                passcode: (string) $request->validated('cinema_passcode'),
                qrImage: $request->file('qr_image'),
                notes: $request->validated('notes'),
                sendNotification: $request->boolean('send_notification', true),
                allowUpdate: $isUpdate
            );

            $successMessage = $isUpdate
                ? 'Data tiket bioskop berhasil diperbarui.'
                : 'Tiket bioskop berhasil diinjeksi ke pesanan.';

            return response()->json([
                'success' => true,
                'message' => $successMessage,
                'data' => (new CinemaTicketInjectionResource($transaction))->resolve($request),
                'server_time' => now()->toISOString(),
            ], 200);
        } catch (DomainException $e) {
            $statusCode = $e->getCode() >= 400 && $e->getCode() < 500 ? $e->getCode() : 422;
            $errorCode = match ($statusCode) {
                409 => str_contains($e->getMessage(), 'Konflik Kursi Bioskop') ? 'SEAT_COLLISION_CONFLICT' : 'TRANSACTION_ALREADY_FULFILLED',
                default => 'INJECTION_FAILED',
            };

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => $errorCode,
                'server_time' => now()->toISOString(),
            ], $statusCode);
        }
    }

    /**
     * Mereset status injeksi tiket bioskop (uninject/rollback) dan menghapus berkas QR dari Cloudflare R2.
     */
    public function resetTicket(Request $request, string|int $id): JsonResponse
    {
        $transactionId = (int) $id;
        if ($transactionId <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'ID Transaksi tidak valid.',
                'error_code' => 'INVALID_TRANSACTION_ID',
                'server_time' => now()->toISOString(),
            ], 404);
        }

        try {
            $transaction = $this->fulfillmentService->resetTicketFulfillment(
                transactionId: $transactionId,
                adminUserId: (int) $request->user()->id
            );

            return response()->json([
                'success' => true,
                'message' => 'Data injeksi tiket berhasil di-reset dan berkas QR telah dihapus.',
                'data' => (new CinemaTicketInjectionResource($transaction))->resolve($request),
                'server_time' => now()->toISOString(),
            ], 200);
        } catch (DomainException $e) {
            $statusCode = $e->getCode() >= 400 && $e->getCode() < 500 ? $e->getCode() : 422;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'RESET_FAILED',
                'server_time' => now()->toISOString(),
            ], $statusCode);
        }
    }

    /**
     * Mengunggah Master PDF / ZIP karcis bioskop untuk diekstrak teks & QR-nya,
     * lalu mencocokkannya ke daftar pesanan pemesan aktif (4-Point Match Matrix Preview).
     */
    public function previewSmartIngest(PreviewSmartIngestRequest $request, string|int $schedule_id): JsonResponse
    {
        /** @var Schedule $schedule */
        $schedule = Schedule::findOrFail((int) $schedule_id);

        @set_time_limit(180);
        @ini_set('memory_limit', '512M');

        try {
            $result = $this->fulfillmentService->previewSmartIngest(
                schedule: $schedule,
                file: $request->file('file')
            );

            return response()->json([
                'success' => true,
                'message' => 'Pratinjau pencocokan tiket bioskop berhasil diekstrak.',
                'data' => (new SmartIngestPreviewResource($result))->resolve($request),
                'server_time' => now()->toISOString(),
            ], 200);
        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'INGEST_EXTRACTION_FAILED',
                'server_time' => now()->toISOString(),
            ], 422);
        }
    }

    /**
     * Menyetujui matriks kecocokan tiket, mempromosikan QR R2 (temp -> permanent),
     * mengupdate transaksi secara atomik, dan mendistribusikan e-pass massal.
     */
    public function confirmSmartIngest(ConfirmSmartIngestRequest $request, string|int $schedule_id): JsonResponse
    {
        /** @var Schedule $schedule */
        $schedule = Schedule::findOrFail((int) $schedule_id);

        $result = $this->fulfillmentService->confirmSmartFulfillment(
            schedule: $schedule,
            approvedItems: (array) $request->validated('approved_items'),
            adminUserId: (int) $request->user()->id,
            sendNotification: $request->boolean('send_notification', true)
        );

        return response()->json([
            'success' => true,
            'message' => 'Konfirmasi pemenuhan tiket bioskop berhasil diproses.',
            'data' => (new SmartIngestConfirmResource($result))->resolve($request),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Injeksi massal tiket bioskop melalui upload CSV dan ZIP (Metode Cadangan).
     */
    public function bulkInject(BulkInjectTicketsRequest $request, string|int $schedule_id): JsonResponse
    {
        /** @var Schedule $schedule */
        $schedule = Schedule::findOrFail((int) $schedule_id);

        $result = $this->fulfillmentService->dispatchBulkInject(
            schedule: $schedule,
            csvFile: $request->file('csv_file'),
            assetsZip: $request->file('assets_zip'),
            adminUserId: (int) $request->user()->id,
            sendNotification: $request->boolean('send_notification', true)
        );

        return response()->json([
            'success' => true,
            'message' => 'Antrean injeksi massal tiket bioskop berhasil dibuat.',
            'data' => $result,
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
