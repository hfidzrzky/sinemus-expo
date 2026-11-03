<?php

namespace App\Exceptions\Movies;

use Exception;
use Illuminate\Http\JsonResponse;

class MovieStreamSigningFailedException extends Exception
{
    public function __construct(string $message = 'Gagal menerbitkan sesi pemutaran aman Cloudflare Stream. Periksa konfigurasi kunci kriptografi.', int $code = 500)
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
        ], $this->getCode() ?: 500);
    }
}
