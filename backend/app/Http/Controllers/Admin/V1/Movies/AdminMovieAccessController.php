<?php

namespace App\Http\Controllers\Admin\V1\Movies;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Movies\GrantMovieAccessRequest;
use App\Http\Requests\Admin\V1\Movies\RevokeMovieAccessRequest;
use App\Http\Resources\Admin\V1\Movies\AdminMovieAccessResource;
use App\Services\Admin\Movies\AdminMovieAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMovieAccessController extends Controller
{
    /**
     * Menampilkan daftar hak akses sewa film penonton dengan filter dan paginasi.
     * GET /api/v1/admin/movie-access
     */
    public function index(Request $request, AdminMovieAccessService $service): JsonResponse
    {
        $userId = $request->filled('user_id') ? (int) $request->input('user_id') : null;
        $movieId = $request->filled('movie_id') ? (int) $request->input('movie_id') : null;
        $status = $request->input('status');
        $perPage = min(100, max(1, (int) $request->input('per_page', 20)));

        $accessList = $service->getAccessList(
            userId: $userId,
            movieId: $movieId,
            status: $status,
            perPage: $perPage
        );

        return response()->json([
            'success' => true,
            'message' => 'Daftar hak akses film berhasil diambil.',
            'data' => AdminMovieAccessResource::collection($accessList->items()),
            'meta' => [
                'current_page' => $accessList->currentPage(),
                'from' => $accessList->firstItem(),
                'last_page' => $accessList->lastPage(),
                'per_page' => $accessList->perPage(),
                'to' => $accessList->lastItem(),
                'total' => $accessList->total(),
            ],
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Memberikan hak sewa/tonton film langsung tanpa transaksi finansial (promo/reviewer).
     * Sinkron 100% dengan endpoint grantMovieAccess di contracts/admin.contract.json.
     * POST /api/v1/admin/movie-access/grant
     */
    public function grant(GrantMovieAccessRequest $request, AdminMovieAccessService $service): JsonResponse
    {
        $access = $service->grantAccess(
            userId: (int) $request->input('user_id'),
            movieId: (int) $request->input('movie_id'),
            durationHours: (int) $request->input('duration_hours', 48),
            notes: $request->input('admin_notes')
        );

        return response()->json([
            'success' => true,
            'message' => 'Hak akses sewa film berhasil diberikan kepada pengguna.',
            'data' => [
                'access_id' => (int) $access->id,
                'user_email' => (string) ($access->user?->email ?? '-'),
                'movie_title' => (string) ($access->movie?->title ?? '-'),
                'rental_expires_at' => $access->rental_expires_at?->toIso8601String(),
                'access_status' => (string) $access->access_status,
            ],
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Mencabut hak sewa/tonton film dari pengguna.
     * Sinkron 100% dengan endpoint revokeMovieAccess di contracts/admin.contract.json.
     * POST /api/v1/admin/movie-access/{id}/revoke
     */
    public function revoke(RevokeMovieAccessRequest $request, int $id, AdminMovieAccessService $service): JsonResponse
    {
        $service->revokeAccess(
            accessId: $id,
            reason: (string) $request->input('revoke_reason'),
            notes: $request->input('admin_notes')
        );

        return response()->json([
            'success' => true,
            'message' => 'Hak akses sewa film berhasil dicabut.',
            'server_time' => now()->toIso8601String(),
        ], 200);
    }
}
