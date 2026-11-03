<?php

namespace Tests\Feature\Admin\Users;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\Schedule;
use App\Models\User;
use App\Models\UserMovieAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $secondSuperAdmin;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Utama',
            'email' => 'admin.prime@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081100000001',
            'is_phone_locked' => true,
        ]);

        $this->secondSuperAdmin = User::factory()->create([
            'name' => 'Super Admin Pendamping',
            'email' => 'admin.second@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081100000002',
            'is_phone_locked' => true,
        ]);

        $this->customer = User::factory()->create([
            'name' => 'Dimas Setiawan',
            'email' => 'dimas.setiawan@example.com',
            'role' => 'customer',
            'phone_number' => '081288492011',
            'is_phone_locked' => true,
            'birth_date' => '2000-04-12',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_admin_users_endpoints(): void
    {
        $this->getJson('/api/v1/admin/users')->assertStatus(401);
        $this->getJson('/api/v1/admin/users/1')->assertStatus(401);
        $this->putJson('/api/v1/admin/users/1/role', ['role' => 'customer'])->assertStatus(401);
    }

    public function test_customer_role_cannot_access_admin_users_and_receives_403(): void
    {
        $this->actingAs($this->customer, 'sanctum');

        $this->getJson('/api/v1/admin/users')
            ->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'FORBIDDEN_ROLE_ACCESS',
            ]);

        $this->getJson('/api/v1/admin/users/1')->assertStatus(403);
        $this->putJson('/api/v1/admin/users/1/role', ['role' => 'super_admin'])->assertStatus(403);
    }

    public function test_super_admin_can_list_users_with_standard_envelope(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $response = $this->getJson('/api/v1/admin/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'avatar_url',
                        'phone_number',
                        'is_phone_locked',
                        'birth_date',
                        'age',
                        'role',
                        'is_profile_completed',
                        'paid_ticket_orders_count',
                        'paid_movie_orders_count',
                        'total_paid_transactions',
                        'last_login_at',
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
                'message' => 'Daftar pengguna berhasil diambil.',
            ]);

        $this->assertEquals(3, $response->json('meta.total'));
        $this->assertArrayHasKey('summary', $response->json('meta'));
        $this->assertEquals(3, $response->json('meta.summary.total_users'));
        $this->assertArrayHasKey('total_orders_count', $response->json('data.0'));
    }

    public function test_super_admin_can_filter_users_by_role_and_phone_locked(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        User::factory()->create([
            'name' => 'User Belum Terkunci',
            'email' => 'unlocked@example.com',
            'role' => 'customer',
            'phone_number' => null,
            'is_phone_locked' => false,
        ]);

        // Filter role customer
        $resCustomer = $this->getJson('/api/v1/admin/users?role=customer');
        $resCustomer->assertStatus(200);
        $this->assertEquals(2, $resCustomer->json('meta.total'));

        // Filter role super_admin
        $resAdmin = $this->getJson('/api/v1/admin/users?role=super_admin');
        $resAdmin->assertStatus(200);
        $this->assertEquals(2, $resAdmin->json('meta.total'));

        // Filter is_phone_locked = false (boolean)
        $resUnlocked = $this->getJson('/api/v1/admin/users?is_phone_locked=false');
        $resUnlocked->assertStatus(200);
        $this->assertEquals(1, $resUnlocked->json('meta.total'));
        $this->assertEquals('unlocked@example.com', $resUnlocked->json('data.0.email'));

        // Filter is_phone_locked = true (boolean)
        $resLocked = $this->getJson('/api/v1/admin/users?is_phone_locked=true');
        $resLocked->assertStatus(200);
        $this->assertEquals(3, $resLocked->json('meta.total'));

        // Filter phone_locked = unlocked (frontend string param)
        $resFeUnlocked = $this->getJson('/api/v1/admin/users?phone_locked=unlocked');
        $resFeUnlocked->assertStatus(200);
        $this->assertEquals(1, $resFeUnlocked->json('meta.total'));

        // Filter phone_locked = locked (frontend string param)
        $resFeLocked = $this->getJson('/api/v1/admin/users?phone_locked=locked');
        $resFeLocked->assertStatus(200);
        $this->assertEquals(3, $resFeLocked->json('meta.total'));
    }

    public function test_super_admin_can_filter_users_by_search_query(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        // Search by name
        $resName = $this->getJson('/api/v1/admin/users?search=Dimas');
        $resName->assertStatus(200);
        $this->assertEquals(1, $resName->json('meta.total'));
        $this->assertEquals('Dimas Setiawan', $resName->json('data.0.name'));

        // Search by email
        $resEmail = $this->getJson('/api/v1/admin/users?search=admin.second');
        $resEmail->assertStatus(200);
        $this->assertEquals(1, $resEmail->json('meta.total'));
        $this->assertEquals('admin.second@sinemus.id', $resEmail->json('data.0.email'));

        // Search by phone
        $resPhone = $this->getJson('/api/v1/admin/users?search=88492011');
        $resPhone->assertStatus(200);
        $this->assertEquals(1, $resPhone->json('meta.total'));
        $this->assertEquals('081288492011', $resPhone->json('data.0.phone_number'));
    }

    public function test_super_admin_can_view_user_detail_with_transaction_history(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $movie = Movie::create([
            'slug' => 'film-sewa-test',
            'title' => 'Film Sewa Test',
            'synopsis' => 'Sinopsis',
            'poster_path' => 'movies/posters/test.jpg',
            'backdrop_path' => 'movies/backdrops/test.jpg',
            'director' => 'Sutradara Test',
            'cast' => ['Aktor 1'],
            'genre' => 'Drama',
            'age_rating' => '17+',
            'access_model' => 'rental',
            'duration_minutes' => 90,
            'price' => 20000,
            'rental_duration_hours' => 48,
            'cloudflare_video_uid' => 'cf-video-test-uid',
            'is_featured' => false,
            'release_year' => 2026,
            'is_published' => true,
        ]);

        $event = Event::create([
            'slug' => 'event-konser-indie',
            'event_type' => 'regular',
            'seating_type' => 'general_admission',
            'title' => 'Konser Sinemus Indie',
            'description' => 'Deskripsi konser',
            'synopsis_short' => 'Sinopsis konser',
            'poster_path' => 'events/posters/konser.jpg',
            'backdrop_path' => 'events/backdrops/konser.jpg',
            'director' => 'Director',
            'cast' => ['Cast 1'],
            'rules' => ['Rule 1'],
            'venue_name' => 'Venue Hall',
            'venue_address' => 'Jl. Merdeka No. 1',
            'city' => 'Jakarta Selatan',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'show_time' => now()->addDays(5),
            'ticket_price' => 50000,
            'total_seats' => 100,
            'is_active' => true,
        ]);

        // Buat pesanan tiket
        EventTransaction::create([
            'order_id' => 'SNM-TKT-2026-9999',
            'user_id' => $this->customer->id,
            'schedule_id' => $schedule->id,
            'ticket_quantity' => 2,
            'gross_amount' => 100000,
            'discount_amount' => 0,
            'net_amount' => 100000,
            'payment_status' => 'paid',
            'paid_at' => now()->subHours(2),
            'ticket_code' => 'TKT-9999',
            'checkin_status' => 'pending',
            'fulfillment_status' => 'fulfilled',
            'snapshot_event_data' => [
                'title' => $event->title,
            ],
        ]);

        // Buat pesanan sewa film
        $movieTx = MovieTransaction::create([
            'order_id' => 'SNM-VOD-2026-7777',
            'user_id' => $this->customer->id,
            'movie_id' => $movie->id,
            'gross_amount' => 20000,
            'discount_amount' => 0,
            'net_amount' => 20000,
            'payment_status' => 'paid',
            'paid_at' => now()->subHours(1),
            'snapshot_movie_data' => [
                'title' => $movie->title,
            ],
        ]);

        // Buat hak akses sewa film aktif
        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $movie->id,
            'transaction_id' => $movieTx->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subHours(1),
            'rental_expires_at' => now()->addHours(47),
        ]);

        $response = $this->getJson("/api/v1/admin/users/{$this->customer->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $this->customer->id,
                    'name' => 'Dimas Setiawan',
                    'email' => 'dimas.setiawan@example.com',
                    'paid_ticket_orders_count' => 1,
                    'paid_movie_orders_count' => 1,
                    'total_paid_transactions' => 2,
                    'total_orders_count' => 2,
                    'recent_orders' => [
                        [
                            'order_id' => 'SNM-TKT-2026-9999',
                            'order_type' => 'ticket',
                            'item_title' => 'Konser Sinemus Indie',
                            'payment_status' => 'paid',
                        ],
                        [
                            'order_id' => 'SNM-VOD-2026-7777',
                            'order_type' => 'movie_rental',
                            'item_title' => 'Film Sewa Test',
                            'payment_status' => 'paid',
                        ],
                    ],
                    'recent_ticket_transactions' => [
                        [
                            'order_id' => 'SNM-TKT-2026-9999',
                            'ticket_code' => 'TKT-9999',
                            'payment_status' => 'paid',
                        ],
                    ],
                    'recent_movie_transactions' => [
                        [
                            'order_id' => 'SNM-VOD-2026-7777',
                            'payment_status' => 'paid',
                        ],
                    ],
                    'active_movie_access' => [
                        [
                            'movie_id' => $movie->id,
                            'movie_title' => 'Film Sewa Test',
                            'access_status' => 'active',
                        ],
                    ],
                ],
            ]);
    }

    public function test_view_user_returns_404_if_not_found(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $this->getJson('/api/v1/admin/users/99999')->assertStatus(404);
    }

    public function test_super_admin_can_promote_customer_to_super_admin(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        $response = $this->putJson("/api/v1/admin/users/{$this->customer->id}/role", [
            'role' => 'super_admin',
            'admin_notes' => 'Promosi sebagai staf operasional baru',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Peran pengguna berhasil diperbarui.',
                'data' => [
                    'id' => $this->customer->id,
                    'role' => 'super_admin',
                ],
            ]);

        $this->assertEquals('super_admin', $this->customer->fresh()->role);
    }

    public function test_super_admin_can_be_demoted_if_another_super_admin_exists(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        // Demote secondSuperAdmin menjadi customer (karena masih ada superAdmin utama)
        $response = $this->putJson("/api/v1/admin/users/{$this->secondSuperAdmin->id}/role", [
            'role' => 'customer',
            'admin_notes' => 'Pencabutan hak admin staf',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Peran pengguna berhasil diperbarui.',
                'data' => [
                    'id' => $this->secondSuperAdmin->id,
                    'role' => 'customer',
                ],
            ]);

        $this->assertEquals('customer', $this->secondSuperAdmin->fresh()->role);
    }

    public function test_anti_lockout_protection_rejects_demoting_the_only_active_super_admin(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        // Hapus atau demote secondSuperAdmin terlebih dahulu sehingga tersisa hanya 1 super_admin
        $this->secondSuperAdmin->role = 'customer';
        $this->secondSuperAdmin->save();

        $this->assertEquals(1, User::where('role', 'super_admin')->count());

        // Coba demote superAdmin yang tersisa
        $response = $this->putJson("/api/v1/admin/users/{$this->superAdmin->id}/role", [
            'role' => 'customer',
            'admin_notes' => 'Percobaan pencabutan admin tunggal',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'SYSTEM_REQUIRES_ACTIVE_ADMIN',
                'message' => 'Tidak dapat mencabut hak akses: Sistem wajib memiliki minimal satu Super Admin aktif.',
            ]);

        // Pastikan role di database tetap super_admin
        $this->assertEquals('super_admin', $this->superAdmin->fresh()->role);
    }

    public function test_update_role_validates_required_and_valid_roles(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum');

        // Empty role
        $res1 = $this->putJson("/api/v1/admin/users/{$this->customer->id}/role", []);
        $res1->assertStatus(422)->assertJsonValidationErrors(['role']);

        // Invalid role string
        $res2 = $this->putJson("/api/v1/admin/users/{$this->customer->id}/role", [
            'role' => 'random_role',
        ]);
        $res2->assertStatus(422)->assertJsonValidationErrors(['role']);
    }
}
