<?php

namespace App\Exceptions\Events;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventNotFoundException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(string $message = 'Event screening tidak ditemukan atau sudah tidak aktif.', int $code = 404, ?Exception $previous = null)
    {
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
            'server_time' => now()->toISOString(),
        ], 404);
    }
}
