<?php

namespace App\Exceptions\Auth;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PhoneLockedException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(string $message = 'Nomor WhatsApp sudah terkunci permanen dan tidak dapat diubah', int $code = 422, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception into an HTTP response.
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'server_time' => now()->toISOString(),
        ], 422);
    }
}
