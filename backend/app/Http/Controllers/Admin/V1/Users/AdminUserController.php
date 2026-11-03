<?php

namespace App\Http\Controllers\Admin\V1\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Users\AdminUserFilterRequest;
use App\Http\Requests\Admin\V1\Users\UpdateUserRoleRequest;
use App\Http\Resources\Admin\V1\Users\AdminUserDetailResource;
use App\Http\Resources\Admin\V1\Users\AdminUserListResource;
use App\Services\Admin\Users\AdminUserService;
use DomainException;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    public function __construct(
        protected AdminUserService $userService
    ) {}

    /**
     * Menampilkan daftar pengguna terdaftar dengan filter dan paginasi.
     * GET /api/v1/admin/users
     */
    public function index(AdminUserFilterRequest $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 15);
        $users = $this->userService->listUsers($request->validated(), $perPage);
        $summary = $this->userService->getUsersSummaryStats();

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengguna berhasil diambil.',
            'data' => AdminUserListResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'from' => $users->firstItem(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'to' => $users->lastItem(),
                'total' => $users->total(),
                'summary' => $summary,
            ],
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Menampilkan rincian profil pengguna dan riwayat transaksi.
     * GET /api/v1/admin/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getUserDetail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail pengguna berhasil dimuat.',
            'data' => new AdminUserDetailResource($user),
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Memperbarui peran pengguna dengan proteksi anti-lockout.
     * PUT /api/v1/admin/users/{id}/role
     */
    public function updateRole(UpdateUserRoleRequest $request, int $id): JsonResponse
    {
        try {
            $updatedUser = $this->userService->updateUserRole(
                userId: $id,
                newRole: $request->validated('role'),
                adminNotes: $request->validated('admin_notes')
            );

            return response()->json([
                'success' => true,
                'message' => 'Peran pengguna berhasil diperbarui.',
                'data' => new AdminUserDetailResource($updatedUser),
                'server_time' => now()->toIso8601String(),
            ], 200);
        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'SYSTEM_REQUIRES_ACTIVE_ADMIN',
                'server_time' => now()->toIso8601String(),
            ], 422);
        }
    }
}
