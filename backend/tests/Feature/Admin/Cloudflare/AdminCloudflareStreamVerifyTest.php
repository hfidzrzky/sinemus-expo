<?php

namespace Tests\Feature\Admin\Cloudflare;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdminCloudflareStreamVerifyTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Sinemus',
            'email' => 'admin@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081100000001',
            'is_phone_locked' => true,
        ]);

        $this->customer = User::factory()->create([
            'name' => 'Dimas Setiawan',
            'email' => 'dimas@example.com',
            'role' => 'customer',
            'phone_number' => '081288492011',
            'is_phone_locked' => true,
        ]);

        Config::set('services.cloudflare.account_id', 'mock-cf-account-id');
        Config::set('services.cloudflare.stream_api_token', 'mock-cf-token');
        Cache::flush();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->postJson('/api/v1/admin/cloudflare/stream/verify', [
            'uid' => 'e39b7a1f8c424df39c14ad539281a1bb',
        ]);

        $response->assertStatus(401);
    }

    public function test_customer_role_is_forbidden(): void
    {
        $this->actingAs($this->customer);

        $response = $this->postJson('/api/v1/admin/cloudflare/stream/verify', [
            'uid' => 'e39b7a1f8c424df39c14ad539281a1bb',
        ]);

        $response->assertStatus(403);
    }

    public function test_invalid_uid_format_fails_validation(): void
    {
        $this->actingAs($this->superAdmin);

        // Missing UID
        $this->postJson('/api/v1/admin/cloudflare/stream/verify', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['uid']);

        // Less than 32 characters
        $this->postJson('/api/v1/admin/cloudflare/stream/verify', ['uid' => 'e39b7a1f'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['uid']);

        // Non-hex characters (SSRF / path injection attempt)
        $this->postJson('/api/v1/admin/cloudflare/stream/verify', ['uid' => 'e39b7a1f8c424df39c14ad539281zzzz'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['uid']);

        $this->postJson('/api/v1/admin/cloudflare/stream/verify', ['uid' => '../admin/secret/token1234567890'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['uid']);
    }

    public function test_super_admin_successfully_verifies_cloudflare_stream_video(): void
    {
        $this->actingAs($this->superAdmin);

        $uid = 'e39b7a1f8c424df39c14ad539281a1bb';

        Http::fake([
            "https://api.cloudflare.com/client/v4/accounts/mock-cf-account-id/stream/{$uid}" => Http::response([
                'success' => true,
                'result' => [
                    'uid' => $uid,
                    'status' => [
                        'state' => 'ready',
                    ],
                    'readyToStream' => true,
                    'duration' => 7240.5,
                    'thumbnail' => "https://videodelivery.net/{$uid}/thumbnails/thumbnail.jpg",
                    'input' => [
                        'width' => 1920,
                        'height' => 1080,
                    ],
                    'size' => 104857600,
                    'created' => '2026-10-07T12:00:00Z',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/admin/cloudflare/stream/verify', [
            'uid' => $uid,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Video Cloudflare Stream berhasil diverifikasi.',
                'data' => [
                    'uid' => $uid,
                    'status' => 'ready',
                    'is_ready' => true,
                    'duration_seconds' => 7240.5,
                    'formatted_duration' => '2j 0m 41d',
                    'thumbnail_url' => "https://videodelivery.net/{$uid}/thumbnails/thumbnail.jpg",
                    'preview_iframe_url' => "https://iframe.videodelivery.net/{$uid}",
                    'meta' => [
                        'width' => 1920,
                        'height' => 1080,
                        'size_bytes' => 104857600,
                    ],
                ],
            ]);
    }

    public function test_non_existent_uid_returns_friendly_404_response(): void
    {
        $this->actingAs($this->superAdmin);

        $uid = 'ffffffffffffffffffffffffffffffff';

        Http::fake([
            "https://api.cloudflare.com/client/v4/accounts/mock-cf-account-id/stream/{$uid}" => Http::response([
                'success' => false,
                'errors' => [
                    ['code' => 10005, 'message' => 'not found'],
                ],
            ], 404),
        ]);

        $response = $this->postJson('/api/v1/admin/cloudflare/stream/verify', [
            'uid' => $uid,
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'data' => null,
            ]);
    }

    public function test_video_metadata_is_cached(): void
    {
        $this->actingAs($this->superAdmin);

        $uid = 'e39b7a1f8c424df39c14ad539281a1bb';

        Http::fake([
            "https://api.cloudflare.com/client/v4/accounts/mock-cf-account-id/stream/{$uid}" => Http::response([
                'success' => true,
                'result' => [
                    'uid' => $uid,
                    'status' => ['state' => 'ready'],
                    'readyToStream' => true,
                    'duration' => 120.0,
                ],
            ], 200),
        ]);

        // First call hits HTTP
        $this->postJson('/api/v1/admin/cloudflare/stream/verify', ['uid' => $uid])->assertStatus(200);

        // Second call should hit Cache, not Cloudflare API
        $this->postJson('/api/v1/admin/cloudflare/stream/verify', ['uid' => $uid])->assertStatus(200);

        Http::assertSentCount(1);
    }
}
