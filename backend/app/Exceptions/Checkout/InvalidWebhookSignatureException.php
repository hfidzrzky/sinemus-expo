<?php

namespace App\Exceptions\Checkout;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvalidWebhookSignatureException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(
        string $message = 'Signature key webhook tidak valid.',
        int $code = 403,
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
            'server_time' => now()->toIso8601String(),
        ], 403);
    }
}
