<?php

namespace Tests\Feature\Admin\Vouchers;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\Schedule;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminVoucherTest extends TestCase
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
    }

    public function test_unauthenticated_user_cannot_access_vouchers_endpoints(): void
    {
        $this->getJson('/api/v1/admin/vouchers')->assertStatus(401);
        $this->postJson('/api/v1/admin/vouchers', [])->assertStatus(401);
        $this->getJson('/api/v1/admin/vouchers/1')->assertStatus(401);
        $this->putJson('/api/v1/admin/vouchers/1', [])->assertStatus(401);
        $this->deleteJson('/api/v1/admin/vouchers/1')->assertStatus(401);
    }

    public function test_customer_role_cannot_access_vouchers_endpoints(): void
    {
        $this->actingAs($this->customer);

        $this->getJson('/api/v1/admin/vouchers')->assertStatus(403);
        $this->postJson('/api/v1/admin/vouchers', [])->assertStatus(403);
        $this->getJson('/api/v1/admin/vouchers/1')->assertStatus(403);
        $this->putJson('/api/v1/admin/vouchers/1', [])->assertStatus(403);
        $this->deleteJson('/api/v1/admin/vouchers/1')->assertStatus(403);
    }

    public function test_super_admin_can_list_vouchers_with_standard_envelope(): void
    {
        $this->actingAs($this->superAdmin);

        Voucher::create([
            'code' => 'VOUCHER10',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 50000,
            'max_discount' => 20000,
            'item_type' => 'all',
            'quota_total' => 100,
            'quota_used' => 10,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/admin/vouchers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'code',
                        'discount_type',
                        'discount_value',
                        'formatted_discount',
                        'min_purchase',
                        'formatted_min_purchase',
                        'max_discount',
                        'formatted_max_discount',
                        'item_type',
                        'item_type_label',
                        'quota_total',
                        'quota_used',
                        'quota_remaining',
                        'usage_percentage',
                        'valid_from',
                        'valid_until',
                        'is_active',
                        'is_expired',
                        'is_exhausted',
                        'status',
                        'created_at',
                        'updated_at',
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

        $this->assertTrue($response->json('success'));
        $this->assertEquals(1, $response->json('meta.total'));
        $this->assertEquals('VOUCHER10', $response->json('data.0.code'));
        $this->assertEquals(90, $response->json('data.0.quota_remaining'));
        $this->assertEquals(10.0, $response->json('data.0.usage_percentage'));
    }

    public function test_super_admin_can_filter_vouchers_by_search_code(): void
    {
        $this->actingAs($this->superAdmin);

        Voucher::create([
            'code' => 'PROMOBIOSKOP',
            'discount_type' => 'percentage',
            'discount_value' => 20,
            'min_purchase' => 0,
            'item_type' => 'ticket',
            'quota_total' => 50,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        Voucher::create([
            'code' => 'SEWAVODHEMAT',
            'discount_type' => 'fixed',
            'discount_value' => 5000,
            'min_purchase' => 15000,
            'item_type' => 'movie_rental',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $res = $this->getJson('/api/v1/admin/vouchers?search=PROMO');
        $res->assertStatus(200);
        $this->assertCount(1, $res->json('data'));
        $this->assertEquals('PROMOBIOSKOP', $res->json('data.0.code'));
    }

    public function test_super_admin_can_filter_vouchers_by_status(): void
    {
        $this->actingAs($this->superAdmin);

        // Active
        Voucher::create([
            'code' => 'ACTIVE10',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 50,
            'quota_used' => 5,
            'valid_from' => now()->subDays(2),
            'valid_until' => now()->addDays(2),
            'is_active' => true,
        ]);

        // Expired
        Voucher::create([
            'code' => 'EXPIRED10',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 50,
            'quota_used' => 0,
            'valid_from' => now()->subDays(10),
            'valid_until' => now()->subDays(1),
            'is_active' => true,
        ]);

        // Exhausted
        Voucher::create([
            'code' => 'EXHAUSTED10',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 20,
            'quota_used' => 20,
            'valid_from' => now()->subDays(2),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        // Inactive
        Voucher::create([
            'code' => 'INACTIVE10',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 50,
            'quota_used' => 0,
            'valid_from' => now()->subDays(2),
            'valid_until' => now()->addDays(5),
            'is_active' => false,
        ]);

        $resActive = $this->getJson('/api/v1/admin/vouchers?status=active');
        $resActive->assertStatus(200);
        $this->assertEquals(1, $resActive->json('meta.total'));
        $this->assertEquals('ACTIVE10', $resActive->json('data.0.code'));

        $resExpired = $this->getJson('/api/v1/admin/vouchers?status=expired');
        $resExpired->assertStatus(200);
        $this->assertEquals(1, $resExpired->json('meta.total'));
        $this->assertEquals('EXPIRED10', $resExpired->json('data.0.code'));

        $resExhausted = $this->getJson('/api/v1/admin/vouchers?status=exhausted');
        $resExhausted->assertStatus(200);
        $this->assertEquals(1, $resExhausted->json('meta.total'));
        $this->assertEquals('EXHAUSTED10', $resExhausted->json('data.0.code'));

        $resInactive = $this->getJson('/api/v1/admin/vouchers?status=inactive');
        $resInactive->assertStatus(200);
        $this->assertEquals(1, $resInactive->json('meta.total'));
        $this->assertEquals('INACTIVE10', $resInactive->json('data.0.code'));
    }

    public function test_super_admin_can_create_percentage_voucher_successfully(): void
    {
        $this->actingAs($this->superAdmin);

        $payload = [
            'code' => 'cinemaxxi20',
            'discount_type' => 'percentage',
            'discount_value' => 20,
            'min_purchase' => 100000,
            'max_discount' => 25000,
            'item_type' => 'ticket',
            'quota_total' => 200,
            'valid_from' => now()->startOfDay()->toIso8601String(),
            'valid_until' => now()->addDays(30)->endOfDay()->toIso8601String(),
            'is_active' => true,
        ];

        $response = $this->postJson('/api/v1/admin/vouchers', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'CINEMAXXI20') // Code auto-uppercased
            ->assertJsonPath('data.discount_type', 'percentage')
            ->assertJsonPath('data.discount_value', 20)
            ->assertJsonPath('data.quota_total', 200)
            ->assertJsonPath('data.quota_used', 0)
            ->assertJsonPath('data.quota_remaining', 200)
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('vouchers', [
            'code' => 'CINEMAXXI20',
            'quota_total' => 200,
            'quota_used' => 0,
        ]);
    }

    public function test_super_admin_can_create_fixed_discount_voucher_successfully(): void
    {
        $this->actingAs($this->superAdmin);

        $payload = [
            'code' => 'POTONGAN15K',
            'discount_type' => 'fixed',
            'discount_value' => 15000,
            'min_purchase' => 50000,
            'max_discount' => null,
            'item_type' => 'all',
            'quota_total' => 50,
            'valid_from' => now()->startOfDay()->toIso8601String(),
            'valid_until' => now()->addDays(14)->endOfDay()->toIso8601String(),
            'is_active' => true,
        ];

        $response = $this->postJson('/api/v1/admin/vouchers', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'POTONGAN15K')
            ->assertJsonPath('data.discount_type', 'fixed')
            ->assertJsonPath('data.discount_value', 15000)
            ->assertJsonPath('data.formatted_discount', 'Rp 15.000');

        $this->assertDatabaseHas('vouchers', [
            'code' => 'POTONGAN15K',
            'discount_type' => 'fixed',
            'discount_value' => 15000.00,
        ]);
    }

    public function test_super_admin_can_create_slashed_price_voucher_successfully(): void
    {
        $this->actingAs($this->superAdmin);

        $payload = [
            'code' => 'CORET25K',
            'discount_type' => 'slashed_price',
            'discount_value' => 25000,
            'min_purchase' => 30000,
            'item_type' => 'ticket',
            'quota_total' => 100,
            'valid_from' => now()->startOfDay()->toIso8601String(),
            'valid_until' => now()->addDays(14)->endOfDay()->toIso8601String(),
            'is_active' => true,
        ];

        $response = $this->postJson('/api/v1/admin/vouchers', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'CORET25K')
            ->assertJsonPath('data.discount_type', 'slashed_price')
            ->assertJsonPath('data.discount_value', 25000)
            ->assertJsonPath('data.formatted_discount', 'Coret: Rp 25.000');

        $this->assertDatabaseHas('vouchers', [
            'code' => 'CORET25K',
            'discount_type' => 'slashed_price',
            'discount_value' => 25000.00,
        ]);
    }

    public function test_store_voucher_validates_required_fields(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->postJson('/api/v1/admin/vouchers', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'code',
                'discount_type',
                'discount_value',
                'min_purchase',
                'item_type',
                'quota_total',
                'valid_from',
                'valid_until',
            ]);
    }

    public function test_store_voucher_rejects_duplicate_code(): void
    {
        $this->actingAs($this->superAdmin);

        Voucher::create([
            'code' => 'DUPLICATE20',
            'discount_type' => 'percentage',
            'discount_value' => 20,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 50,
            'quota_used' => 0,
            'valid_from' => now(),
            'valid_until' => now()->addDays(5),
            'is_active' => true,
        ]);

        $payload = [
            'code' => 'duplicate20', // Should be treated as duplicate after uppercase
            'discount_type' => 'percentage',
            'discount_value' => 20,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 50,
            'valid_from' => now()->toIso8601String(),
            'valid_until' => now()->addDays(5)->toIso8601String(),
        ];

        $response = $this->postJson('/api/v1/admin/vouchers', $payload);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_store_voucher_rejects_percentage_greater_than_100(): void
    {
        $this->actingAs($this->superAdmin);

        $payload = [
            'code' => 'CRAZYDISCOUNT',
            'discount_type' => 'percentage',
            'discount_value' => 150, // Invalid!
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 50,
            'valid_from' => now()->toIso8601String(),
            'valid_until' => now()->addDays(5)->toIso8601String(),
        ];

        $response = $this->postJson('/api/v1/admin/vouchers', $payload);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['discount_value']);
    }

    public function test_store_voucher_rejects_valid_until_before_valid_from(): void
    {
        $this->actingAs($this->superAdmin);

        $payload = [
            'code' => 'TIMETRAVEL',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 50,
            'valid_from' => now()->addDays(5)->toIso8601String(),
            'valid_until' => now()->subDay()->toIso8601String(), // Invalid!
        ];

        $response = $this->postJson('/api/v1/admin/vouchers', $payload);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['valid_until']);
    }

    public function test_super_admin_can_view_voucher_detail(): void
    {
        $this->actingAs($this->superAdmin);

        $voucher = Voucher::create([
            'code' => 'DETAILVOUCHER',
            'discount_type' => 'percentage',
            'discount_value' => 25,
            'min_purchase' => 75000,
            'max_discount' => 30000,
            'item_type' => 'ticket',
            'quota_total' => 150,
            'quota_used' => 45,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(15),
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/admin/vouchers/{$voucher->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $voucher->id)
            ->assertJsonPath('data.code', 'DETAILVOUCHER')
            ->assertJsonPath('data.quota_used', 45)
            ->assertJsonPath('data.quota_remaining', 105)
            ->assertJsonPath('data.usage_percentage', 30);
    }

    public function test_view_voucher_returns_404_if_not_found(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->getJson('/api/v1/admin/vouchers/99999');
        $response->assertStatus(404);
    }

    public function test_super_admin_can_update_voucher(): void
    {
        $this->actingAs($this->superAdmin);

        $voucher = Voucher::create([
            'code' => 'BEFOREUPDATE',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 20000,
            'max_discount' => 10000,
            'item_type' => 'all',
            'quota_total' => 100,
            'quota_used' => 10,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        $updatePayload = [
            'code' => 'AFTERUPDATE',
            'discount_value' => 15,
            'quota_total' => 150,
            'min_purchase' => 30000,
        ];

        $response = $this->putJson("/api/v1/admin/vouchers/{$voucher->id}", $updatePayload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'AFTERUPDATE')
            ->assertJsonPath('data.discount_value', 15)
            ->assertJsonPath('data.quota_total', 150)
            ->assertJsonPath('data.quota_remaining', 140);

        $this->assertDatabaseHas('vouchers', [
            'id' => $voucher->id,
            'code' => 'AFTERUPDATE',
            'discount_value' => 15.00,
            'quota_total' => 150,
        ]);
    }

    public function test_update_voucher_rejects_reducing_quota_below_used(): void
    {
        $this->actingAs($this->superAdmin);

        $voucher = Voucher::create([
            'code' => 'QUOTAGUARD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 100,
            'quota_used' => 45, // Sudah dipakai 45
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        // Coba turunkan quota_total ke 30 (lebih kecil dari quota_used 45)
        $response = $this->putJson("/api/v1/admin/vouchers/{$voucher->id}", [
            'quota_total' => 30,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quota_total']);

        $this->assertDatabaseHas('vouchers', [
            'id' => $voucher->id,
            'quota_total' => 100,
        ]);
    }

    public function test_super_admin_can_physically_delete_unused_voucher(): void
    {
        $this->actingAs($this->superAdmin);

        $voucher = Voucher::create([
            'code' => 'UNUSEDVOUCHER',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 50,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        $response = $this->deleteJson("/api/v1/admin/vouchers/{$voucher->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.deleted', true)
            ->assertJsonPath('data.deactivated', false);

        $this->assertDatabaseMissing('vouchers', [
            'id' => $voucher->id,
        ]);
    }

    public function test_delete_voucher_deactivates_instead_of_physical_delete_if_has_event_transactions(): void
    {
        $this->actingAs($this->superAdmin);

        $voucher = Voucher::create([
            'code' => 'USEDVOUCHER',
            'discount_type' => 'percentage',
            'discount_value' => 20,
            'min_purchase' => 50000,
            'item_type' => 'ticket',
            'quota_total' => 50,
            'quota_used' => 1,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        $event = Event::create([
            'slug' => 'event-voucher-test',
            'event_type' => 'regular',
            'seating_type' => 'assigned_seating',
            'title' => 'Event Voucher Test',
            'description' => 'Test event description for voucher',
            'synopsis_short' => 'Short synopsis',
            'poster_path' => 'events/posters/test.jpg',
            'backdrop_path' => 'events/backdrops/test.jpg',
            'director' => 'Test Director',
            'cast' => ['Actor 1'],
            'rules' => ['No recording'],
            'venue_name' => 'Cinema XXI Senayan',
            'venue_address' => 'Plaza Senayan',
            'city' => 'Jakarta Pusat',
            'cinema_partner' => 'Cinema XXI',
            'is_active' => true,
        ]);

        $schedule = Schedule::create([
            'event_id' => $event->id,
            'studio_name' => 'Studio 1',
            'show_time' => now()->addDays(3)->setTime(19, 0),
            'ticket_price' => 50000.00,
            'total_seats' => 100,
            'is_active' => true,
        ]);

        EventTransaction::create([
            'order_id' => 'SNM-TKT-2026-9999',
            'user_id' => $this->customer->id,
            'schedule_id' => $schedule->id,
            'voucher_id' => $voucher->id,
            'ticket_quantity' => 1,
            'gross_amount' => 50000,
            'discount_amount' => 10000,
            'net_amount' => 40000,
            'payment_status' => 'paid',
            'snapshot_event_data' => [
                'event_title' => $event->title,
                'studio_name' => $schedule->studio_name,
                'show_time' => $schedule->show_time->toIso8601String(),
                'ticket_price' => 50000,
            ],
        ]);

        $response = $this->deleteJson("/api/v1/admin/vouchers/{$voucher->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.deleted', false)
            ->assertJsonPath('data.deactivated', true);

        // Voucher harus tetap ada di DB namun is_active = false
        $this->assertDatabaseHas('vouchers', [
            'id' => $voucher->id,
            'is_active' => false,
        ]);
    }

    public function test_delete_voucher_deactivates_if_has_movie_transactions(): void
    {
        $this->actingAs($this->superAdmin);

        $voucher = Voucher::create([
            'code' => 'VODUSEDVOUCHER',
            'discount_type' => 'fixed',
            'discount_value' => 5000,
            'min_purchase' => 15000,
            'item_type' => 'movie_rental',
            'quota_total' => 100,
            'quota_used' => 1,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        $movie = Movie::create([
            'slug' => 'test-movie-voucher',
            'title' => 'Test Movie Voucher',
            'synopsis' => 'Test Synopsis',
            'poster_path' => 'movies/posters/test.jpg',
            'backdrop_path' => 'movies/backdrops/test.jpg',
            'director' => 'Test Director',
            'cast' => ['Actor 1'],
            'genre' => 'Drama',
            'age_rating' => '17+',
            'access_model' => 'rental',
            'duration_minutes' => 90,
            'price' => 20000.00,
            'rental_duration_hours' => 48,
            'cloudflare_video_uid' => 'stream-test-voucher-uid',
            'release_year' => 2026,
            'is_published' => true,
        ]);

        MovieTransaction::create([
            'order_id' => 'SNM-VOD-2026-8888',
            'user_id' => $this->customer->id,
            'movie_id' => $movie->id,
            'voucher_id' => $voucher->id,
            'gross_amount' => 20000,
            'discount_amount' => 5000,
            'net_amount' => 15000,
            'payment_status' => 'paid',
            'snapshot_movie_data' => [
                'title' => $movie->title,
                'duration_minutes' => $movie->duration_minutes,
                'rental_price' => 20000,
            ],
        ]);

        $response = $this->deleteJson("/api/v1/admin/vouchers/{$voucher->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.deleted', false)
            ->assertJsonPath('data.deactivated', true);

        $this->assertDatabaseHas('vouchers', [
            'id' => $voucher->id,
            'is_active' => false,
        ]);
    }

    public function test_super_admin_can_create_direct_discount_with_auto_generated_code(): void
    {
        $this->actingAs($this->superAdmin);

        $payload = [
            'promo_type' => 'direct_discount',
            'name' => 'Flash Sale Tiket Merdeka',
            'discount_type' => 'percentage',
            'discount_value' => 25,
            'min_purchase' => 50000,
            'max_discount' => 20000,
            'item_type' => 'ticket',
            'quota_total' => 100,
            'valid_from' => now()->startOfDay()->toIso8601String(),
            'valid_until' => now()->addDays(7)->endOfDay()->toIso8601String(),
            'is_active' => true,
        ];

        $response = $this->postJson('/api/v1/admin/vouchers', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.promo_type', 'direct_discount')
            ->assertJsonPath('data.name', 'Flash Sale Tiket Merdeka');

        $code = $response->json('data.code');
        $this->assertNotNull($code);
        $this->assertStringStartsWith('DISC-', $code);

        $this->assertDatabaseHas('vouchers', [
            'promo_type' => 'direct_discount',
            'name' => 'Flash Sale Tiket Merdeka',
            'code' => $code,
        ]);
    }

    public function test_super_admin_can_filter_vouchers_by_promo_type(): void
    {
        $this->actingAs($this->superAdmin);

        Voucher::create([
            'code' => 'VOUCHER10',
            'promo_type' => 'voucher_code',
            'name' => 'Kupon Spesial',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        Voucher::create([
            'code' => 'DISC-TEST-123',
            'promo_type' => 'direct_discount',
            'name' => 'Diskon Langsung Coret',
            'discount_type' => 'fixed',
            'discount_value' => 5000,
            'min_purchase' => 0,
            'item_type' => 'ticket',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        $resDirect = $this->getJson('/api/v1/admin/vouchers?promo_type=direct_discount');
        $resDirect->assertStatus(200);
        $this->assertEquals(1, $resDirect->json('meta.total'));
        $this->assertEquals('direct_discount', $resDirect->json('data.0.promo_type'));

        $resVoucher = $this->getJson('/api/v1/admin/vouchers?promo_type=voucher_code');
        $resVoucher->assertStatus(200);
        $this->assertEquals(1, $resVoucher->json('meta.total'));
        $this->assertEquals('voucher_code', $resVoucher->json('data.0.promo_type'));
    }

    public function test_voucher_model_scopes_filter_by_promo_type(): void
    {
        Voucher::create([
            'code' => 'VOUCHER-SCOPE',
            'promo_type' => 'voucher_code',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        Voucher::create([
            'code' => 'DISC-SCOPE',
            'promo_type' => 'direct_discount',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_purchase' => 0,
            'item_type' => 'all',
            'quota_total' => 100,
            'quota_used' => 0,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(10),
            'is_active' => true,
        ]);

        $this->assertEquals(1, Voucher::directDiscounts()->count());
        $this->assertEquals(1, Voucher::voucherCodes()->count());
    }
}
