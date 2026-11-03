<?php

namespace App\Http\Controllers\Banner\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Banner\V1\BannerResource;
use App\Services\Banner\BannerService;
use Illuminate\Http\JsonResponse;

class BannerController extends Controller
{
    public function __construct(
        protected BannerService $bannerService
    ) {}

    /**
     * Mengambil daftar seluruh banner carousel aktif yang sedang dalam periode tayang.
     */
    public function index(): JsonResponse
    {
        $banners = $this->bannerService->getActiveBanners();

        return response()->json([
            'success' => true,
            'message' => 'Daftar banner aktif berhasil diambil',
            'data' => BannerResource::collection($banners),
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
