<?php

namespace App\Exceptions\Movies;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MovieAlreadyRentedException extends Exception
{
    /**
     * Inisialisasi exception sewa ganda (Anti-Double-Rent).
     */
    public function __construct(
        string $message = 'Anda masih memiliki hak sewa aktif untuk film ini.',
        int $code = 409,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render exception ke respons amplop JSON standar HTTP 409 Conflict.
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error_code' => 'MOVIE_ALREADY_RENTED',
            'data' => null,
            'server_time' => now()->toISOString(),
        ], 409);
    }
}
