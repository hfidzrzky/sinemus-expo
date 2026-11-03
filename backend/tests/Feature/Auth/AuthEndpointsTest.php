<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Google_Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class AuthEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.google.client_id' => 'endpoint-client-id.apps.googleusercontent.com']);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_google_auth_endpoint_returns_token_and_user(): void
    {
        $mockClient = Mockery::mock(Google_Client::class);
        $mockClient->shouldReceive('verifyIdToken')
            ->once()
            ->with('valid-token-jwt')
            ->andReturn([
                'sub' => 'google-sub-endpoint-1',
                'aud' => 'endpoint-client-id.apps.googleusercontent.com',
                'email' => 'endpointuser@sinemus.id',
                'name' => 'Endpoint Tester',
                'picture' => 'https://endpoint.png',
                'email_verified' => true,
            ]);

        $this->app->instance(Google_Client::class, $mockClient);

        $response = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'valid-token-jwt',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Autentikasi berhasil',
                'data' => [
                    'is_new_user' => true,
                    'user' => [
                        'email' => 'endpointuser@sinemus.id',
                        'name' => 'Endpoint Tester',
                        'role' => 'customer',
                        'is_phone_locked' => false,
                    ],
                ],
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'is_new_user',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'avatar_url',
                        'phone_number',
                        'is_phone_locked',
                        'birth_date',
                        'is_profile_completed',
                        'created_at',
                    ],
                ],
                'server_time',
            ]);
    }

    public function test_google_auth_endpoint_validates_required_id_token(): void
    {
        $response = $this->postJson('/api/v1/auth/google', []);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => ['id_token'],
                'server_time',
            ]);
    }

    public function test_current_user_endpoint_returns_authenticated_user(): void
    {
        $user = User::create([
            'google_id' => 'gid-me-1',
            'email' => 'me@sinemus.id',
            'name' => 'Current User',
            'role' => 'customer',
            'is_phone_locked' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'email' => 'me@sinemus.id',
                    'name' => 'Current User',
                    'role' => 'customer',
                ],
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'name',
                    'email',
                    'role',
                    'is_phone_locked',
                    'is_profile_completed',
                    'created_at',
                ],
                'server_time',
            ]);
    }

    public function test_update_profile_endpoint_saves_phone_number_and_locks_it(): void
    {
        $user = User::forceCreate([
            'google_id' => 'gid-up-1',
            'email' => 'update@sinemus.id',
            'name' => 'Original User',
            'role' => 'customer',
            'phone_number' => null,
            'is_phone_locked' => false,
        ]);

        // Kirim format +628xx untuk memastikan normalisasi otomatis menjadi 08xx
        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/user/profile', [
            'name' => 'Updated User',
            'phone_number' => '+6281234567890',
            'birth_date' => '1998-05-20',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Profil berhasil diperbarui',
                'data' => [
                    'name' => 'Updated User',
                    'phone_number' => '081234567890',
                    'is_phone_locked' => true,
                    'birth_date' => '1998-05-20',
                    'is_profile_completed' => true,
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'phone_number' => '081234567890',
            'is_phone_locked' => 1,
        ]);
    }

    public function test_update_profile_rejects_duplicate_phone_number_belonging_to_another_user(): void
    {
        // User pertama sudah mengunci nomor 081234567890
        User::forceCreate([
            'google_id' => 'gid-up-existing',
            'email' => 'existing@sinemus.id',
            'name' => 'Existing Phone Owner',
            'role' => 'customer',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        // User kedua mencoba mendaftarkan nomor yang sama (format +628)
        $userB = User::forceCreate([
            'google_id' => 'gid-up-new',
            'email' => 'newuser@sinemus.id',
            'name' => 'New User',
            'role' => 'customer',
            'phone_number' => null,
            'is_phone_locked' => false,
        ]);

        $response = $this->actingAs($userB, 'sanctum')->putJson('/api/v1/user/profile', [
            'phone_number' => '+6281234567890',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => ['phone_number'],
                'server_time',
            ]);
    }

    public function test_update_profile_rejects_updating_locked_phone_number(): void
    {
        $user = User::forceCreate([
            'google_id' => 'gid-up-2',
            'email' => 'locked@sinemus.id',
            'name' => 'Locked User',
            'role' => 'customer',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/user/profile', [
            'phone_number' => '089999999999',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Nomor WhatsApp sudah terkunci permanen dan tidak dapat diubah',
            ]);
    }

    public function test_update_profile_validates_indonesian_phone_format(): void
    {
        $user = User::forceCreate([
            'google_id' => 'gid-up-3',
            'email' => 'invalidphone@sinemus.id',
            'name' => 'Invalid Phone User',
            'role' => 'customer',
            'is_phone_locked' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/user/profile', [
            'phone_number' => '021123456', // Bukan nomor seluler 08xx / +628xx
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => ['phone_number'],
                'server_time',
            ]);
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::forceCreate([
            'google_id' => 'gid-logout-1',
            'email' => 'logout@sinemus.id',
            'name' => 'Logout User',
            'role' => 'customer',
        ]);

        $token = $user->createToken('test_auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Berhasil keluar dari sesi akun',
            ]);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_unauthenticated_request_to_protected_route_returns_401(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'server_time',
            ]);
    }

    public function test_google_auth_endpoint_rejects_mismatched_audience(): void
    {
        $mockClient = Mockery::mock(Google_Client::class);
        $mockClient->shouldReceive('verifyIdToken')
            ->once()
            ->with('mismatched-token')
            ->andReturn([
                'sub' => 'google-sub-mismatch-1',
                'aud' => 'different-client-id.apps.googleusercontent.com',
                'email' => 'hacker@sinemus.id',
                'name' => 'Hacker User',
                'email_verified' => true,
            ]);

        $this->app->instance(Google_Client::class, $mockClient);

        $response = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'mismatched-token',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Token audience Google tidak valid untuk platform ini',
            ]);
    }

    public function test_expired_sanctum_token_is_rejected_with_401(): void
    {
        $user = User::factory()->create([
            'role' => 'customer',
        ]);

        $tokenResult = $user->createToken('auth_token');
        $plainToken = $tokenResult->plainTextToken;

        // Simulasikan token yang dibuat 31 hari yang lalu (> 30 hari / 43200 menit)
        $tokenModel = $tokenResult->accessToken;
        $tokenModel->created_at = now()->subDays(31);
        $tokenModel->save();

        $response = $this->withHeader('Authorization', "Bearer {$plainToken}")
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }
}
