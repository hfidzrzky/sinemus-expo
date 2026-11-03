<?php

namespace Tests\Feature\Movies;

use App\Models\Movie;
use App\Models\User;
use App\Models\UserMovieAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MovieCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected User $superAdmin;

    protected Movie $publishedMovie1;

    protected Movie $publishedMovie2;

    protected Movie $unpublishedMovie;

    protected Movie $freeMovie;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'name' => 'Penonton Setia',
            'email' => 'penonton@sinemus.id',
            'role' => 'customer',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Studio',
            'email' => 'admin@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081234567899',
            'is_phone_locked' => true,
        ]);

        $this->publishedMovie1 = Movie::create([
            'slug' => 'laskar-pelangi-2026',
            'title' => 'Laskar Pelangi 2026',
            'synopsis' => 'Kisah perjuangan anak-anak Belitung meraih mimpi di sekolah desa.',
            'poster_path' => 'cf_img_poster_01',
            'backdrop_path' => 'cf_img_backdrop_01',
            'director' => 'Riri Riza',
            'cast' => ['Ikal', 'Lintang', 'Mahar'],
            'genre' => 'Drama, Family',
            'duration_minutes' => 125,
            'price' => 30000,
            'rental_duration_hours' => 48,
            'access_model' => 'rental',
            'cloudflare_trailer_uid' => 'trailer_uid_01010101010101010101',
            'cloudflare_video_uid' => 'video_uid_master_0101010101010101',
            'is_featured' => true,
            'release_year' => 2026,
            'age_rating' => 'SU',
            'is_published' => true,
        ]);

        $this->publishedMovie2 = Movie::create([
            'slug' => 'pengabdi-setan-reborn',
            'title' => 'Pengabdi Setan Reborn',
            'synopsis' => 'Misteri rumah tua dan perjanjian terlarang keluarga di masa lampau.',
            'poster_path' => 'cf_img_poster_02',
            'backdrop_path' => 'cf_img_backdrop_02',
            'director' => 'Joko Anwar',
            'cast' => ['Tara Basro', 'Bront Palarae'],
            'genre' => 'Horror, Mystery',
            'duration_minutes' => 107,
            'price' => 25000,
            'rental_duration_hours' => 48,
            'access_model' => 'rental',
            'cloudflare_trailer_uid' => 'trailer_uid_02020202020202020202',
            'cloudflare_video_uid' => 'video_uid_master_0202020202020202',
            'is_featured' => false,
            'release_year' => 2026,
            'age_rating' => '17+',
            'is_published' => true,
        ]);

        $this->unpublishedMovie = Movie::create([
            'slug' => 'film-rahasia-draft',
            'title' => 'Film Rahasia Draft',
            'synopsis' => 'Film yang masih dalam tahap kurasi dan belum dipublikasikan.',
            'poster_path' => 'cf_img_draft_poster',
            'backdrop_path' => 'cf_img_draft_backdrop',
            'director' => 'Sutradara Indie',
            'cast' => ['Aktor Indie'],
            'genre' => 'Dokumenter',
            'duration_minutes' => 60,
            'price' => 15000,
            'access_model' => 'rental',
            'cloudflare_video_uid' => 'video_uid_draft_1111222233334444',
            'release_year' => 2026,
            'age_rating' => 'SU',
            'is_published' => false,
        ]);

        $this->freeMovie = Movie::create([
            'slug' => 'pesona-nusantara-free',
            'title' => 'Pesona Nusantara Eksplorasi',
            'synopsis' => 'Dokumenter alam bebas tonton untuk seluruh penonton Sinemus.',
            'poster_path' => 'cf_img_poster_free',
            'backdrop_path' => 'cf_img_backdrop_free',
            'director' => 'Komunitas Sinema',
            'cast' => ['Pemandu Alam'],
            'genre' => 'Dokumenter, Alam',
            'duration_minutes' => 45,
            'price' => 0,
            'access_model' => 'free',
            'cloudflare_trailer_uid' => null,
            'cloudflare_video_uid' => 'video_uid_free_9999999999999999',
            'release_year' => 2026,
            'age_rating' => 'SU',
            'is_published' => true,
        ]);
    }

    public function test_can_list_active_movies_with_standard_envelope_and_pagination(): void
    {
        $response = $this->getJson('/api/v1/movies');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Katalog film berhasil diambil.')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'slug',
                        'title',
                        'synopsis_short',
                        'poster_url',
                        'genre',
                        'duration_minutes',
                        'price',
                        'formatted_price',
                        'is_featured',
                        'release_year',
                        'age_rating',
                        'access_model',
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
            ]);

        // Pastikan film terpublikasi masuk dan unpublished tidak masuk
        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertContains('laskar-pelangi-2026', $slugs);
        $this->assertContains('pengabdi-setan-reborn', $slugs);
        $this->assertContains('pesona-nusantara-free', $slugs);
        $this->assertNotContains('film-rahasia-draft', $slugs);
    }

    public function test_can_filter_movies_by_genre(): void
    {
        $response = $this->getJson('/api/v1/movies?genre=Horror');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertContains('pengabdi-setan-reborn', $slugs);
        $this->assertNotContains('laskar-pelangi-2026', $slugs);
    }

    public function test_can_search_movies_by_title_or_director(): void
    {
        // Cari berdasarkan sutradara
        $response = $this->getJson('/api/v1/movies?search=Joko Anwar');

        $response->assertStatus(200);
        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertContains('pengabdi-setan-reborn', $slugs);
        $this->assertNotContains('laskar-pelangi-2026', $slugs);

        // Cari berdasarkan judul
        $responseTitle = $this->getJson('/api/v1/movies?search=Laskar');
        $slugsTitle = collect($responseTitle->json('data'))->pluck('slug')->all();
        $this->assertContains('laskar-pelangi-2026', $slugsTitle);
    }

    public function test_can_filter_featured_movies(): void
    {
        $response = $this->getJson('/api/v1/movies?featured=1');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertNotEmpty($data);

        foreach ($data as $item) {
            $this->assertTrue($item['is_featured']);
        }
    }

    public function test_guest_retrieves_movie_detail_with_locked_status_and_masked_video_uid(): void
    {
        $response = $this->getJson('/api/v1/movies/laskar-pelangi-2026');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.slug', 'laskar-pelangi-2026')
            ->assertJsonPath('data.title', 'Laskar Pelangi 2026')
            ->assertJsonPath('data.access_status', 'locked')
            ->assertJsonPath('data.rental_expires_at', null)
            ->assertJsonPath('data.cloudflare_video_uid', null); // Security Guardrail
    }

    public function test_can_get_movie_detail_by_numeric_id(): void
    {
        $response = $this->getJson("/api/v1/movies/{$this->publishedMovie1->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $this->publishedMovie1->id)
            ->assertJsonPath('data.slug', 'laskar-pelangi-2026');
    }

    public function test_authenticated_user_with_active_rental_receives_active_status_and_revealed_video_uid(): void
    {
        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $this->publishedMovie1->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/v1/movies/laskar-pelangi-2026');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.access_status', 'active')
            ->assertJsonPath('data.cloudflare_video_uid', 'video_uid_master_0101010101010101');

        $this->assertNotNull($response->json('data.rental_expires_at'));
    }

    public function test_authenticated_user_with_expired_rental_receives_expired_status_and_masked_video_uid(): void
    {
        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $this->publishedMovie1->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subHours(50),
            'rental_expires_at' => now()->subHours(2), // Sudah lewat 2 jam yang lalu
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/v1/movies/laskar-pelangi-2026');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.access_status', 'expired')
            ->assertJsonPath('data.cloudflare_video_uid', null);
    }

    public function test_free_movie_always_returns_active_status_and_revealed_video_uid(): void
    {
        // Akses oleh penonton tamu tanpa login
        $response = $this->getJson('/api/v1/movies/pesona-nusantara-free');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.access_model', 'free')
            ->assertJsonPath('data.access_status', 'active')
            ->assertJsonPath('data.cloudflare_video_uid', 'video_uid_free_9999999999999999');
    }

    public function test_returns_404_with_standard_envelope_when_movie_not_found(): void
    {
        $response = $this->getJson('/api/v1/movies/non-existent-movie-slug');

        $response->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'MOVIE_NOT_FOUND')
            ->assertJsonStructure([
                'success',
                'message',
                'error_code',
                'data',
                'server_time',
            ]);
    }

    public function test_super_admin_with_revoked_access_receives_expired_status_on_published_movie(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $publishedMovie = Movie::where('slug', 'laskar-pelangi-2026')->firstOrFail();

        UserMovieAccess::create([
            'user_id' => $superAdmin->id,
            'movie_id' => $publishedMovie->id,
            'access_status' => 'revoked',
            'rental_start_at' => now()->subDays(2),
            'rental_expires_at' => now()->addDay(),
            'revoked_at' => now(),
            'revoke_reason' => 'manual_admin',
        ]);

        $response = $this->actingAs($superAdmin, 'sanctum')
            ->getJson("/api/v1/movies/{$publishedMovie->slug}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.access_status', 'expired')
            ->assertJsonPath('data.cloudflare_video_uid', null);
    }

    public function test_movie_catalog_endpoints_have_throttle_middleware(): void
    {
        $routeList = app('router')->getRoutes();

        $catalogRoute = $routeList->getByAction('App\Http\Controllers\Movies\V1\MovieController@index');
        $this->assertNotNull($catalogRoute);
        $this->assertContains('throttle:60,1', $catalogRoute->gatherMiddleware());

        $detailRoute = $routeList->getByAction('App\Http\Controllers\Movies\V1\MovieController@show');
        $this->assertNotNull($detailRoute);
        $this->assertContains('throttle:60,1', $detailRoute->gatherMiddleware());
    }
}
