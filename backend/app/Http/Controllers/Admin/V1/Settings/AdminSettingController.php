<?php

namespace App\Http\Controllers\Admin\V1\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Settings\UpdateBusinessPoliciesRequest;
use App\Http\Requests\Admin\V1\Settings\UpdateEmergencyControlsRequest;
use App\Http\Requests\Admin\V1\Settings\UpdatePublicContactRequest;
use App\Services\Admin\Settings\SystemSettingService;
use Illuminate\Http\JsonResponse;

class AdminSettingController extends Controller
{
    public function __construct(
        protected SystemSettingService $settingService
    ) {}

    /**
     * Menampilkan seluruh pengaturan sistem beserta metadata audit untuk Admin Studio.
     */
    public function index(): JsonResponse
    {
        $settings = $this->settingService->getAllSettings();

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan sistem berhasil diambil.',
            'data' => $settings,
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Memperbarui Kebijakan Bisnis & Transaksi (Seat lock, rental VoD, fee).
     */
    public function updateBusinessPolicies(UpdateBusinessPoliciesRequest $request): JsonResponse
    {
        $adminId = (int) $request->user()->id;
        $updated = $this->settingService->updateBusinessPolicies($request->validated(), $adminId);

        return response()->json([
            'success' => true,
            'message' => 'Kebijakan bisnis dan transaksi berhasil diperbarui.',
            'data' => $updated,
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Memperbarui Layanan Kontak Publik & Helpdesk WhatsApp.
     */
    public function updatePublicContact(UpdatePublicContactRequest $request): JsonResponse
    {
        $adminId = (int) $request->user()->id;
        $updated = $this->settingService->updatePublicContact($request->validated(), $adminId);

        return response()->json([
            'success' => true,
            'message' => 'Layanan kontak publik dan helpdesk berhasil diperbarui.',
            'data' => $updated,
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Memperbarui Kontrol Darurat & Mode Pemeliharaan.
     */
    public function updateEmergencyControls(UpdateEmergencyControlsRequest $request): JsonResponse
    {
        $adminId = (int) $request->user()->id;
        $updated = $this->settingService->updateEmergencyControls($request->validated(), $adminId);

        return response()->json([
            'success' => true,
            'message' => 'Kontrol darurat dan status pemeliharaan berhasil diperbarui.',
            'data' => $updated,
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
