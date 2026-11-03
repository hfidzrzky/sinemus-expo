<?php

namespace App\Http\Controllers\Movies\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Movies\V1\MovieStreamAccessResource;
use App\Services\Movies\MovieStreamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MovieStreamController extends Controller
{
    /**
     * Menerbitkan RS256 JWT Signed Token Cloudflare Stream HLS (.m3u8) untuk hak sewa aktif.
     * GET /api/v1/movies/{id}/stream
     */
    public function getStreamAccess(Request $request, int|string $id, MovieStreamService $streamService): JsonResponse
    {
        $session = $streamService->getStreamSession($request->user(), $id);

        return response()->json([
            'success' => true,
            'message' => 'Sesi pemutaran film berhasil diverifikasi.',
            'data' => new MovieStreamAccessResource($session),
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
