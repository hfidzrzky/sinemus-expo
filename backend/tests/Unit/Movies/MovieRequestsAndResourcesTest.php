<?php

namespace Tests\Unit\Movies;

use App\Http\Requests\Movies\V1\ListMoviesRequest;
use App\Http\Requests\Movies\V1\RentMovieRequest;
use App\Http\Resources\Movies\V1\MovieDetailResource;
use App\Http\Resources\Movies\V1\MovieRentalOrderResource;
use App\Http\Resources\Movies\V1\MovieSummaryResource;
use App\Models\Movie;
use App\Models\MovieTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class MovieRequestsAndResourcesTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_movies_request_sanitizes_and_validates_inputs(): void
    {
        $rawPayload = [
            'search' => '  <script>alert("xss")</script>Petualangan Rimba  ',
            'genre' => '  <b>Drama</b>  ',
            'featured' => '1',
            'page' => '2',
            'per_page' => '24',
        ];

        $request = ListMoviesRequest::create('/api/v1/movies', 'GET', $rawPayload);
        $request->setContainer($this->app);

        // Panggil prepareForValidation via method reflection atau validateResolved
        $request->validateResolved();

        $this->assertEquals('Petualangan Rimba', $request->validatedSearch());
        $this->assertEquals('Drama', $request->validatedGenre());
        $this->assertTrue($request->isFeatured());
        $this->assertEquals(24, $request->perPage());
    }

    public function test_list_movies_request_enforces_bounds_on_per_page(): void
    {
        $rules = (new ListMoviesRequest)->rules();

        $validatorExceed = Validator::make(['per_page' => 100], $rules);
        $this->assertTrue($validatorExceed->fails());

        $validatorNegative = Validator::make(['per_page' => 0], $rules);
        $this->assertTrue($validatorNegative->fails());

        $validatorValid = Validator::make(['per_page' => 50], $rules);
        $this->assertFalse($validatorValid->fails());
    }

    public function test_rent_movie_request_sanitizes_voucher_code(): void
    {
        $request = RentMovieRequest::create('/api/v1/movies/1/rent', 'POST', [
            'voucher_code' => '  diskon-merdeka_2026  ',
        ]);
        $request->setContainer($this->app);
        $request->validateResolved();

        $this->assertEquals('DISKON-MERDEKA_2026', $request->voucherCode());
    }

    public function test_rent_movie_request_rejects_malicious_characters_in_voucher(): void
    {
        $rules = (new RentMovieRequest)->rules();

        $validator = Validator::make(['voucher_code' => 'DISCOUNT; DROP TABLE users;'], $rules);
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('voucher_code', $validator->errors()->toArray());
    }

    public function test_movie_summary_resource_contract_conformance_and_cloudflare_image_resolution(): void
    {
        $movie = new Movie([
            'id' => 101,
            'slug' => 'laskar-pelangi-remastered',
            'title' => 'Laskar Pelangi Remastered 4K',
            'synopsis' => 'Kisah inspiratif tentang sepuluh anak dari keluarga miskin yang bersekolah di sebuah sekolah Muhammadiyah di pulau Belitung.',
            'poster_path' => 'cf-img-uuid-poster-101',
            'genre' => ['Drama', 'Family'],
            'duration_minutes' => 125,
            'price' => 35000,
            'is_featured' => true,
            'release_year' => 2026,
            'age_rating' => 'SU',
            'access_model' => 'rental',
        ]);
        $movie->id = 101;

        $resource = (new MovieSummaryResource($movie))->toArray(Request::create('/api/v1/movies'));

        $this->assertEquals(101, $resource['id']);
        $this->assertEquals('laskar-pelangi-remastered', $resource['slug']);
        $this->assertEquals('Laskar Pelangi Remastered 4K', $resource['title']);
        $this->assertEquals('Drama, Family', $resource['genre']);
        $this->assertEquals(125, $resource['duration_minutes']);
        $this->assertEquals(35000.0, $resource['price']);
        $this->assertEquals('Rp 35.000', $resource['formatted_price']);
        $this->assertTrue($resource['is_featured']);
        $this->assertEquals(2026, $resource['release_year']);
        $this->assertEquals('SU', $resource['age_rating']);
        $this->assertEquals('rental', $resource['access_model']);

        // Verifikasi poster_url diformat ke Cloudflare Images URL
        $accountHash = config('services.cloudflare.images_account_hash') ?: 'default_hash';
        $this->assertEquals("https://imagedelivery.net/{$accountHash}/cf-img-uuid-poster-101/public", $resource['poster_url']);
    }

    public function test_movie_detail_resource_masks_video_uid_when_locked(): void
    {
        $movie = new Movie([
            'id' => 202,
            'slug' => 'rahasiaku-locked',
            'title' => 'Rahasiaku Film Eksklusif',
            'synopsis' => 'Sinopsis panjang tentang film berbayar dengan hak akses terkunci.',
            'poster_path' => 'https://imagedelivery.net/custom-hash/poster-202/public',
            'backdrop_path' => 'custom-backdrop-uuid-202',
            'director' => 'Sutradara Handal',
            'cast' => ['Aktor Utama', 'Aktris Pendukung'],
            'genre' => 'Thriller, Misteri',
            'duration_minutes' => 98,
            'price' => 25000,
            'rental_duration_hours' => 48,
            'access_model' => 'rental',
            'cloudflare_trailer_uid' => 'trailer_cf_uid_1234567890abcdef',
            'cloudflare_video_uid' => 'video_secret_master_uid_99998888',
        ]);
        $movie->id = 202;
        $movie->access_status = 'locked';

        $resource = (new MovieDetailResource($movie))->toArray(Request::create('/api/v1/movies/rahasiaku-locked'));

        $this->assertEquals('locked', $resource['access_status']);
        $this->assertEquals('https://imagedelivery.net/custom-hash/poster-202/public', $resource['poster_url']);
        $this->assertStringContainsString('custom-backdrop-uuid-202/public', $resource['backdrop_url']);
        $this->assertEquals('trailer_cf_uid_1234567890abcdef', $resource['cloudflare_trailer_uid']);

        // Security Guardrail: Video UID wajib null saat locked
        $this->assertNull($resource['cloudflare_video_uid']);
        $this->assertNull($resource['rental_expires_at']);
    }

    public function test_movie_detail_resource_reveals_video_uid_when_active_or_free(): void
    {
        $movieActive = new Movie([
            'id' => 303,
            'slug' => 'film-aktif',
            'title' => 'Film Sudah Disewa',
            'synopsis' => 'Sinopsis film aktif.',
            'director' => 'Sutradara B',
            'cast' => ['Aktor C'],
            'genre' => 'Komedi',
            'duration_minutes' => 90,
            'price' => 20000,
            'access_model' => 'rental',
            'cloudflare_trailer_uid' => null,
            'cloudflare_video_uid' => 'master_cf_uid_active_12345',
        ]);
        $movieActive->id = 303;
        $movieActive->access_status = 'active';
        $movieActive->rental_expires_at = now()->addHours(48);

        $resourceActive = (new MovieDetailResource($movieActive))->toArray(Request::create('/api/v1/movies/film-aktif'));
        $this->assertEquals('active', $resourceActive['access_status']);
        $this->assertEquals('master_cf_uid_active_12345', $resourceActive['cloudflare_video_uid']);
        $this->assertNotNull($resourceActive['rental_expires_at']);

        // Test Free movie reveals video UID regardless of rental access
        $movieFree = new Movie([
            'id' => 304,
            'slug' => 'film-gratis',
            'title' => 'Dokumenter Nusantara Bebas Tonton',
            'synopsis' => 'Film gratis untuk masyarakat.',
            'director' => 'Sutradara Budaya',
            'cast' => [],
            'genre' => 'Dokumenter',
            'duration_minutes' => 60,
            'price' => 0,
            'access_model' => 'free',
            'cloudflare_trailer_uid' => null,
            'cloudflare_video_uid' => 'master_cf_uid_free_67890',
        ]);
        $movieFree->id = 304;

        $resourceFree = (new MovieDetailResource($movieFree))->toArray(Request::create('/api/v1/movies/film-gratis'));
        $this->assertEquals('active', $resourceFree['access_status']);
        $this->assertEquals('master_cf_uid_free_67890', $resourceFree['cloudflare_video_uid']);
    }

    public function test_movie_rental_order_resource_handles_array_and_model_conformance(): void
    {
        // 1. Array representation
        $arrayData = [
            'order_id' => 'SNM-VOD-2026-ABCD1234',
            'snap_token' => 'mock_snap_token_token_123',
            'movie_title' => 'Film Bioskop Pilihan',
            'gross_amount' => 30000,
            'discount_amount' => 5000,
            'net_amount' => 25000,
            'rental_duration_hours' => 48,
        ];

        $resourceFromArray = (new MovieRentalOrderResource($arrayData))->toArray(Request::create('/api/v1/movies/1/rent'));
        $this->assertEquals('SNM-VOD-2026-ABCD1234', $resourceFromArray['order_id']);
        $this->assertEquals('mock_snap_token_token_123', $resourceFromArray['snap_token']);
        $this->assertEquals('Film Bioskop Pilihan', $resourceFromArray['movie_title']);
        $this->assertEquals(30000.0, $resourceFromArray['gross_amount']);
        $this->assertEquals(5000.0, $resourceFromArray['discount_amount']);
        $this->assertEquals(25000.0, $resourceFromArray['net_amount']);
        $this->assertEquals(48, $resourceFromArray['rental_duration_hours']);

        // 2. Model representation
        $model = new MovieTransaction([
            'order_id' => 'SNM-VOD-2026-MODEL5678',
            'gross_amount' => 40000,
            'discount_amount' => 0,
            'net_amount' => 40000,
            'snap_token' => 'snap_model_token_777',
            'snapshot_movie_data' => [
                'title' => 'Film Dari Snapshot Model',
                'rental_duration_hours' => 72,
            ],
        ]);

        $resourceFromModel = (new MovieRentalOrderResource($model))->toArray(Request::create('/api/v1/movies/1/rent'));
        $this->assertEquals('SNM-VOD-2026-MODEL5678', $resourceFromModel['order_id']);
        $this->assertEquals('snap_model_token_777', $resourceFromModel['snap_token']);
        $this->assertEquals('Film Dari Snapshot Model', $resourceFromModel['movie_title']);
        $this->assertEquals(40000.0, $resourceFromModel['gross_amount']);
        $this->assertEquals(0.0, $resourceFromModel['discount_amount']);
        $this->assertEquals(40000.0, $resourceFromModel['net_amount']);
        $this->assertEquals(72, $resourceFromModel['rental_duration_hours']);
    }
}
