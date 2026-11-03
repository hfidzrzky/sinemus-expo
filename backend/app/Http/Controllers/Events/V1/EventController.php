<?php

namespace App\Http\Controllers\Events\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Events\V1\ListEventsRequest;
use App\Http\Resources\Events\V1\EventDetailResource;
use App\Http\Resources\Events\V1\EventSummaryResource;
use App\Services\Event\EventCatalogService;
use Illuminate\Http\JsonResponse;

class EventController extends Controller
{
    public function __construct(
        protected EventCatalogService $catalogService
    ) {}

    /**
     * Mengambil daftar event screening aktif beserta filter kota, pencarian, dan paginasi.
     */
    public function index(ListEventsRequest $request): JsonResponse
    {
        $events = $this->catalogService->getActiveEvents(
            city: $request->validated('city'),
            eventType: $request->validated('event_type'),
            search: $request->validated('search'),
            perPage: $request->integer('per_page', 15)
        );

        return response()->json([
            'success' => true,
            'message' => 'Daftar event aktif berhasil diambil',
            'data' => EventSummaryResource::collection($events->items()),
            'meta' => [
                'current_page' => (int) $events->currentPage(),
                'from' => $events->firstItem(),
                'last_page' => (int) $events->lastPage(),
                'per_page' => (int) $events->perPage(),
                'to' => $events->lastItem(),
                'total' => (int) $events->total(),
                'available_cities' => $this->catalogService->getActiveCities(),
                'available_formats' => $this->catalogService->getActiveFormats(),
            ],
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Mengambil daftar seluruh kota unik yang memiliki event screening aktif secara dinamis.
     */
    public function cities(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Daftar kota event aktif berhasil diambil',
            'data' => $this->catalogService->getActiveCities(),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Mengambil daftar seluruh format acara aktif beserta label dan jumlah eventnya secara dinamis.
     */
    public function formats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Daftar format acara aktif berhasil diambil',
            'data' => $this->catalogService->getActiveFormats(),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Mengambil detail lengkap satu event screening berdasarkan ID atau slug.
     */
    public function show(string $id_or_slug): JsonResponse
    {
        $event = $this->catalogService->getEventByIdOrSlug($id_or_slug);

        return response()->json([
            'success' => true,
            'message' => 'Detail event berhasil diambil',
            'data' => new EventDetailResource($event),
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
