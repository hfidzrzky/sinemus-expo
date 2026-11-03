<?php

namespace App\Services\Auth;

use App\Exceptions\Auth\InvalidGoogleTokenException;
use App\Models\User;
use Google\Auth\Cache\FileSystemCacheItemPool;
use Google_Client;
use Illuminate\Support\Facades\DB;
use Throwable;

class GoogleAuthService
{
    protected Google_Client $googleClient;

    /**
     * Create a new GoogleAuthService instance.
     * Menginjeksi Google_Client untuk fleksibilitas testing & inversion of control.
     */
    public function __construct(?Google_Client $googleClient = null)
    {
        $clientId = config('services.google.client_id');
        if (empty($clientId) && app()->environment('production')) {
            throw new \RuntimeException('Google OAuth Client ID belum dikonfigurasi pada server (Fail-Closed).');
        }

        if ($googleClient !== null) {
            $this->googleClient = $googleClient;
        } else {
            $client = new Google_Client;
            if (! empty($clientId)) {
                $client->setClientId($clientId);
            }

            // Cache sertifikat publik Google JWKS secara lokal di storage framework
            // Ini memangkas latensi verifikasi token dari ~500ms-1500ms ke ~2-5ms (tanpa external HTTP roundtrip tiap request)
            $cachePath = storage_path('framework/cache/data/google-auth');
            if (! is_dir($cachePath)) {
                @mkdir($cachePath, 0755, true);
            }
            $client->setCache(new FileSystemCacheItemPool($cachePath));

            $this->googleClient = $client;
        }
    }

    /**
     * Autentikasi pengguna menggunakan Google OAuth2 ID Token.
     *
     * @return array{token: string, is_new_user: bool, user: User}
     *
     * @throws InvalidGoogleTokenException
     */
    public function authenticate(#[\SensitiveParameter] string $idToken): array
    {
        if (trim($idToken) === '') {
            throw new InvalidGoogleTokenException('Token autentikasi Google tidak boleh kosong');
        }

        $expectedClientId = config('services.google.client_id');

        try {
            $payload = $this->googleClient->verifyIdToken($idToken);
        } catch (Throwable $e) {
            throw new InvalidGoogleTokenException(
                message: 'Token autentikasi Google tidak valid atau telah kedaluwarsa',
                code: 401,
                previous: $e
            );
        }

        if (! $payload || ! is_array($payload) || empty($payload['sub']) || empty($payload['email'])) {
            throw new InvalidGoogleTokenException('Token autentikasi Google tidak valid atau telah kedaluwarsa');
        }

        // Guard: Verifikasi bahwa audience (aud) mutlak cocok dengan Client ID aplikasi jika dikonfigurasi
        if (! empty($expectedClientId) && (! isset($payload['aud']) || $payload['aud'] !== $expectedClientId)) {
            throw new InvalidGoogleTokenException('Token audience Google tidak valid untuk platform ini');
        }

        // Guard: Verifikasi bahwa email pengguna telah diverifikasi oleh Google
        $isEmailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if (! $isEmailVerified) {
            throw new InvalidGoogleTokenException('Email akun Google belum diverifikasi');
        }

        $googleId = (string) $payload['sub'];
        $email = strtolower(trim((string) $payload['email']));
        $name = trim((string) ($payload['name'] ?? ''));
        $avatarUrl = $payload['picture'] ?? null;

        return DB::transaction(function () use ($googleId, $email, $name, $avatarUrl) {
            $user = User::where('google_id', $googleId)->lockForUpdate()->first();
            $isNewUser = false;

            if (! $user) {
                // Cari apakah sudah ada user dengan email yang sama dengan pessimistic lock
                $user = User::where('email', $email)->lockForUpdate()->first();

                if ($user) {
                    // Akun sudah terdaftar sebelumnya: link google_id dan perbarui avatar
                    $user->update([
                        'google_id' => $googleId,
                        'avatar_url' => $avatarUrl ?? $user->avatar_url,
                        'last_login_at' => now(),
                    ]);
                } else {
                    // Pendaftaran pengguna baru perdana secara eksplisit
                    $user = new User([
                        'google_id' => $googleId,
                        'email' => $email,
                        'name' => $name !== '' ? $name : 'User '.substr($googleId, -4),
                        'avatar_url' => $avatarUrl,
                        'last_login_at' => now(),
                    ]);
                    $user->role = 'customer';
                    $user->is_phone_locked = false;
                    $user->save();

                    $isNewUser = true;
                }
            } else {
                // Pengguna lama login kembali
                $user->update([
                    'name' => $name !== '' ? $name : $user->name,
                    'avatar_url' => $avatarUrl ?? $user->avatar_url,
                    'last_login_at' => now(),
                ]);
            }

            // Terbitkan token Sanctum
            $token = $user->createToken('auth_token')->plainTextToken;

            return [
                'token' => $token,
                'is_new_user' => $isNewUser,
                'user' => $user->fresh(),
            ];
        });
    }
}
