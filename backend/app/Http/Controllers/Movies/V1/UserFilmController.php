<?php

namespace App\Http\Controllers\Movies\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Movies\V1\MyFilmRentalResource;
use App\Services\Movies\UserFilmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserFilmController extends Controller
{
    /**
     * Mengambil daftar sewa film aktif milik pengguna terautentikasi (Anti-IDOR).
     * GET /api/v1/user/films
     */
    public function index(Request $request, UserFilmService $userFilmService): JsonResponse
    {
        $rentals = $userFilmService->getActiveFilms($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Daftar sewa film aktif berhasil diambil.',
            'data' => MyFilmRentalResource::collection($rentals),
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
