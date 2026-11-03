<?php

namespace App\Exceptions\Movies;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MovieRentalFrozenException extends Exception
{
    /**
     * Inisialisasi exception pembekuan sewa film darurat (Emergency Freeze Guard).
     */
    public function __construct(
        string $message = 'Transaksi sewa film digital sedang ditangguhkan sementara oleh pengelola.',
        int $code = 503,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render exception ke respons amplop JSON standar HTTP 503 Service Unavailable.
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error_code' => 'VOD_RENTALS_FROZEN',
            'data' => null,
            'server_time' => now()->toISOString(),
        ], 503);
    }
}
