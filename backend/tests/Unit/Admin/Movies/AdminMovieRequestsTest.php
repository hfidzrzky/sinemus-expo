<?php

namespace Tests\Unit\Admin\Movies;

use App\Http\Requests\Admin\V1\Movies\AdminMovieFilterRequest;
use App\Http\Requests\Admin\V1\Movies\GrantMovieAccessRequest;
use App\Http\Requests\Admin\V1\Movies\RevokeMovieAccessRequest;
use App\Http\Requests\Admin\V1\Movies\StoreMovieRequest;
use App\Http\Requests\Admin\V1\Movies\UpdateMovieRequest;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class AdminMovieRequestsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_movie_filter_request_sanitizes_and_validates_inputs(): void
    {
        $payload = [
            'search' => '   Laut Bercerita   ',
            'genre' => '  Drama  ',
            'is_published' => 'true',
            'page' => '2',
            'per_page' => '30',
        ];

        $request = AdminMovieFilterRequest::create('/api/v1/admin/movies', 'GET', $payload);
        $request->setContainer($this->app);
        $request->validateResolved();

        $this->assertEquals('Laut Bercerita', $request->input('search'));
        $this->assertEquals('Drama', $request->input('genre'));
        $this->assertTrue($request->input('is_published'));
        $this->assertEquals(30, $request->input('per_page'));
    }

    public function test_admin_movie_filter_request_enforces_bounds_on_per_page(): void
    {
        $rules = (new AdminMovieFilterRequest)->rules();

        $validatorExceed = Validator::make(['per_page' => 101], $rules);
        $this->assertTrue($validatorExceed->fails());
        $this->assertArrayHasKey('per_page', $validatorExceed->errors()->toArray());

        $validatorMin = Validator::make(['per_page' => 0], $rules);
        $this->assertTrue($validatorMin->fails());

        $validatorValid = Validator::make(['per_page' => 100], $rules);
        $this->assertFalse($validatorValid->fails());
    }

    public function test_store_movie_request_validates_and_normalizes_frontend_payload(): void
    {
        $payload = [
            'title' => 'Film Sinemus Original 2026',
            'slug' => 'film-sinemus-original-2026',
            'synopsis_full' => 'Ini adalah sinopsis lengkap film festival yang memikat dengan lebih dari dua puluh karakter.',
            'director' => 'Sutradara Indonesia',
            'cast' => [
                ['actor' => 'Reza Rahadian', 'role' => 'Pemeran Utama'],
                'Dian Sastrowardoyo',
            ],
            'genre' => ['Drama', 'Misteri'],
            'age_rating' => '17+',
            'release_year' => 2026,
            'duration_minutes' => 115,
            'poster_url' => 'https://imagedelivery.net/hash/poster-uid-123/public',
            'backdrop_url' => 'https://imagedelivery.net/hash/backdrop-uid-123/public',
            'cloudflare_video_uid' => 'C0A9482BF1092A884FBC990182BCF01A', // uppercase to test lowercase sanitization
            'cloudflare_trailer_uid' => '884BF92A019EEBC829910BFCD9281A99',
            'access_model' => 'rental',
            'rental_price' => 25000,
            'active_rental_duration_hours' => 72,
            'is_published' => true,
            'is_featured' => false,
        ];

        $request = StoreMovieRequest::create('/api/v1/admin/movies', 'POST', $payload);
        $request->setContainer($this->app);
        $request->validateResolved();

        // Verifikasi normalisasi alias frontend
        $this->assertEquals($payload['synopsis_full'], $request->input('synopsis'));
        $this->assertEquals($payload['poster_url'], $request->input('poster_path'));
        $this->assertEquals($payload['backdrop_url'], $request->input('backdrop_path'));
        $this->assertEquals(25000, $request->input('price'));
        $this->assertEquals(72, $request->input('rental_duration_hours'));

        // Verifikasi normalisasi cast
        $this->assertEquals([
            ['actor' => 'Reza Rahadian', 'role' => 'Pemeran Utama'],
            ['actor' => 'Dian Sastrowardoyo', 'role' => null],
        ], $request->input('cast'));

        // Verifikasi sanitasi UID Cloudflare menjadi lowercase
        $this->assertEquals('c0a9482bf1092a884fbc990182bcf01a', $request->input('cloudflare_video_uid'));
        $this->assertEquals('884bf92a019eebc829910bfcd9281a99', $request->input('cloudflare_trailer_uid'));
    }

    public function test_store_movie_request_rejects_invalid_cloudflare_uid_and_short_synopsis(): void
    {
        $payload = [
            'title' => 'Film Uji Coba',
            'synopsis' => 'Terlalu pendek', // < 20 karakter
            'director' => 'Sutradara',
            'cast' => ['Aktor 1'],
            'genre' => 'Drama',
            'age_rating' => 'INVALID_RATING',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'poster.jpg',
            'backdrop_path' => 'backdrop.jpg',
            'cloudflare_video_uid' => 'not-a-valid-hex-uid-invalid-char',
            'access_model' => 'unsupported_model',
            'price' => -5000,
        ];

        $rules = (new StoreMovieRequest)->rules();
        $validator = Validator::make($payload, $rules);

        $this->assertTrue($validator->fails());
        $errors = $validator->errors()->toArray();

        $this->assertArrayHasKey('synopsis', $errors);
        $this->assertArrayHasKey('age_rating', $errors);
        $this->assertArrayHasKey('cloudflare_video_uid', $errors);
        $this->assertArrayHasKey('access_model', $errors);
        $this->assertArrayHasKey('price', $errors);
    }

    public function test_update_movie_request_allows_same_slug_for_current_movie_and_rejects_duplicates(): void
    {
        $movie1 = Movie::create([
            'title' => 'Film Pertama',
            'slug' => 'film-pertama',
            'synopsis' => 'Sinopsis film pertama yang cukup panjang untuk memenuhi syarat validasi.',
            'director' => 'Sutradara 1',
            'cast' => ['Aktor A'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'poster1.jpg',
            'backdrop_path' => 'backdrop1.jpg',
            'cloudflare_video_uid' => '11111111111111111111111111111111',
            'access_model' => 'rental',
            'price' => 15000,
            'rental_duration_hours' => 48,
            'is_published' => true,
        ]);

        $movie2 = Movie::create([
            'title' => 'Film Kedua',
            'slug' => 'film-kedua',
            'synopsis' => 'Sinopsis film kedua yang cukup panjang untuk memenuhi syarat validasi.',
            'director' => 'Sutradara 2',
            'cast' => ['Aktor B'],
            'genre' => 'Horor',
            'age_rating' => '17+',
            'release_year' => 2026,
            'duration_minutes' => 100,
            'poster_path' => 'poster2.jpg',
            'backdrop_path' => 'backdrop2.jpg',
            'cloudflare_video_uid' => '22222222222222222222222222222222',
            'access_model' => 'rental',
            'price' => 20000,
            'rental_duration_hours' => 48,
            'is_published' => true,
        ]);

        // Uji 1: Mengupdate movie 1 dengan slug yang sama 'film-pertama' harus lolos
        $validUpdatePayload = [
            'title' => 'Film Pertama Diedit',
            'slug' => 'film-pertama',
            'synopsis' => 'Sinopsis film pertama yang telah diperbarui dengan teks panjang yang valid.',
            'director' => 'Sutradara 1 Revisi',
            'cast' => ['Aktor A', 'Aktor C'],
            'genre' => 'Drama',
            'age_rating' => '13+',
            'release_year' => 2026,
            'duration_minutes' => 95,
            'poster_path' => 'poster1_rev.jpg',
            'backdrop_path' => 'backdrop1_rev.jpg',
            'cloudflare_video_uid' => '11111111111111111111111111111111',
            'access_model' => 'rental',
            'price' => 18000,
        ];

        $request1 = UpdateMovieRequest::create("/api/v1/admin/movies/{$movie1->id}", 'PUT', $validUpdatePayload);
        $request1->setContainer($this->app);
        $route1 = new Route('PUT', 'api/v1/admin/movies/{id}', []);
        $route1->bind($request1);
        $route1->setParameter('id', (string) $movie1->id);
        $request1->setRouteResolver(fn () => $route1);
        $request1->validateResolved();

        $this->assertEquals('film-pertama', $request1->input('slug'));

        // Uji 2: Mengupdate movie 1 dengan slug milik movie 2 'film-kedua' harus gagal
        $conflictPayload = $validUpdatePayload;
        $conflictPayload['slug'] = 'film-kedua';

        $request2 = UpdateMovieRequest::create("/api/v1/admin/movies/{$movie1->id}", 'PUT', $conflictPayload);
        $request2->setContainer($this->app);
        $request2->setRouteResolver(fn () => $route1);

        $validator = Validator::make($conflictPayload, $request2->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('slug', $validator->errors()->toArray());
    }

    public function test_grant_movie_access_request_validates_existence_and_duration(): void
    {
        $user = User::factory()->create();
        $movie = Movie::create([
            'title' => 'Film Spesial',
            'slug' => 'film-spesial',
            'synopsis' => 'Sinopsis film spesial berdurasi panjang untuk pengujian akses langsung.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 85,
            'poster_path' => 'poster.jpg',
            'backdrop_path' => 'backdrop.jpg',
            'cloudflare_video_uid' => '33333333333333333333333333333333',
            'access_model' => 'rental',
            'price' => 20000,
            'rental_duration_hours' => 48,
            'is_published' => true,
        ]);

        // Valid payload
        $validPayload = [
            'user_id' => $user->id,
            'movie_id' => $movie->id,
            'duration_hours' => 72,
            'admin_notes' => '  Akses reviewer film pers  ',
        ];

        $request = GrantMovieAccessRequest::create('/api/v1/admin/movie-access/grant', 'POST', $validPayload);
        $request->setContainer($this->app);
        $request->validateResolved();

        $this->assertEquals($user->id, $request->input('user_id'));
        $this->assertEquals($movie->id, $request->input('movie_id'));
        $this->assertEquals(72, $request->input('duration_hours'));
        $this->assertEquals('Akses reviewer film pers', $request->input('admin_notes'));

        // Invalid payload: non-existent IDs and invalid duration
        $invalidPayload = [
            'user_id' => 999999,
            'movie_id' => 888888,
            'duration_hours' => 9999, // > 720
        ];

        $validator = Validator::make($invalidPayload, (new GrantMovieAccessRequest)->rules());
        $this->assertTrue($validator->fails());
        $errors = $validator->errors()->toArray();

        $this->assertArrayHasKey('user_id', $errors);
        $this->assertArrayHasKey('movie_id', $errors);
        $this->assertArrayHasKey('duration_hours', $errors);
    }

    public function test_revoke_movie_access_request_validates_reason_enums(): void
    {
        $validReasons = ['refund', 'violation', 'system_error', 'manual_admin'];

        foreach ($validReasons as $reason) {
            $payload = [
                'revoke_reason' => $reason,
                'admin_notes' => '  Catatan penarikan akses  ',
            ];

            $request = RevokeMovieAccessRequest::create('/api/v1/admin/movie-access/1/revoke', 'POST', $payload);
            $request->setContainer($this->app);
            $request->validateResolved();

            $this->assertEquals($reason, $request->input('revoke_reason'));
            $this->assertEquals('Catatan penarikan akses', $request->input('admin_notes'));
        }

        // Invalid reason
        $invalidPayload = [
            'revoke_reason' => 'invalid_random_reason',
        ];

        $validator = Validator::make($invalidPayload, (new RevokeMovieAccessRequest)->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('revoke_reason', $validator->errors()->toArray());
    }
}
