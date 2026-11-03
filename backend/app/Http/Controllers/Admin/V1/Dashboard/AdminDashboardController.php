<?php

namespace App\Http\Controllers\Admin\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Dashboard\GetDashboardStatsRequest;
use App\Http\Resources\Admin\V1\Dashboard\DashboardStatsResource;
use App\Services\Admin\Dashboard\DashboardAnalyticsService;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __construct(
        protected DashboardAnalyticsService $analyticsService
    ) {}

    /**
     * Mengambil ringkasan statistik KPI dashboard Super Admin.
     */
    public function stats(GetDashboardStatsRequest $request): JsonResponse
    {
        $fresh = $request->boolean('refresh', false);
        $period = (string) $request->input('period', '7d');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $stats = $this->analyticsService->getDashboardStats($fresh, $period, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'message' => 'Statistik dashboard admin berhasil diambil.',
            'data' => new DashboardStatsResource($stats),
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
