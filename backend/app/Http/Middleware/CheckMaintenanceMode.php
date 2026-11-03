<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\Admin\Settings\SystemSettingService;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    public function __construct(
        protected SystemSettingService $settingService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Rute administrasi, otentikasi admin, dan endpoint settings publik selalu dibypass
        if (
            $request->is('api/v1/admin/*') ||
            $request->is('api/v1/auth/*') ||
            $request->is('api/v1/public/settings')
        ) {
            return $next($request);
        }

        $isMaintenance = $this->settingService->isMaintenanceMode();

        if ($isMaintenance) {
            $user = $request->user();

            // Pada rute publik tanpa middleware auth:sanctum, periksa bearer token secara aman
            if ((! $user || $user->role !== 'super_admin') && $request->bearerToken()) {
                try {
                    $tokenModel = PersonalAccessToken::findToken($request->bearerToken());
                    if ($tokenModel && (! $tokenModel->expires_at || $tokenModel->expires_at->isFuture())) {
                        $tokenable = $tokenModel->tokenable;
                        if ($tokenable instanceof User) {
                            $user = $tokenable;
                            $request->setUserResolver(fn () => $user);
                        }
                    }
                } catch (\Throwable) {
                    $user = null;
                }
            }

            // Bypass jika pengguna login sebagai super_admin
            if ($user && $user->role === 'super_admin') {
                return $next($request);
            }

            $message = $this->settingService->getMaintenanceMessage();

            return response()->json([
                'success' => false,
                'message' => $message,
                'error_code' => 'SYSTEM_MAINTENANCE_ACTIVE',
                'data' => [
                    'is_maintenance_mode' => true,
                    'maintenance_message' => $message,
                ],
                'server_time' => now()->toISOString(),
            ], 503);
        }

        return $next($request);
    }
}
