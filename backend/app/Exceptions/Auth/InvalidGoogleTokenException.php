<?php

namespace App\Exceptions\Auth;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvalidGoogleTokenException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(string $message = 'Token autentikasi Google tidak valid atau telah kedaluwarsa', int $code = 401, ?Exception $previous = null)
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
        ], 401);
    }
}
