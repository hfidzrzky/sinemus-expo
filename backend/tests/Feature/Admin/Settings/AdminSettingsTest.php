<?php

namespace Tests\Feature\Admin\Settings;

use App\Models\SystemSetting;
use App\Models\User;
use Database\Seeders\SystemSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AdminSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Test',
            'email' => 'admin@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081122334455',
            'is_phone_locked' => true,
        ]);

        $this->customer = User::factory()->create([
            'name' => 'Penonton Bioskop',
            'email' => 'penonton@gmail.com',
            'role' => 'customer',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        $this->seed(SystemSettingSeeder::class);
    }

    public function test_unauthenticated_user_cannot_access_admin_settings(): void
    {
        $this->getJson('/api/v1/admin/settings')->assertStatus(401);
        $this->putJson('/api/v1/admin/settings/business-policies', [])->assertStatus(401);
    }

    public function test_customer_cannot_access_admin_settings(): void
    {
        $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/v1/admin/settings')
            ->assertStatus(403);
    }

    public function test_super_admin_can_retrieve_all_settings_with_envelope(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/settings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'business_policies' => [
                        'seat_lock_duration_minutes',
                        'vod_rental_duration_hours',
                        'platform_service_fee',
                        'max_tickets_per_order',
                        'enable_ticket_cancellation',
                    ],
                    'public_contact' => [
                        'whatsapp_admin_number',
                        'whatsapp_prefill_template',
                        'support_email',
                        'ticket_sender_name',
                        'ticket_sender_email',
                        'social_media',
                        'operating_hours',
                    ],
                    'emergency_controls' => [
                        'is_maintenance_mode',
                        'maintenance_message',
                        'freeze_cinema_ticket_sales',
                        'freeze_vod_rentals',
                        'emergency_alert_banner' => [
                            'is_active',
                            'message',
                            'type',
                        ],
                    ],
                    'audit_meta' => [
                        'app_version',
                        'server_time',
                        'timezone',
                        'last_updated_at',
                        'last_updated_by_name',
                    ],
                ],
                'server_time',
            ]);

        $this->assertTrue($response->json('success'));
    }

    public function test_super_admin_can_update_business_policies(): void
    {
        $payload = [
            'seat_lock_duration_minutes' => 20,
            'vod_rental_duration_hours' => 72,
            'platform_service_fee' => 3000,
            'max_tickets_per_order' => 10,
            'enable_ticket_cancellation' => false,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson('/api/v1/admin/settings/business-policies', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => $payload,
            ]);

        $saved = SystemSetting::where('group', SystemSetting::GROUP_BUSINESS_POLICIES)->first();
        $this->assertEquals(20, $saved->payload['seat_lock_duration_minutes']);
        $this->assertEquals(3000, $saved->payload['platform_service_fee']);
        $this->assertEquals($this->superAdmin->id, $saved->updated_by);
    }

    public function test_business_policies_validation_rejects_out_of_bounds(): void
    {
        $invalidPayload = [
            'seat_lock_duration_minutes' => 2, // min 5
            'vod_rental_duration_hours' => 5, // min 12
            'platform_service_fee' => -100, // min 0
            'max_tickets_per_order' => 25, // max 20
            'enable_ticket_cancellation' => false,
        ];

        $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson('/api/v1/admin/settings/business-policies', $invalidPayload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'seat_lock_duration_minutes',
                'vod_rental_duration_hours',
                'platform_service_fee',
                'max_tickets_per_order',
            ]);
    }

    public function test_super_admin_can_update_public_contact(): void
    {
        $payload = [
            'whatsapp_admin_number' => '081299887766',
            'whatsapp_prefill_template' => 'Halo Admin Sinemus, mau tanya tiket film...',
            'support_email' => 'cs@sinemus.id',
            'ticket_sender_name' => 'Sinemus Ticketing',
            'ticket_sender_email' => 'noreply@sinemus.id',
            'social_media' => [
                'instagram' => 'https://instagram.com/sinemus.official',
                'tiktok' => 'https://tiktok.com/@sinemus_official',
                'youtube' => 'https://youtube.com/@sinemusofficial',
            ],
            'operating_hours' => 'Senin - Jumat: 08:00 - 20:00 WIB',
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson('/api/v1/admin/settings/public-contact', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => $payload,
            ]);
    }

    public function test_public_contact_validation_rejects_invalid_phone(): void
    {
        $payload = [
            'whatsapp_admin_number' => '12345', // invalid phone format
            'whatsapp_prefill_template' => 'Halo',
            'support_email' => 'invalid-email',
            'ticket_sender_name' => 'Sinemus',
            'ticket_sender_email' => 'noreply@sinemus.id',
            'social_media' => [
                'instagram' => 'not-a-url',
            ],
            'operating_hours' => 'Setiap hari',
        ];

        $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson('/api/v1/admin/settings/public-contact', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'whatsapp_admin_number',
                'support_email',
                'social_media.instagram',
            ]);
    }

    public function test_super_admin_can_update_emergency_controls(): void
    {
        $payload = [
            'is_maintenance_mode' => true,
            'maintenance_message' => 'Perawatan server sedang berlangsung.',
            'freeze_cinema_ticket_sales' => true,
            'freeze_vod_rentals' => false,
            'emergency_alert_banner' => [
                'is_active' => true,
                'message' => 'Studio 2 sedang perbaikan AC.',
                'type' => 'warning',
            ],
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson('/api/v1/admin/settings/emergency-controls', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => $payload,
            ]);
    }

    public function test_public_can_fetch_public_settings_without_auth(): void
    {
        Cache::flush();

        $response = $this->getJson('/api/v1/public/settings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'public_contact' => [
                        'whatsapp_admin_number',
                        'whatsapp_prefill_template',
                        'support_email',
                        'social_media',
                        'operating_hours',
                    ],
                    'emergency_controls' => [
                        'is_maintenance_mode',
                        'maintenance_message',
                        'freeze_cinema_ticket_sales',
                        'freeze_vod_rentals',
                        'emergency_alert_banner',
                    ],
                    'business_policies' => [
                        'seat_lock_duration_minutes',
                        'vod_rental_duration_hours',
                        'platform_service_fee',
                        'max_tickets_per_order',
                    ],
                    'server_time',
                ],
                'server_time',
            ]);

        $this->assertTrue($response->json('success'));
    }
}
