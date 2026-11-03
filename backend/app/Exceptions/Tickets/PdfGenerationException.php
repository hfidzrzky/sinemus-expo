<?php

namespace App\Exceptions\Tickets;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PdfGenerationException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(
        string $message = 'Gagal memproses PDF tiket. Silakan coba lagi.',
        int $code = 503,
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
            'server_time' => now()->toISOString(),
        ], 503);
    }
}
