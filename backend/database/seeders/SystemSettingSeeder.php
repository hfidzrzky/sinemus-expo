<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdmin = User::where('role', 'super_admin')->first();
        $adminId = $superAdmin?->id;

        $defaults = [
            SystemSetting::GROUP_BUSINESS_POLICIES => [
                'seat_lock_duration_minutes' => 15,
                'vod_rental_duration_hours' => 48,
                'platform_service_fee' => 0,
                'max_tickets_per_order' => 8,
                'enable_ticket_cancellation' => false,
            ],
            SystemSetting::GROUP_PUBLIC_CONTACT => [
                'whatsapp_admin_number' => '6281234567890',
                'whatsapp_prefill_template' => 'Halo Sinemus, saya mengalami kendala terkait pemesanan tiket/pemutaran...',
                'support_email' => 'support@sinemus.id',
                'ticket_sender_name' => 'Sinemus Screen',
                'ticket_sender_email' => 'tiket@sinemus.id',
                'social_media' => [
                    'instagram' => 'https://instagram.com/sinemus.id',
                    'tiktok' => 'https://tiktok.com/@sinemus.id',
                    'youtube' => 'https://youtube.com/@sinemusscreen',
                ],
                'operating_hours' => 'Senin - Minggu: 09:00 - 22:00 WIB',
            ],
            SystemSetting::GROUP_EMERGENCY_CONTROLS => [
                'is_maintenance_mode' => false,
                'maintenance_message' => 'Sistem Sinemus sedang dalam pemeliharaan berkala untuk peningkatan performa. Silakan kembali beberapa saat lagi.',
                'freeze_cinema_ticket_sales' => false,
                'freeze_vod_rentals' => false,
                'emergency_alert_banner' => [
                    'is_active' => false,
                    'message' => '',
                    'type' => 'warning',
                ],
            ],
        ];

        foreach ($defaults as $group => $payload) {
            SystemSetting::firstOrCreate(
                ['group' => $group],
                [
                    'payload' => $payload,
                    'updated_by' => $adminId,
                ]
            );
        }
    }
}
