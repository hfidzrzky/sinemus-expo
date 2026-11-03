<?php

namespace App\Exceptions\Movies;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MovieNotRentableException extends Exception
{
    /**
     * Inisialisasi exception film tidak dapat disewa (misal: film gratis / unpublish).
     */
    public function __construct(
        string $message = 'Film ini tidak dapat disewa.',
        int $code = 422,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render exception ke respons amplop JSON standar HTTP 422 Unprocessable Entity.
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error_code' => 'MOVIE_NOT_RENTABLE',
            'data' => null,
            'server_time' => now()->toISOString(),
        ], 422);
    }
}
