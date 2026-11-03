<?php

namespace App\Http\Controllers\Admin\V1\Vouchers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Vouchers\AdminVoucherFilterRequest;
use App\Http\Requests\Admin\V1\Vouchers\StoreVoucherRequest;
use App\Http\Requests\Admin\V1\Vouchers\UpdateVoucherRequest;
use App\Http\Resources\Admin\V1\Vouchers\AdminVoucherResource;
use App\Services\Admin\Vouchers\AdminVoucherService;
use Illuminate\Http\JsonResponse;

class AdminVoucherController extends Controller
{
    public function __construct(
        protected AdminVoucherService $voucherService
    ) {}

    /**
     * Menampilkan daftar voucher dengan filter dan paginasi.
     * GET /api/v1/admin/vouchers
     */
    public function index(AdminVoucherFilterRequest $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 15);
        $vouchers = $this->voucherService->listVouchers($request->validated(), $perPage);

        return response()->json([
            'success' => true,
            'message' => 'Daftar voucher berhasil diambil.',
            'data' => AdminVoucherResource::collection($vouchers->items()),
            'meta' => [
                'current_page' => $vouchers->currentPage(),
                'from' => $vouchers->firstItem(),
                'last_page' => $vouchers->lastPage(),
                'per_page' => $vouchers->perPage(),
                'to' => $vouchers->lastItem(),
                'total' => $vouchers->total(),
            ],
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Membuat voucher promo baru.
     * POST /api/v1/admin/vouchers
     */
    public function store(StoreVoucherRequest $request): JsonResponse
    {
        $voucher = $this->voucherService->createVoucher($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Voucher promo berhasil dibuat.',
            'data' => new AdminVoucherResource($voucher),
            'server_time' => now()->toIso8601String(),
        ], 201);
    }

    /**
     * Menampilkan detail satu voucher.
     * GET /api/v1/admin/vouchers/{id}
     */
    public function show(int $id): JsonResponse
    {
        $voucher = $this->voucherService->getVoucherById($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail voucher berhasil dimuat.',
            'data' => new AdminVoucherResource($voucher),
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Memperbarui konfigurasi voucher.
     * PUT /api/v1/admin/vouchers/{id}
     */
    public function update(UpdateVoucherRequest $request, int $id): JsonResponse
    {
        $voucher = $this->voucherService->getVoucherById($id);
        $updatedVoucher = $this->voucherService->updateVoucher($voucher, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi voucher berhasil diperbarui.',
            'data' => new AdminVoucherResource($updatedVoucher),
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Menghapus voucher atau mendeaktivasi jika telah memiliki riwayat pemakaian.
     * DELETE /api/v1/admin/vouchers/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $voucher = $this->voucherService->getVoucherById($id);
        $result = $this->voucherService->deleteVoucher($voucher);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'voucher_id' => $id,
                'deleted' => $result['deleted'],
                'deactivated' => $result['deactivated'],
            ],
            'server_time' => now()->toIso8601String(),
        ]);
    }
}
