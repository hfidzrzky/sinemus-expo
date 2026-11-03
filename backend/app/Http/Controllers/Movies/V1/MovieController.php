<?php

namespace App\Http\Controllers\Movies\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Movies\V1\ListMoviesRequest;
use App\Http\Resources\Movies\V1\MovieDetailResource;
use App\Http\Resources\Movies\V1\MovieSummaryResource;
use App\Services\Movies\MovieCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MovieController extends Controller
{
    /**
     * Menampilkan katalog film publik terfilter dan terpaginasi.
     * GET /api/v1/movies
     */
    public function index(ListMoviesRequest $request, MovieCatalogService $catalogService): JsonResponse
    {
        $movies = $catalogService->getActiveMovies(
            genre: $request->validatedGenre(),
            search: $request->validatedSearch(),
            featured: $request->isFeatured(),
            perPage: $request->perPage()
        );

        return response()->json([
            'success' => true,
            'message' => 'Katalog film berhasil diambil.',
            'data' => MovieSummaryResource::collection($movies->items()),
            'meta' => [
                'current_page' => (int) $movies->currentPage(),
                'from' => $movies->firstItem(),
                'last_page' => (int) $movies->lastPage(),
                'per_page' => (int) $movies->perPage(),
                'to' => $movies->lastItem(),
                'total' => (int) $movies->total(),
            ],
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Menampilkan detail lengkap satu film berdasarkan slug atau ID numerik.
     * GET /api/v1/movies/{id_or_slug}
     */
    public function show(Request $request, string $id_or_slug, MovieCatalogService $catalogService): JsonResponse
    {
        $user = $request->user('sanctum');
        $movie = $catalogService->getMovieBySlugOrId($id_or_slug, $user);

        return response()->json([
            'success' => true,
            'message' => 'Detail film berhasil diambil.',
            'data' => new MovieDetailResource($movie),
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
