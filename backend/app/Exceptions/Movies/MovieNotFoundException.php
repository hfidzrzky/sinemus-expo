<?php

namespace App\Exceptions\Movies;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MovieNotFoundException extends Exception
{
    /**
     * Inisialisasi exception film tidak ditemukan.
     */
    public function __construct(
        string $message = 'Film tidak ditemukan atau belum dipublikasikan.',
        int $code = 404,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render exception ke respons amplop JSON standar (Anti-Leak).
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error_code' => 'MOVIE_NOT_FOUND',
            'data' => null,
            'server_time' => now()->toISOString(),
        ], 404);
    }
}
