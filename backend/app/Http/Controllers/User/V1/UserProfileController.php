<?php

namespace App\Http\Controllers\User\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\V1\UpdateProfileRequest;
use App\Http\Resources\User\V1\UserResource;
use App\Services\Auth\UserProfileService;
use Illuminate\Http\JsonResponse;

class UserProfileController extends Controller
{
    /**
     * Memperbarui profil pengguna (Nama, Tanggal Lahir, dan No WhatsApp perdana).
     */
    public function update(UpdateProfileRequest $request, UserProfileService $service): JsonResponse
    {
        $updatedUser = $service->updateProfile($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data' => new UserResource($updatedUser),
            'server_time' => now()->toISOString(),
        ], 200);
    }
}
