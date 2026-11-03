<?php

namespace App\Exceptions\Booking;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeatUnavailableException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(
        string $message = 'Satu atau lebih kursi yang dipilih sudah tidak tersedia atau sedang dikunci.',
        int $code = 409,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception into a standard JSON envelope response.
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error_code' => 'SEAT_ALREADY_LOCKED',
            'server_time' => now()->toISOString(),
        ], 409);
    }
}
