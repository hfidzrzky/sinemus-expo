<?php

namespace App\Http\Controllers\Setting\V1;

use App\Http\Controllers\Controller;
use App\Services\Admin\Settings\SystemSettingService;
use Illuminate\Http\JsonResponse;

class PublicSettingController extends Controller
{
    public function __construct(
        protected SystemSettingService $settingService
    ) {}

    /**
     * Mengambil konfigurasi publik Sinemus (Hotline WA, helpdesk email, status pemeliharaan, banner).
     */
    public function index(): JsonResponse
    {
        $settings = $this->settingService->getPublicSettings();

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi publik berhasil dimuat.',
            'data' => $settings,
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
