<?php

namespace App\Http\Controllers\Admin\V1\Movies;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Movies\AdminMovieFilterRequest;
use App\Http\Requests\Admin\V1\Movies\StoreMovieRequest;
use App\Http\Requests\Admin\V1\Movies\UpdateMovieRequest;
use App\Http\Resources\Admin\V1\Movies\AdminMovieDetailResource;
use App\Http\Resources\Admin\V1\Movies\AdminMovieResource;
use App\Services\Admin\Movies\AdminMovieService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMovieController extends Controller
{
    /**
     * Menampilkan daftar film terpaginasi untuk dropdown dan manajemen Super Admin.
     * GET /api/v1/admin/movies
     */
    public function index(AdminMovieFilterRequest $request, AdminMovieService $service): JsonResponse
    {
        $movies = $service->getAdminMovies(
            search: $request->input('search'),
            genre: $request->input('genre'),
            isPublished: $request->has('is_published') ? $request->boolean('is_published') : null,
            perPage: (int) $request->input('per_page', 50)
        );

        return response()->json([
            'success' => true,
            'message' => 'Daftar film berhasil diambil.',
            'data' => AdminMovieResource::collection($movies->items()),
            'meta' => [
                'current_page' => $movies->currentPage(),
                'from' => $movies->firstItem(),
                'last_page' => $movies->lastPage(),
                'per_page' => $movies->perPage(),
                'to' => $movies->lastItem(),
                'total' => $movies->total(),
            ],
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Menambahkan film baru ke katalog VoD.
     * POST /api/v1/admin/movies
     */
    public function store(StoreMovieRequest $request, AdminMovieService $service): JsonResponse
    {
        $movie = $service->createMovie($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Film berhasil ditambahkan ke katalog VoD.',
            'data' => new AdminMovieDetailResource($movie),
            'server_time' => now()->toIso8601String(),
        ], 201);
    }

    /**
     * Mengambil detail komprehensif film untuk 4-tab editor admin.
     * GET /api/v1/admin/movies/{id}
     */
    public function show(int $id, AdminMovieService $service): JsonResponse
    {
        $movie = $service->getMovieById($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail film berhasil diambil.',
            'data' => new AdminMovieDetailResource($movie),
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Memperbarui informasi film di katalog VoD.
     * PUT /api/v1/admin/movies/{id}
     */
    public function update(UpdateMovieRequest $request, int $id, AdminMovieService $service): JsonResponse
    {
        $movie = $service->updateMovie($id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Data film berhasil diperbarui.',
            'data' => new AdminMovieDetailResource($movie),
            'server_time' => now()->toIso8601String(),
        ], 200);
    }

    /**
     * Menghapus film dari katalog dengan proteksi integritas transaksi penonton.
     * DELETE /api/v1/admin/movies/{id}
     */
    public function destroy(Request $request, int $id, AdminMovieService $service): JsonResponse
    {
        try {
            $force = $request->boolean('force', false);
            $service->deleteMovie($id, $force);

            return response()->json([
                'success' => true,
                'message' => 'Film berhasil dihapus dari katalog.',
                'server_time' => now()->toIso8601String(),
            ], 200);
        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'server_time' => now()->toIso8601String(),
            ], 409);
        }
    }
}
