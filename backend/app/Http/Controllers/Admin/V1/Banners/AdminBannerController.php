<?php

namespace App\Http\Controllers\Admin\V1\Banners;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Banners\AdminBannerFilterRequest;
use App\Http\Requests\Admin\V1\Banners\ReorderBannerRequest;
use App\Http\Requests\Admin\V1\Banners\StoreBannerRequest;
use App\Http\Requests\Admin\V1\Banners\UpdateBannerRequest;
use App\Http\Resources\Admin\V1\Banners\AdminBannerResource;
use App\Services\Admin\Banners\AdminBannerService;
use Illuminate\Http\JsonResponse;

class AdminBannerController extends Controller
{
    public function __construct(
        protected AdminBannerService $bannerService
    ) {}

    /**
     * Menampilkan daftar banner beranda dengan filter dan paginasi.
     * GET /api/v1/admin/banners
     */
    public function index(AdminBannerFilterRequest $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 15);
        $banners = $this->bannerService->listBanners($request->validated(), $perPage);

        return response()->json([
            'success' => true,
            'message' => 'Daftar banner berhasil diambil.',
            'data' => AdminBannerResource::collection($banners->items()),
            'meta' => [
                'current_page' => $banners->currentPage(),
                'from' => $banners->firstItem(),
                'last_page' => $banners->lastPage(),
                'per_page' => $banners->perPage(),
                'to' => $banners->lastItem(),
                'total' => $banners->total(),
            ],
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Membuat slide banner baru dengan upload gambar 16:9 ke R2.
     * POST /api/v1/admin/banners
     */
    public function store(StoreBannerRequest $request): JsonResponse
    {
        $banner = $this->bannerService->createBanner(
            data: $request->validated(),
            image: $request->file('image')
        );

        return response()->json([
            'success' => true,
            'message' => 'Banner berhasil ditambahkan.',
            'data' => new AdminBannerResource($banner),
            'server_time' => now()->toIso8601String(),
        ], 201);
    }

    /**
     * Menampilkan detail satu banner untuk live-preview / edit form.
     * GET /api/v1/admin/banners/{id}
     */
    public function show(int $id): JsonResponse
    {
        $banner = $this->bannerService->getBannerById($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail banner berhasil dimuat.',
            'data' => new AdminBannerResource($banner),
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Memperbarui data banner dan mengganti file gambar di R2 jika ada file baru.
     * PUT /api/v1/admin/banners/{id} atau POST multipart (dengan _method=PUT)
     */
    public function update(UpdateBannerRequest $request, int $id): JsonResponse
    {
        $banner = $this->bannerService->getBannerById($id);
        $updatedBanner = $this->bannerService->updateBanner(
            banner: $banner,
            data: $request->validated(),
            image: $request->file('image')
        );

        return response()->json([
            'success' => true,
            'message' => 'Banner berhasil diperbarui.',
            'data' => new AdminBannerResource($updatedBanner),
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Menghapus banner dan aset gambarnya dari Cloudflare R2.
     * DELETE /api/v1/admin/banners/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $banner = $this->bannerService->getBannerById($id);
        $this->bannerService->deleteBanner($banner);

        return response()->json([
            'success' => true,
            'message' => 'Banner berhasil dihapus.',
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Memperbarui urutan prioritas banner secara massal (Drag-and-Drop Reorder).
     * POST /api/v1/admin/banners/reorder
     */
    public function reorder(ReorderBannerRequest $request): JsonResponse
    {
        $updatedCount = $this->bannerService->reorderBanners(
            orderedItems: $request->validated()['items']
        );

        return response()->json([
            'success' => true,
            'message' => "Urutan {$updatedCount} banner berhasil diperbarui.",
            'data' => [
                'updated_count' => $updatedCount,
            ],
            'server_time' => now()->toIso8601String(),
        ], 200);
    }
}
