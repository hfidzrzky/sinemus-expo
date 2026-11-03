<?php

namespace Tests\Unit\Admin\Movies;

use App\Models\Movie;
use App\Models\User;
use App\Models\UserMovieAccess;
use App\Services\Admin\Movies\AdminMovieAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMovieAccessServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AdminMovieAccessService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AdminMovieAccessService;
    }

    public function test_grant_access_creates_new_active_access_with_given_duration(): void
    {
        $user = User::factory()->create();
        $movie = Movie::create([
            'title' => 'Film Spesial Giveaway',
            'slug' => 'film-spesial-giveaway',
            'synopsis' => 'Sinopsis film giveaway reviewer berdurasi panjang.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '11111111111111111111111111111111',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        $access = $this->service->grantAccess(
            userId: $user->id,
            movieId: $movie->id,
            durationHours: 72,
            notes: 'Akses promosi pers'
        );

        $this->assertNotNull($access->id);
        $this->assertEquals($user->id, $access->user_id);
        $this->assertEquals($movie->id, $access->movie_id);
        $this->assertEquals('active', $access->access_status);
        $this->assertEquals('Akses promosi pers', $access->admin_notes);
        $this->assertTrue($access->rental_expires_at->isAfter(now()->addHours(71)));
        $this->assertNull($access->transaction_id);
    }

    public function test_grant_access_updates_existing_access_record(): void
    {
        $user = User::factory()->create();
        $movie = Movie::create([
            'title' => 'Film Uji Coba',
            'slug' => 'film-uji-coba',
            'synopsis' => 'Sinopsis film uji coba pembaruan akses.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '22222222222222222222222222222222',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        // Buat record expired terdahulu
        UserMovieAccess::create([
            'user_id' => $user->id,
            'movie_id' => $movie->id,
            'access_status' => 'expired',
            'rental_start_at' => now()->subDays(5),
            'rental_expires_at' => now()->subDays(3),
            'revoke_reason' => 'none',
        ]);

        $access = $this->service->grantAccess(
            userId: $user->id,
            movieId: $movie->id,
            durationHours: 48,
            notes: 'Perpanjangan hak sewa oleh Super Admin'
        );

        $this->assertEquals('active', $access->access_status);
        $this->assertEquals('Perpanjangan hak sewa oleh Super Admin', $access->admin_notes);
        $this->assertTrue($access->rental_expires_at->isAfter(now()->addHours(47)));

        // Pastikan tidak ada duplikasi row berlebih
        $this->assertEquals(1, UserMovieAccess::where('user_id', $user->id)->where('movie_id', $movie->id)->count());
    }

    public function test_revoke_access_updates_status_and_reason(): void
    {
        $user = User::factory()->create();
        $movie = Movie::create([
            'title' => 'Film Cabut Akses',
            'slug' => 'film-cabut-akses',
            'synopsis' => 'Sinopsis film untuk pengujian pencabutan akses.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '33333333333333333333333333333333',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        $access = UserMovieAccess::create([
            'user_id' => $user->id,
            'movie_id' => $movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
            'revoke_reason' => 'none',
        ]);

        $revoked = $this->service->revokeAccess(
            accessId: $access->id,
            reason: 'refund',
            notes: 'Pengembalian dana disetujui'
        );

        $this->assertEquals('revoked', $revoked->access_status);
        $this->assertEquals('refund', $revoked->revoke_reason);
        $this->assertEquals('Pengembalian dana disetujui', $revoked->admin_notes);
        $this->assertNotNull($revoked->revoked_at);
    }

    public function test_get_access_list_filters_by_user_movie_and_status(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $movie1 = Movie::create([
            'title' => 'Film A',
            'slug' => 'film-a',
            'synopsis' => 'Sinopsis film A.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '44444444444444444444444444444444',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        $movie2 = Movie::create([
            'title' => 'Film B',
            'slug' => 'film-b',
            'synopsis' => 'Sinopsis film B.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '55555555555555555555555555555555',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        UserMovieAccess::create([
            'user_id' => $user1->id,
            'movie_id' => $movie1->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
        ]);

        UserMovieAccess::create([
            'user_id' => $user2->id,
            'movie_id' => $movie2->id,
            'access_status' => 'revoked',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
            'revoke_reason' => 'violation',
        ]);

        // Filter user1
        $listUser1 = $this->service->getAccessList(userId: $user1->id);
        $this->assertEquals(1, $listUser1->total());
        $this->assertEquals($movie1->id, $listUser1->first()->movie_id);

        // Filter status active
        $listActive = $this->service->getAccessList(status: 'active');
        $this->assertEquals(1, $listActive->total());
        $this->assertEquals('active', $listActive->first()->access_status);

        // Filter movie2
        $listMovie2 = $this->service->getAccessList(movieId: $movie2->id);
        $this->assertEquals(1, $listMovie2->total());
        $this->assertEquals('revoked', $listMovie2->first()->access_status);
    }
}
