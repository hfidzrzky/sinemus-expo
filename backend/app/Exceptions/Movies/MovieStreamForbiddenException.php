<?php

namespace App\Exceptions\Movies;

use Exception;
use Illuminate\Http\JsonResponse;

class MovieStreamForbiddenException extends Exception
{
    public function __construct(string $message = 'Anda belum menyewa film ini atau masa sewa telah berakhir. Silakan lakukan sewa untuk menonton.', int $code = 403)
    {
        parent::__construct($message, $code);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'data' => null,
            'server_time' => now()->toISOString(),
        ], $this->getCode() ?: 403);
    }
}
