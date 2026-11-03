<?php

namespace App\Http\Controllers\Auth\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\V1\GoogleAuthRequest;
use App\Http\Resources\User\V1\UserResource;
use App\Services\Auth\GoogleAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * Pintu gerbang login/registrasi pengguna dengan Google OAuth2 ID Token.
     */
    public function google(GoogleAuthRequest $request, GoogleAuthService $service): JsonResponse
    {
        $result = $service->authenticate($request->validated('id_token'));

        return response()->json([
            'success' => true,
            'message' => 'Autentikasi berhasil',
            'data' => [
                'token' => $result['token'],
                'is_new_user' => $result['is_new_user'],
                'user' => new UserResource($result['user']),
            ],
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Mengambil profil pengguna yang sedang login saat ini.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diambil',
            'data' => new UserResource($request->user()),
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Mencabut token Sanctum yang sedang aktif (logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil keluar dari sesi akun',
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
