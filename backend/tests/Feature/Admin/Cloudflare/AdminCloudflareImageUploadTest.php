<?php

namespace Tests\Feature\Admin\Cloudflare;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdminCloudflareImageUploadTest extends TestCase
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
        Config::set('services.cloudflare.images_api_token', 'mock-images-token');
        Config::set('services.cloudflare.images_account_hash', 'mock-hash-123');
    }

    public function test_unauthenticated_user_cannot_access_images_endpoints(): void
    {
        $this->postJson('/api/v1/admin/cloudflare/images/direct-upload')->assertStatus(401);
        $this->deleteJson('/api/v1/admin/cloudflare/images/test-id')->assertStatus(401);
    }

    public function test_customer_cannot_access_images_endpoints(): void
    {
        $this->actingAs($this->customer);

        $this->postJson('/api/v1/admin/cloudflare/images/direct-upload')->assertStatus(403);
        $this->deleteJson('/api/v1/admin/cloudflare/images/test-id')->assertStatus(403);
    }

    public function test_super_admin_generates_direct_upload_url_successfully(): void
    {
        $this->actingAs($this->superAdmin);

        Http::fake([
            'https://api.cloudflare.com/client/v4/accounts/mock-cf-account-id/images/v2/direct_upload' => Http::response([
                'success' => true,
                'result' => [
                    'id' => 'img-uuid-849201',
                    'uploadURL' => 'https://upload.imagedelivery.net/upload-session-xyz',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/admin/cloudflare/images/direct-upload', [
            'asset_type' => 'event_poster',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Sesi unggah Cloudflare Images berhasil diterbitkan.',
                'data' => [
                    'image_id' => 'img-uuid-849201',
                    'upload_url' => 'https://upload.imagedelivery.net/upload-session-xyz',
                    'delivery_url' => 'https://imagedelivery.net/mock-hash-123/img-uuid-849201/public',
                ],
            ]);

        // Uji pula untuk tipe aset movie_look_film
        $lookFilmResponse = $this->postJson('/api/v1/admin/cloudflare/images/direct-upload', [
            'asset_type' => 'movie_look_film',
        ]);

        $lookFilmResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'image_id' => 'img-uuid-849201',
                ],
            ]);
    }

    public function test_super_admin_deletes_image_successfully(): void
    {
        $this->actingAs($this->superAdmin);

        $imageId = 'img-uuid-849201';

        Http::fake([
            "https://api.cloudflare.com/client/v4/accounts/mock-cf-account-id/images/v1/{$imageId}" => Http::response([
                'success' => true,
                'result' => [],
            ], 200),
        ]);

        $response = $this->deleteJson("/api/v1/admin/cloudflare/images/{$imageId}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'image_id' => $imageId,
                ],
            ]);
    }
}
