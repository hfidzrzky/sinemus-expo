<?php

namespace Tests\Unit\Admin\Movies;

use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\User;
use App\Models\UserMovieAccess;
use App\Services\Admin\Movies\AdminMovieService;
use App\Services\Cloudflare\CloudflareStreamService;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class AdminMovieServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AdminMovieService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $streamMock = Mockery::mock(CloudflareStreamService::class);
        $streamMock->shouldReceive('verifyVideo')->andReturnNull();

        $this->service = new AdminMovieService($streamMock);
    }

    public function test_create_movie_generates_auto_slug_when_not_provided(): void
    {
        $data = [
            'title' => 'Film Festival Bandung 2026',
            'synopsis' => 'Sinopsis film festival yang bercerita tentang seni peran dan budaya lokal.',
            'director' => 'Sutradara Muda',
            'cast' => ['Aktor 1', 'Aktor 2'],
            'genre' => 'Drama',
            'age_rating' => '13+',
            'release_year' => 2026,
            'duration_minutes' => 95,
            'poster_path' => 'poster.jpg',
            'backdrop_path' => 'backdrop.jpg',
            'cloudflare_video_uid' => '11111111111111111111111111111111',
            'access_model' => 'rental',
            'price' => 20000,
        ];

        $movie = $this->service->createMovie($data);

        $this->assertNotNull($movie->id);
        $this->assertEquals('film-festival-bandung-2026', $movie->slug);
    }

    public function test_create_movie_resolves_slug_collision(): void
    {
        // Buat film pertama dengan slug yang sama
        Movie::create([
            'title' => 'Kisah Tanah Jawa',
            'slug' => 'kisah-tanah-jawa',
            'synopsis' => 'Sinopsis film pertama kisah tanah jawa yang panjang.',
            'director' => 'Sutradara 1',
            'cast' => ['Aktor 1'],
            'genre' => 'Horor',
            'age_rating' => '17+',
            'release_year' => 2026,
            'duration_minutes' => 100,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '11111111111111111111111111111111',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        $movie2 = $this->service->createMovie([
            'title' => 'Kisah Tanah Jawa',
            'synopsis' => 'Sinopsis film kedua dengan judul yang sama persis.',
            'director' => 'Sutradara 2',
            'cast' => ['Aktor 2'],
            'genre' => 'Horor',
            'age_rating' => '17+',
            'release_year' => 2026,
            'duration_minutes' => 105,
            'poster_path' => 'p2.jpg',
            'backdrop_path' => 'b2.jpg',
            'cloudflare_video_uid' => '22222222222222222222222222222222',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        $this->assertEquals('kisah-tanah-jawa-1', $movie2->slug);
    }

    public function test_create_movie_normalizes_array_genre(): void
    {
        $movie = $this->service->createMovie([
            'title' => 'Petualangan Rimba',
            'synopsis' => 'Sinopsis petualangan rimba yang memukau dan informatif.',
            'director' => 'Sutradara Rimba',
            'cast' => ['Aktor A'],
            'genre' => ['Dokumenter', 'Petualangan'],
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 80,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '33333333333333333333333333333333',
            'access_model' => 'free',
            'price' => 0,
        ]);

        $this->assertEquals('Dokumenter, Petualangan', $movie->genre);
    }

    public function test_update_movie_updates_attributes_and_genre(): void
    {
        $movie = Movie::create([
            'title' => 'Judul Awal',
            'slug' => 'judul-awal',
            'synopsis' => 'Sinopsis awal yang memadai sebelum diperbarui.',
            'director' => 'Sutradara Awal',
            'cast' => ['Aktor Awal'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '44444444444444444444444444444444',
            'access_model' => 'rental',
            'price' => 15000,
        ]);

        $updated = $this->service->updateMovie($movie->id, [
            'title' => 'Judul Baru Revisi',
            'price' => 30000,
            'genre' => ['Drama', 'Romansa'],
        ]);

        $this->assertEquals('Judul Baru Revisi', $updated->title);
        $this->assertEquals(30000, (int) $updated->price);
        $this->assertEquals('Drama, Romansa', $updated->genre);
    }

    public function test_delete_movie_succeeds_when_no_transactions_or_rentals(): void
    {
        $movie = Movie::create([
            'title' => 'Film Siap Hapus',
            'slug' => 'film-siap-hapus',
            'synopsis' => 'Sinopsis film tanpa riwayat pesanan yang dapat dihapus.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 60,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '55555555555555555555555555555555',
            'access_model' => 'free',
            'price' => 0,
        ]);

        $result = $this->service->deleteMovie($movie->id);

        $this->assertTrue($result);
        $this->assertNull(Movie::find($movie->id));
    }

    public function test_delete_movie_throws_domain_exception_when_has_paid_transaction(): void
    {
        $user = User::factory()->create();
        $movie = Movie::create([
            'title' => 'Film Ada Transaksi',
            'slug' => 'film-ada-transaksi',
            'synopsis' => 'Sinopsis film yang memiliki pesanan lunas dari penonton.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '66666666666666666666666666666666',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        MovieTransaction::create([
            'order_id' => 'SNM-VOD-2026-TEST01',
            'user_id' => $user->id,
            'movie_id' => $movie->id,
            'gross_amount' => 25000,
            'discount_amount' => 0,
            'net_amount' => 25000,
            'payment_status' => 'paid',
            'snap_token' => 'mock_snap_token',
            'snapshot_movie_data' => ['title' => $movie->title],
        ]);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('memiliki riwayat transaksi sewa penonton');

        $this->service->deleteMovie($movie->id);
    }

    public function test_delete_movie_throws_domain_exception_when_has_active_rental(): void
    {
        $user = User::factory()->create();
        $movie = Movie::create([
            'title' => 'Film Ada Sewa Aktif',
            'slug' => 'film-ada-sewa-aktif',
            'synopsis' => 'Sinopsis film yang memiliki hak sewa aktif dari penonton.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '77777777777777777777777777777777',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        UserMovieAccess::create([
            'user_id' => $user->id,
            'movie_id' => $movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(24),
            'revoke_reason' => 'none',
        ]);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('memiliki riwayat hak sewa penonton');

        $this->service->deleteMovie($movie->id);
    }

    public function test_get_admin_movies_filters_correctly(): void
    {
        Movie::create([
            'title' => 'Laskar Pelangi',
            'slug' => 'laskar-pelangi',
            'synopsis' => 'Sinopsis laskar pelangi inspiratif di pulau belitung.',
            'director' => 'Riri Riza',
            'cast' => ['Aktor Cilik'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2008,
            'duration_minutes' => 120,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '88888888888888888888888888888888',
            'access_model' => 'rental',
            'price' => 20000,
            'is_published' => true,
        ]);

        Movie::create([
            'title' => 'Pengabdi Setan',
            'slug' => 'pengabdi-setan',
            'synopsis' => 'Sinopsis pengabdi setan karya joko anwar.',
            'director' => 'Joko Anwar',
            'cast' => ['Tara Basro'],
            'genre' => 'Horor',
            'age_rating' => '17+',
            'release_year' => 2017,
            'duration_minutes' => 105,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '99999999999999999999999999999999',
            'access_model' => 'rental',
            'price' => 25000,
            'is_published' => false,
        ]);

        // Filter search
        $searchResult = $this->service->getAdminMovies(search: 'Pelangi');
        $this->assertEquals(1, $searchResult->total());
        $this->assertEquals('Laskar Pelangi', $searchResult->items()[0]->title);

        // Filter genre
        $genreResult = $this->service->getAdminMovies(genre: 'Horor');
        $this->assertEquals(1, $genreResult->total());
        $this->assertEquals('Pengabdi Setan', $genreResult->items()[0]->title);

        // Filter is_published
        $publishedResult = $this->service->getAdminMovies(isPublished: true);
        $this->assertEquals(1, $publishedResult->total());
    }

    public function test_get_admin_movies_and_get_movie_by_id_include_active_rentals_count(): void
    {
        $movie = Movie::create([
            'title' => 'Film Hit 2026',
            'slug' => 'film-hit-2026',
            'synopsis' => 'Sinopsis film hit dengan penonton aktif.',
            'director' => 'Sutradara Handal',
            'cast' => ['Aktor Terkenal'],
            'genre' => 'Aksi',
            'age_rating' => '13+',
            'release_year' => 2026,
            'duration_minutes' => 110,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '12121212121212121212121212121212',
            'access_model' => 'rental',
            'price' => 30000,
            'is_published' => true,
        ]);

        $u1 = User::factory()->create();
        $u2 = User::factory()->create();
        $u3 = User::factory()->create();

        // 1. Sewa aktif
        UserMovieAccess::create([
            'user_id' => $u1->id,
            'movie_id' => $movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
            'revoke_reason' => 'none',
        ]);

        // 2. Free grant aktif
        UserMovieAccess::create([
            'user_id' => $u2->id,
            'movie_id' => $movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(24),
            'revoke_reason' => 'none',
        ]);

        // 3. Sewa kadaluarsa
        UserMovieAccess::create([
            'user_id' => $u3->id,
            'movie_id' => $movie->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subHours(60),
            'rental_expires_at' => now()->subHours(12),
            'revoke_reason' => 'none',
        ]);

        $paginator = $this->service->getAdminMovies();
        $firstItem = collect($paginator->items())->firstWhere('id', $movie->id);

        $this->assertNotNull($firstItem);
        $this->assertEquals(2, $firstItem->active_rentals_count);

        $movieDetail = $this->service->getMovieById($movie->id);
        $this->assertEquals(2, $movieDetail->active_rentals_count);
    }
}
