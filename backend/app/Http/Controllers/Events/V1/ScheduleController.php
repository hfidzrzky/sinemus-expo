<?php

namespace App\Http\Controllers\Events\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Events\V1\ScheduleSeatMapResource;
use App\Services\Event\ScheduleSeatMapService;
use Illuminate\Http\JsonResponse;

class ScheduleController extends Controller
{
    public function __construct(
        protected ScheduleSeatMapService $seatMapService
    ) {}

    /**
     * Mengambil tata letak visual denah kursi dan status ketersediaan real-time untuk satu sesi jadwal.
     */
    public function seats(int $id): JsonResponse
    {
        $seatMap = $this->seatMapService->getSeatMap($id);

        return response()->json([
            'success' => true,
            'message' => 'Denah kursi berhasil diambil',
            'data' => new ScheduleSeatMapResource($seatMap),
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
