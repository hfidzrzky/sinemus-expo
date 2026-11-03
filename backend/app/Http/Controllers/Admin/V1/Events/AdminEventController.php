<?php

namespace App\Http\Controllers\Admin\V1\Events;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Events\AdminEventFilterRequest;
use App\Http\Requests\Admin\V1\Events\GenerateSeatMapRequest;
use App\Http\Requests\Admin\V1\Events\StoreEventRequest;
use App\Http\Requests\Admin\V1\Events\StoreScheduleRequest;
use App\Http\Requests\Admin\V1\Events\UpdateEventRequest;
use App\Http\Resources\Admin\V1\Events\AdminEventDetailResource;
use App\Http\Resources\Admin\V1\Events\AdminEventListResource;
use App\Http\Resources\Admin\V1\Events\AdminScheduleResource;
use App\Models\Schedule;
use App\Services\Admin\Events\AdminEventService;
use App\Services\Admin\Events\AdminScheduleSeatService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AdminEventController extends Controller
{
    public function __construct(
        protected AdminEventService $eventService,
        protected AdminScheduleSeatService $scheduleSeatService
    ) {}

    /**
     * Menampilkan daftar event dengan paginasi dan filter pencarian.
     */
    public function index(AdminEventFilterRequest $request): JsonResponse
    {
        $events = $this->eventService->listEvents(
            filters: $request->validated(),
            perPage: $request->integer('per_page', 15)
        );

        return response()->json([
            'success' => true,
            'message' => 'Daftar event berhasil diambil.',
            'data' => AdminEventListResource::collection($events->items()),
            'meta' => [
                'current_page' => (int) $events->currentPage(),
                'from' => $events->firstItem(),
                'last_page' => (int) $events->lastPage(),
                'per_page' => (int) $events->perPage(),
                'to' => $events->lastItem(),
                'total' => (int) $events->total(),
            ],
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Menyimpan event baru beserta file poster dan backdrop ke Cloudflare R2.
     */
    public function store(StoreEventRequest $request): JsonResponse
    {
        try {
            $event = $this->eventService->createEvent(
                data: $request->validated(),
                poster: $request->file('poster'),
                backdrop: $request->file('backdrop')
            );

            return response()->json([
                'success' => true,
                'message' => 'Event berhasil dibuat.',
                'data' => new AdminEventDetailResource($event),
                'server_time' => now()->toISOString(),
            ], 201);
        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'EVENT_CREATION_FAILED',
                'server_time' => now()->toISOString(),
            ], 422);
        }
    }

    /**
     * Menampilkan informasi detail satu event untuk form multi-tab.
     */
    public function show(int $id): JsonResponse
    {
        $event = $this->eventService->getEventById($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail event berhasil diambil.',
            'data' => new AdminEventDetailResource($event),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Memperbarui metadata event dan mengganti file media jika ada.
     */
    public function update(UpdateEventRequest $request, int $id): JsonResponse
    {
        $event = $this->eventService->getEventById($id);

        try {
            $updatedEvent = $this->eventService->updateEvent(
                event: $event,
                data: $request->validated(),
                poster: $request->file('poster'),
                backdrop: $request->file('backdrop')
            );

            return response()->json([
                'success' => true,
                'message' => 'Event berhasil diperbarui.',
                'data' => new AdminEventDetailResource($updatedEvent),
                'server_time' => now()->toISOString(),
            ], 200);
        } catch (DomainException $e) {
            $errorCode = str_contains(strtolower($e->getMessage()), 'terkunci') ? 'SEATMAP_LOCKED' : 'EVENT_UPDATE_FAILED';

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => $errorCode,
                'server_time' => now()->toISOString(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Error saat update event #'.$id.': '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kendala sistem saat memperbarui event: '.$e->getMessage(),
                'error_code' => 'EVENT_UPDATE_ERROR',
                'server_time' => now()->toISOString(),
            ], 500);
        }
    }

    /**
     * Menghapus event secara aman dengan guard integritas finansial.
     */
    public function destroy(int $id): JsonResponse
    {
        $event = $this->eventService->getEventById($id);

        try {
            $this->eventService->deleteEvent($event);

            return response()->json([
                'success' => true,
                'message' => 'Event berhasil dihapus.',
                'server_time' => now()->toISOString(),
            ], 200);
        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'EVENT_CANNOT_BE_DELETED',
                'server_time' => now()->toISOString(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kendala saat menghapus event: '.$e->getMessage(),
                'error_code' => 'EVENT_DELETE_ERROR',
                'server_time' => now()->toISOString(),
            ], 500);
        }
    }

    /**
     * Menambahkan sesi jam tayang baru untuk event.
     */
    public function storeSchedule(StoreScheduleRequest $request, int $id): JsonResponse
    {
        $event = $this->eventService->getEventById($id);

        $schedule = $this->scheduleSeatService->createSchedule(
            event: $event,
            scheduleData: $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Sesi penayangan berhasil ditambahkan.',
            'data' => new AdminScheduleResource($schedule),
            'server_time' => now()->toISOString(),
        ], 201);
    }

    /**
     * Melakukan generate denah kursi interaktif (batch insert grid) untuk sesi tayang.
     */
    public function generateSeats(GenerateSeatMapRequest $request, int $schedule_id): JsonResponse
    {
        /** @var Schedule $schedule */
        $schedule = Schedule::findOrFail($schedule_id);

        try {
            $totalGenerated = $this->scheduleSeatService->generateSeatsGrid(
                schedule: $schedule,
                seatConfig: $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => "{$totalGenerated} kursi berhasil digenerate.",
                'data' => new AdminScheduleResource($schedule->refresh()),
                'server_time' => now()->toISOString(),
            ], 200);
        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'SEATMAP_LOCKED',
                'server_time' => now()->toISOString(),
            ], 422);
        }
    }
}
