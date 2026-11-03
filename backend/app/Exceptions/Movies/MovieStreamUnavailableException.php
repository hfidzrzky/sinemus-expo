<?php

namespace App\Exceptions\Movies;

use Exception;
use Illuminate\Http\JsonResponse;

class MovieStreamUnavailableException extends Exception
{
    public function __construct(string $message = 'Berkas video film belum siap dialirkan. Hubungi pengelola platform.', int $code = 422)
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
        ], $this->getCode() ?: 422);
    }
}
