<?php

namespace Tests\Feature\Movies;

use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PruneExpiredMovieRentalsCommandTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Movie $movie;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => 'customer',
        ]);

        $this->movie = Movie::create([
            'slug' => 'test-movie-prune',
            'title' => 'Test Movie Prune',
            'synopsis' => 'Test synopsis',
            'poster_path' => 'poster.jpg',
            'backdrop_path' => 'backdrop.jpg',
            'director' => 'Test Director',
            'cast' => ['Actor 1'],
            'genre' => 'Action',
            'duration_minutes' => 90,
            'price' => 20000,
            'rental_duration_hours' => 48,
            'access_model' => 'rental',
            'cloudflare_video_uid' => 'video_uid_123',
            'release_year' => 2026,
            'age_rating' => '13+',
            'is_published' => true,
        ]);
    }

    public function test_prunes_stale_pending_movie_rentals_older_than_15_minutes(): void
    {
        // 1. Transaksi pending > 15 menit (harus di-expire)
        $staleTx = MovieTransaction::create([
            'order_id' => 'SNM-VOD-STALE-01',
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'gross_amount' => 20000,
            'discount_amount' => 0,
            'net_amount' => 20000,
            'payment_status' => 'pending',
            'snapshot_movie_data' => $this->movie->toArray(),
        ]);
        DB::table('movie_transactions')->where('id', $staleTx->id)->update([
            'created_at' => now()->subMinutes(20),
            'updated_at' => now()->subMinutes(20),
        ]);

        // 2. Transaksi pending baru < 15 menit (tetap pending)
        $recentTx = MovieTransaction::create([
            'order_id' => 'SNM-VOD-RECENT-01',
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'gross_amount' => 20000,
            'discount_amount' => 0,
            'net_amount' => 20000,
            'payment_status' => 'pending',
            'snapshot_movie_data' => $this->movie->toArray(),
        ]);
        DB::table('movie_transactions')->where('id', $recentTx->id)->update([
            'created_at' => now()->subMinutes(5),
            'updated_at' => now()->subMinutes(5),
        ]);

        // 3. Transaksi paid (tetap paid)
        $paidTx = MovieTransaction::create([
            'order_id' => 'SNM-VOD-PAID-01',
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'gross_amount' => 20000,
            'discount_amount' => 0,
            'net_amount' => 20000,
            'payment_status' => 'paid',
            'paid_at' => now()->subMinutes(30),
            'snapshot_movie_data' => $this->movie->toArray(),
        ]);
        DB::table('movie_transactions')->where('id', $paidTx->id)->update([
            'created_at' => now()->subMinutes(30),
            'updated_at' => now()->subMinutes(30),
        ]);

        $this->artisan('movies:prune-expired-orders')
            ->expectsOutput('Berhasil memperbarui 1 transaksi sewa film pending kedaluwarsa (>15m) menjadi expired.')
            ->assertSuccessful();

        $this->assertDatabaseHas('movie_transactions', [
            'id' => $staleTx->id,
            'payment_status' => 'expired',
        ]);

        $this->assertDatabaseHas('movie_transactions', [
            'id' => $recentTx->id,
            'payment_status' => 'pending',
        ]);

        $this->assertDatabaseHas('movie_transactions', [
            'id' => $paidTx->id,
            'payment_status' => 'paid',
        ]);
    }

    public function test_prunes_with_custom_minutes_option(): void
    {
        $tx = MovieTransaction::create([
            'order_id' => 'SNM-VOD-CUSTOM-01',
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'gross_amount' => 20000,
            'discount_amount' => 0,
            'net_amount' => 20000,
            'payment_status' => 'pending',
            'snapshot_movie_data' => $this->movie->toArray(),
        ]);
        DB::table('movie_transactions')->where('id', $tx->id)->update([
            'created_at' => now()->subMinutes(10),
            'updated_at' => now()->subMinutes(10),
        ]);

        // Menit 15 tidak menyentuh tx (karena baru 10m)
        $this->artisan('movies:prune-expired-orders --minutes=15')
            ->expectsOutput('Berhasil memperbarui 0 transaksi sewa film pending kedaluwarsa (>15m) menjadi expired.')
            ->assertSuccessful();

        $this->assertDatabaseHas('movie_transactions', [
            'id' => $tx->id,
            'payment_status' => 'pending',
        ]);

        // Menit 5 menyentuh tx (karena sudah 10m)
        $this->artisan('movies:prune-expired-orders --minutes=5')
            ->expectsOutput('Berhasil memperbarui 1 transaksi sewa film pending kedaluwarsa (>5m) menjadi expired.')
            ->assertSuccessful();

        $this->assertDatabaseHas('movie_transactions', [
            'id' => $tx->id,
            'payment_status' => 'expired',
        ]);
    }
}
