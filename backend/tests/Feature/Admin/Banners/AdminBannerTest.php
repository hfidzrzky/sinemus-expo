<?php

namespace Tests\Feature\Admin\Banners;

use App\Models\Banner;
use App\Models\Event;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminBannerTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $customer;

    protected Movie $sampleMovie;

    protected Event $sampleEvent;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('r2');

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Banner',
            'email' => 'admin.banner@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081100000005',
            'is_phone_locked' => true,
        ]);

        $this->customer = User::factory()->create([
            'name' => 'Customer Biasa',
            'email' => 'customer.banner@example.com',
            'role' => 'customer',
            'phone_number' => '081200000006',
            'is_phone_locked' => true,
        ]);

        $this->sampleMovie = Movie::create([
            'slug' => 'laut-bercerita',
            'title' => 'Laut Bercerita',
            'synopsis' => 'Film adaptasi novel Laut Bercerita karya Leila S. Chudori.',
            'poster_path' => 'movies/posters/laut.jpg',
            'backdrop_path' => 'movies/backdrops/laut.jpg',
            'director' => 'Pritagita Arianegara',
            'cast' => ['Reza Rahadian', 'Ayushita'],
            'genre' => 'Drama',
            'age_rating' => '17+',
            'access_model' => 'rental',
            'duration_minutes' => 110,
            'price' => 25000,
            'rental_duration_hours' => 48,
            'cloudflare_video_uid' => 'stream-cf-laut-bercerita-uid',
            'is_featured' => true,
            'release_year' => 2024,
            'is_published' => true,
        ]);

        $this->sampleEvent = Event::create([
            'slug' => 'cinta-dan-sejarah-xxi',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'cinema_partner' => 'Cinema XXI',
            'target_screening_month' => 'November 2026',
            'title' => 'Cinta dan Sejarah (CDS) Presale XXI',
            'description' => 'Penayangan eksklusif di bioskop Cinema XXI Senayan.',
            'synopsis_short' => 'Film cinta dan perjuangan.',
            'duration_minutes' => 120,
            'age_rating' => '13+',
            'genre' => ['Drama', 'Romance'],
            'release_year' => 2026,
            'poster_path' => 'events/posters/cds.jpg',
            'backdrop_path' => 'events/backdrops/cds.jpg',
            'director' => 'Yuda K.',
            'cast' => ['Chicco Jerikho', 'Putri Marino'],
            'rules' => ['Dilarang membawa makanan luar', 'Wajib tertib'],
            'venue_name' => 'Cinema XXI Plaza Senayan',
            'venue_address' => 'Plaza Senayan Lantai 5',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_admin_banners_endpoints(): void
    {
        $this->getJson('/api/v1/admin/banners')->assertStatus(401);
        $this->postJson('/api/v1/admin/banners', [])->assertStatus(401);
        $this->getJson('/api/v1/admin/banners/1')->assertStatus(401);
        $this->putJson('/api/v1/admin/banners/1', [])->assertStatus(401);
        $this->deleteJson('/api/v1/admin/banners/1')->assertStatus(401);
        $this->postJson('/api/v1/admin/banners/reorder', [])->assertStatus(401);
    }

    public function test_customer_role_cannot_access_admin_banners_and_receives_403(): void
    {
        $this->actingAs($this->customer, 'sanctum');

        $this->getJson('/api/v1/admin/banners')
            ->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'FORBIDDEN_ROLE_ACCESS',
            ]);

        $this->postJson('/api/v1/admin/banners', [])->assertStatus(403);
        $this->getJson('/api/v1/admin/banners/1')->assertStatus(403);
        $this->putJson('/api/v1/admin/banners/1', [])->assertStatus(403);
        $this->deleteJson('/api/v1/admin/banners/1')->assertStatus(403);
        $this->postJson('/api/v1/admin/banners/reorder', [])->assertStatus(403);
    }

    public function test_super_admin_can_list_banners_with_standard_envelope(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        Banner::create([
            'title' => 'Banner Cinta dan Sejarah',
            'subtitle' => 'Pemutaran perdana eksklusif',
            'badge_text' => 'PRESALE XXI',
            'image_path' => 'banners/banner-1.jpg',
            'display_mode' => 'rich_content',
            'link_type' => 'event',
            'event_id' => $this->sampleEvent->id,
            'button_text' => 'Pilih Kursi',
            'order_priority' => 1,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/admin/banners');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'subtitle',
                        'badge_text',
                        'image_path',
                        'image_url',
                        'display_mode',
                        'link_type',
                        'event_id',
                        'event_slug',
                        'event_title',
                        'button_text',
                        'order_priority',
                        'is_active',
                        'status',
                        'created_at',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'from',
                    'last_page',
                    'per_page',
                    'to',
                    'total',
                ],
                'server_time',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    [
                        'title' => 'Banner Cinta dan Sejarah',
                        'event_slug' => 'cinta-dan-sejarah-xxi',
                        'order_priority' => 1,
                    ],
                ],
            ]);
    }

    public function test_super_admin_can_filter_banners_by_status(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        // 1. Active banner (berada dalam jendela tanggal atau tanpa batas)
        Banner::create([
            'title' => 'Banner Active',
            'image_path' => 'banners/active.jpg',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/promo',
            'is_active' => true,
            'start_at' => now()->subDay(),
            'end_at' => now()->addDays(5),
            'order_priority' => 1,
        ]);

        // 2. Upcoming banner (start_at di masa depan)
        Banner::create([
            'title' => 'Banner Upcoming',
            'image_path' => 'banners/upcoming.jpg',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/upcoming',
            'is_active' => true,
            'start_at' => now()->addDays(2),
            'end_at' => now()->addDays(10),
            'order_priority' => 2,
        ]);

        // 3. Inactive / Expired banner
        Banner::create([
            'title' => 'Banner Expired',
            'image_path' => 'banners/expired.jpg',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/expired',
            'is_active' => true,
            'start_at' => now()->subDays(10),
            'end_at' => now()->subDay(),
            'order_priority' => 3,
        ]);

        // Filter active
        $resActive = $this->getJson('/api/v1/admin/banners?status=active');
        $resActive->assertStatus(200);
        $this->assertCount(1, $resActive->json('data'));
        $this->assertEquals('Banner Active', $resActive->json('data.0.title'));

        // Filter upcoming
        $resUpcoming = $this->getJson('/api/v1/admin/banners?status=upcoming');
        $resUpcoming->assertStatus(200);
        $this->assertCount(1, $resUpcoming->json('data'));
        $this->assertEquals('Banner Upcoming', $resUpcoming->json('data.0.title'));

        // Filter inactive
        $resInactive = $this->getJson('/api/v1/admin/banners?status=inactive');
        $resInactive->assertStatus(200);
        $this->assertCount(1, $resInactive->json('data'));
        $this->assertEquals('Banner Expired', $resInactive->json('data.0.title'));
    }

    public function test_super_admin_can_filter_banners_by_search_and_display_mode(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        Banner::create([
            'title' => 'Sorotan Spesial Dokumenter',
            'subtitle' => 'Kisah inspiratif para sineas',
            'image_path' => 'banners/doc.jpg',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/doc',
            'is_active' => true,
            'order_priority' => 1,
        ]);

        Banner::create([
            'title' => null,
            'image_path' => 'banners/promo-art.jpg',
            'display_mode' => 'image_only',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/promo-art',
            'is_active' => true,
            'order_priority' => 2,
        ]);

        // Search text
        $resSearch = $this->getJson('/api/v1/admin/banners?search=Dokumenter');
        $resSearch->assertStatus(200);
        $this->assertCount(1, $resSearch->json('data'));
        $this->assertEquals('Sorotan Spesial Dokumenter', $resSearch->json('data.0.title'));

        // Filter display_mode
        $resMode = $this->getJson('/api/v1/admin/banners?display_mode=image_only');
        $resMode->assertStatus(200);
        $this->assertCount(1, $resMode->json('data'));
        $this->assertEquals('image_only', $resMode->json('data.0.display_mode'));
    }

    public function test_super_admin_can_create_rich_content_banner_with_r2_image_upload(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $imageFile = UploadedFile::fake()->create('banner_16_9.jpg', 500, 'image/jpeg');

        $payload = [
            'display_mode' => 'rich_content',
            'title' => 'Premiere Laut Bercerita',
            'subtitle' => 'Sewa dan tonton film 48 jam penuh di Sinemus VoD.',
            'badge_text' => 'NEW RELEASE',
            'button_text' => 'Sewa Film',
            'link_type' => 'movie',
            'movie_id' => $this->sampleMovie->id,
            'order_priority' => 1,
            'is_active' => true,
            'start_at' => now()->toIso8601String(),
            'end_at' => now()->addDays(30)->toIso8601String(),
            'image' => $imageFile,
        ];

        $response = $this->postJson('/api/v1/admin/banners', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Banner berhasil ditambahkan.',
                'data' => [
                    'title' => 'Premiere Laut Bercerita',
                    'display_mode' => 'rich_content',
                    'link_type' => 'movie',
                    'movie_id' => $this->sampleMovie->id,
                    'movie_slug' => 'laut-bercerita',
                    'button_text' => 'Sewa Film',
                    'order_priority' => 1,
                    'is_active' => true,
                ],
            ]);

        $this->assertDatabaseHas('banners', [
            'title' => 'Premiere Laut Bercerita',
            'movie_id' => $this->sampleMovie->id,
            'display_mode' => 'rich_content',
        ]);

        $banner = Banner::first();
        $this->assertNotNull($banner->image_path);
        Storage::disk('r2')->assertExists($banner->image_path);
    }

    public function test_super_admin_can_create_spotlight_banner_for_event_and_movie(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $imageFile = UploadedFile::fake()->create('banner_spotlight.jpg', 500, 'image/jpeg');

        $payload = [
            'display_mode' => 'spotlight',
            'title' => 'Sorotan Cinta dan Sejarah',
            'subtitle' => 'Penayangan eksklusif bioskop XXI.',
            'badge_text' => 'SOROTAN UTAMA',
            'age_rating' => '13+',
            'genre' => 'Drama, Sejarah',
            'release_year' => 2026,
            'button_text' => 'Beli Tiket Sekarang',
            'link_type' => 'event',
            'event_id' => $this->sampleEvent->id,
            'order_priority' => 1,
            'is_active' => true,
            'image' => $imageFile,
        ];

        $response = $this->postJson('/api/v1/admin/banners', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Sorotan Cinta dan Sejarah',
                    'display_mode' => 'spotlight',
                    'age_rating' => '13+',
                    'genre' => 'Drama, Sejarah',
                    'release_year' => 2026,
                    'link_type' => 'event',
                    'event_id' => $this->sampleEvent->id,
                ],
            ]);

        $this->assertDatabaseHas('banners', [
            'title' => 'Sorotan Cinta dan Sejarah',
            'display_mode' => 'spotlight',
            'age_rating' => '13+',
            'genre' => 'Drama, Sejarah',
            'release_year' => 2026,
        ]);
    }

    public function test_spotlight_banner_auto_fills_title_subtitle_badge_and_metadata_from_movie(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $imageFile = UploadedFile::fake()->create('banner_spotlight_auto.jpg', 500, 'image/jpeg');

        // Mengirim banner spotlight tanpa title, subtitle, badge_text, atau metadata
        $payload = [
            'display_mode' => 'spotlight',
            'link_type' => 'movie',
            'movie_id' => $this->sampleMovie->id,
            'is_active' => true,
            'image' => $imageFile,
        ];

        $response = $this->postJson('/api/v1/admin/banners', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Laut Bercerita',
                    'subtitle' => 'Film adaptasi novel Laut Bercerita karya Leila S. Chudori.',
                    'badge_text' => null,
                    'age_rating' => '17+',
                    'genre' => 'Drama',
                    'release_year' => 2024,
                    'duration_minutes' => 110,
                    'link_type' => 'movie',
                    'movie_id' => $this->sampleMovie->id,
                ],
            ]);

        $this->assertDatabaseHas('banners', [
            'title' => 'Laut Bercerita',
            'movie_id' => $this->sampleMovie->id,
            'display_mode' => 'spotlight',
            'badge_text' => null,
            'release_year' => 2024,
            'duration_minutes' => 110,
        ]);
    }

    public function test_spotlight_banner_auto_fills_metadata_from_event(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $imageFile = UploadedFile::fake()->create('banner_spotlight_event.jpg', 500, 'image/jpeg');

        $payload = [
            'display_mode' => 'spotlight',
            'link_type' => 'event',
            'event_id' => $this->sampleEvent->id,
            'is_active' => true,
            'image' => $imageFile,
        ];

        $response = $this->postJson('/api/v1/admin/banners', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Cinta dan Sejarah (CDS) Presale XXI',
                    'subtitle' => 'Film cinta dan perjuangan.',
                    'badge_text' => null,
                    'age_rating' => '13+',
                    'genre' => 'Drama, Romance',
                    'release_year' => 2026,
                    'duration_minutes' => 120,
                    'link_type' => 'event',
                    'event_id' => $this->sampleEvent->id,
                ],
            ]);

        $this->assertDatabaseHas('banners', [
            'title' => 'Cinta dan Sejarah (CDS) Presale XXI',
            'event_id' => $this->sampleEvent->id,
            'display_mode' => 'spotlight',
            'badge_text' => null,
            'release_year' => 2026,
            'duration_minutes' => 120,
        ]);
    }

    public function test_spotlight_banner_rejects_url_link_type(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $imageFile = UploadedFile::fake()->create('banner_spotlight_url.jpg', 500, 'image/jpeg');

        $payload = [
            'display_mode' => 'spotlight',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/custom-page',
            'is_active' => true,
            'image' => $imageFile,
        ];

        $response = $this->postJson('/api/v1/admin/banners', $payload);
        $response->assertStatus(422)->assertJsonValidationErrors(['link_type']);
    }

    public function test_super_admin_can_create_image_only_banner(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $imageFile = UploadedFile::fake()->create('graphic_poster.webp', 500, 'image/webp');

        $payload = [
            'display_mode' => 'image_only',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/event/talkshow',
            'is_active' => true,
            'image' => $imageFile,
        ];

        $response = $this->postJson('/api/v1/admin/banners', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'display_mode' => 'image_only',
                    'link_type' => 'url',
                    'target_url' => 'https://sinemus.id/event/talkshow',
                    'title' => null,
                ],
            ]);

        $banner = Banner::latest('id')->first();
        Storage::disk('r2')->assertExists($banner->image_path);
    }

    public function test_store_banner_validates_conditional_rules_and_rejects_invalid_inputs(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        // 1. Rich content wajib title
        $res1 = $this->postJson('/api/v1/admin/banners', [
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id',
            'image' => UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg'),
        ]);
        $res1->assertStatus(422)
            ->assertJsonValidationErrors(['title']);

        // 2. Link type movie wajib movie_id
        $res2 = $this->postJson('/api/v1/admin/banners', [
            'display_mode' => 'image_only',
            'link_type' => 'movie',
            'image' => UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg'),
        ]);
        $res2->assertStatus(422)
            ->assertJsonValidationErrors(['movie_id']);

        // 3. Link type event wajib event_id
        $res3 = $this->postJson('/api/v1/admin/banners', [
            'display_mode' => 'image_only',
            'link_type' => 'event',
            'image' => UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg'),
        ]);
        $res3->assertStatus(422)
            ->assertJsonValidationErrors(['event_id']);

        // 4. File melebihi batas 3MB
        $hugeImage = UploadedFile::fake()->create('huge.jpg', 3500, 'image/jpeg');
        $res4 = $this->postJson('/api/v1/admin/banners', [
            'display_mode' => 'image_only',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id',
            'image' => $hugeImage,
        ]);
        $res4->assertStatus(422)
            ->assertJsonValidationErrors(['image']);

        // 5. end_at sebelum start_at
        $res5 = $this->postJson('/api/v1/admin/banners', [
            'display_mode' => 'image_only',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id',
            'start_at' => now()->addDays(5)->toIso8601String(),
            'end_at' => now()->addDays(2)->toIso8601String(),
            'image' => UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg'),
        ]);
        $res5->assertStatus(422)
            ->assertJsonValidationErrors(['end_at']);
    }

    public function test_super_admin_can_view_banner_detail(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $banner = Banner::create([
            'title' => 'Detail Test Banner',
            'subtitle' => 'Sub banner detail',
            'badge_text' => 'HOT',
            'image_path' => 'banners/detail.jpg',
            'display_mode' => 'rich_content',
            'link_type' => 'event',
            'event_id' => $this->sampleEvent->id,
            'button_text' => 'Lihat Jadwal',
            'order_priority' => 1,
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/admin/banners/{$banner->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $banner->id,
                    'title' => 'Detail Test Banner',
                    'event_slug' => 'cinta-dan-sejarah-xxi',
                    'event_title' => 'Cinta dan Sejarah (CDS) Presale XXI',
                ],
            ]);
    }

    public function test_view_banner_returns_404_if_not_found(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $this->getJson('/api/v1/admin/banners/99999')->assertStatus(404);
    }

    public function test_super_admin_can_update_banner_and_replace_r2_image(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $oldImage = UploadedFile::fake()->create('old_banner.jpg', 500, 'image/jpeg');
        $oldPath = $oldImage->store('banners', 'r2');

        $banner = Banner::create([
            'title' => 'Banner Lama',
            'subtitle' => 'Deskripsi lama',
            'image_path' => $oldPath,
            'display_mode' => 'rich_content',
            'link_type' => 'movie',
            'movie_id' => $this->sampleMovie->id,
            'order_priority' => 1,
            'is_active' => true,
        ]);

        Storage::disk('r2')->assertExists($oldPath);

        $newImage = UploadedFile::fake()->create('new_banner.png', 500, 'image/png');

        $updatePayload = [
            'display_mode' => 'rich_content',
            'title' => 'Banner Baru Terupdate',
            'subtitle' => 'Deskripsi baru',
            'badge_text' => 'UPDATED',
            'link_type' => 'event',
            'event_id' => $this->sampleEvent->id,
            'button_text' => 'Daftar Sekarang',
            'order_priority' => 5,
            'is_active' => false,
            'image' => $newImage,
        ];

        $response = $this->putJson("/api/v1/admin/banners/{$banner->id}", $updatePayload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Banner berhasil diperbarui.',
                'data' => [
                    'id' => $banner->id,
                    'title' => 'Banner Baru Terupdate',
                    'event_id' => $this->sampleEvent->id,
                    'movie_id' => null, // movie_id otomatis dibersihkan karena link_type berubah ke event
                    'button_text' => 'Daftar Sekarang',
                    'order_priority' => 5,
                    'is_active' => false,
                    'status' => 'inactive',
                ],
            ]);

        // File lama wajib dihapus dari R2
        Storage::disk('r2')->assertMissing($oldPath);

        // File baru wajib ada di R2
        $banner->refresh();
        Storage::disk('r2')->assertExists($banner->image_path);
        $this->assertNotEquals($oldPath, $banner->image_path);
    }

    public function test_super_admin_can_update_banner_without_changing_image(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $banner = Banner::create([
            'title' => 'Judul Awal',
            'image_path' => 'banners/keep-this.jpg',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id',
            'order_priority' => 1,
            'is_active' => true,
        ]);

        $response = $this->putJson("/api/v1/admin/banners/{$banner->id}", [
            'display_mode' => 'rich_content',
            'title' => 'Judul Diubah Tanpa Ganti Gambar',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/new-path',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Judul Diubah Tanpa Ganti Gambar',
                    'image_path' => 'banners/keep-this.jpg',
                ],
            ]);

        $banner->refresh();
        $this->assertEquals('banners/keep-this.jpg', $banner->image_path);
    }

    public function test_super_admin_can_delete_banner_and_removes_r2_image(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $imageFile = UploadedFile::fake()->create('banner_to_delete.jpg', 500, 'image/jpeg');
        $path = $imageFile->store('banners', 'r2');

        $banner = Banner::create([
            'title' => 'Banner To Delete',
            'image_path' => $path,
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id',
            'is_active' => true,
        ]);

        Storage::disk('r2')->assertExists($path);

        $response = $this->deleteJson("/api/v1/admin/banners/{$banner->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Banner berhasil dihapus.',
            ]);

        $this->assertDatabaseMissing('banners', [
            'id' => $banner->id,
        ]);

        Storage::disk('r2')->assertMissing($path);
    }

    public function test_super_admin_can_batch_reorder_banners_within_transaction(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $b1 = Banner::create([
            'title' => 'Banner 1',
            'image_path' => 'banners/1.jpg',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/1',
            'order_priority' => 1,
            'is_active' => true,
        ]);

        $b2 = Banner::create([
            'title' => 'Banner 2',
            'image_path' => 'banners/2.jpg',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/2',
            'order_priority' => 2,
            'is_active' => true,
        ]);

        $b3 = Banner::create([
            'title' => 'Banner 3',
            'image_path' => 'banners/3.jpg',
            'display_mode' => 'rich_content',
            'link_type' => 'url',
            'target_url' => 'https://sinemus.id/3',
            'order_priority' => 3,
            'is_active' => true,
        ]);

        // Tukar urutan: b3 -> priority 1, b1 -> priority 2, b2 -> priority 3
        $reorderPayload = [
            'items' => [
                ['id' => $b3->id, 'order_priority' => 1],
                ['id' => $b1->id, 'order_priority' => 2],
                ['id' => $b2->id, 'order_priority' => 3],
            ],
        ];

        $response = $this->postJson('/api/v1/admin/banners/reorder', $reorderPayload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'updated_count' => 3,
                ],
            ]);

        $this->assertEquals(1, $b3->fresh()->order_priority);
        $this->assertEquals(2, $b1->fresh()->order_priority);
        $this->assertEquals(3, $b2->fresh()->order_priority);
    }

    public function test_reorder_banners_validates_existing_ids_and_non_empty_items(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        // Empty items
        $res1 = $this->postJson('/api/v1/admin/banners/reorder', [
            'items' => [],
        ]);
        $res1->assertStatus(422)->assertJsonValidationErrors(['items']);

        // Non-existent ID
        $res2 = $this->postJson('/api/v1/admin/banners/reorder', [
            'items' => [
                ['id' => 99999, 'order_priority' => 1],
            ],
        ]);
        $res2->assertStatus(422)->assertJsonValidationErrors(['items.0.id']);
    }
}
