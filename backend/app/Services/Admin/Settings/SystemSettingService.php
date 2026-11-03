<?php

namespace App\Services\Admin\Settings;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

class SystemSettingService
{
    public const PUBLIC_SETTINGS_CACHE_KEY = 'public_system_settings';

    /**
     * Mengambil seluruh konfigurasi sistem beserta metadata audit untuk Admin Studio.
     *
     * @return array<string, mixed>
     */
    public function getAllSettings(): array
    {
        $settings = SystemSetting::with('updatedBy')->get()->keyBy('group');

        $businessPolicies = $settings->get(SystemSetting::GROUP_BUSINESS_POLICIES)?->payload ?? $this->getDefaultBusinessPolicies();
        $publicContact = $settings->get(SystemSetting::GROUP_PUBLIC_CONTACT)?->payload ?? $this->getDefaultPublicContact();
        $emergencyControls = $settings->get(SystemSetting::GROUP_EMERGENCY_CONTROLS)?->payload ?? $this->getDefaultEmergencyControls();

        // Cari record yang paling terakhir diperbarui
        $latestUpdated = $settings->sortByDesc('updated_at')->first();

        $auditMeta = [
            'app_version' => (string) config('app.version', '2.0.0-beta.2'),
            'server_time' => now()->toISOString(),
            'timezone' => (string) config('app.timezone', 'UTC'),
            'last_updated_at' => $latestUpdated?->updated_at?->toISOString(),
            'last_updated_by_name' => $latestUpdated?->updatedBy?->name ?? 'Sistem',
        ];

        return [
            'business_policies' => $businessPolicies,
            'public_contact' => $publicContact,
            'emergency_controls' => $emergencyControls,
            'audit_meta' => $auditMeta,
        ];
    }

    /**
     * Mengambil konfigurasi publik yang aman dikonsumsi oleh antarmuka penonton (dengan Redis/Database Cache).
     *
     * @return array<string, mixed>
     */
    public function getPublicSettings(): array
    {
        return Cache::rememberForever(self::PUBLIC_SETTINGS_CACHE_KEY, function () {
            $settings = SystemSetting::all()->keyBy('group');

            $publicContact = $settings->get(SystemSetting::GROUP_PUBLIC_CONTACT)?->payload ?? $this->getDefaultPublicContact();
            $emergencyControls = $settings->get(SystemSetting::GROUP_EMERGENCY_CONTROLS)?->payload ?? $this->getDefaultEmergencyControls();
            $businessPolicies = $settings->get(SystemSetting::GROUP_BUSINESS_POLICIES)?->payload ?? $this->getDefaultBusinessPolicies();

            return [
                'public_contact' => [
                    'whatsapp_admin_number' => $publicContact['whatsapp_admin_number'] ?? '6281234567890',
                    'whatsapp_prefill_template' => $publicContact['whatsapp_prefill_template'] ?? '',
                    'support_email' => $publicContact['support_email'] ?? 'support@sinemus.id',
                    'social_media' => $publicContact['social_media'] ?? [],
                    'operating_hours' => $publicContact['operating_hours'] ?? '',
                ],
                'emergency_controls' => [
                    'is_maintenance_mode' => (bool) ($emergencyControls['is_maintenance_mode'] ?? false),
                    'maintenance_message' => (string) ($emergencyControls['maintenance_message'] ?? ''),
                    'freeze_cinema_ticket_sales' => (bool) ($emergencyControls['freeze_cinema_ticket_sales'] ?? false),
                    'freeze_vod_rentals' => (bool) ($emergencyControls['freeze_vod_rentals'] ?? false),
                    'emergency_alert_banner' => $emergencyControls['emergency_alert_banner'] ?? [
                        'is_active' => false,
                        'message' => '',
                        'type' => 'warning',
                    ],
                ],
                'business_policies' => [
                    'seat_lock_duration_minutes' => (int) ($businessPolicies['seat_lock_duration_minutes'] ?? 15),
                    'vod_rental_duration_hours' => (int) ($businessPolicies['vod_rental_duration_hours'] ?? 48),
                    'platform_service_fee' => (int) ($businessPolicies['platform_service_fee'] ?? 0),
                    'max_tickets_per_order' => (int) ($businessPolicies['max_tickets_per_order'] ?? 8),
                ],
                'server_time' => now()->toISOString(),
            ];
        });
    }

    /**
     * Mengambil konfigurasi kebijakan bisnis (SSOT).
     *
     * @return array{seat_lock_duration_minutes: int, vod_rental_duration_hours: int, platform_service_fee: int, max_tickets_per_order: int}
     */
    public function getBusinessPolicies(): array
    {
        $public = $this->getPublicSettings();

        return $public['business_policies'];
    }

    /**
     * Mengambil kontrol darurat sistem (SSOT).
     *
     * @return array{is_maintenance_mode: bool, maintenance_message: string, freeze_cinema_ticket_sales: bool, freeze_vod_rentals: bool, emergency_alert_banner: array<string, mixed>}
     */
    public function getEmergencyControls(): array
    {
        $public = $this->getPublicSettings();

        return $public['emergency_controls'];
    }

    /**
     * Mengambil informasi kontak publik (SSOT).
     *
     * @return array{whatsapp_admin_number: string, whatsapp_prefill_template: string, support_email: string, social_media: array<string, string>, operating_hours: string}
     */
    public function getPublicContact(): array
    {
        $public = $this->getPublicSettings();

        return $public['public_contact'];
    }

    /**
     * Mengambil durasi penguncian kursi sementara (menit) - SSOT.
     */
    public function getSeatLockDurationMinutes(): int
    {
        return (int) ($this->getBusinessPolicies()['seat_lock_duration_minutes'] ?? $this->getDefaultBusinessPolicies()['seat_lock_duration_minutes']);
    }

    /**
     * Mengambil durasi akses pemutaran sewa film VoD (jam) - SSOT.
     */
    public function getVodRentalDurationHours(): int
    {
        return (int) ($this->getBusinessPolicies()['vod_rental_duration_hours'] ?? $this->getDefaultBusinessPolicies()['vod_rental_duration_hours']);
    }

    /**
     * Mengambil biaya layanan platform (Rp) - SSOT.
     */
    public function getPlatformServiceFee(): float
    {
        return (float) ($this->getBusinessPolicies()['platform_service_fee'] ?? $this->getDefaultBusinessPolicies()['platform_service_fee']);
    }

    /**
     * Mengambil batas maksimal tiket per pemesanan - SSOT.
     */
    public function getMaxTicketsPerOrder(): int
    {
        return (int) ($this->getBusinessPolicies()['max_tickets_per_order'] ?? $this->getDefaultBusinessPolicies()['max_tickets_per_order']);
    }

    /**
     * Memeriksa apakah penjualan tiket bioskop sedang dibekukan - SSOT.
     */
    public function isCinemaTicketSalesFrozen(): bool
    {
        return (bool) ($this->getEmergencyControls()['freeze_cinema_ticket_sales'] ?? false);
    }

    /**
     * Memeriksa apakah transaksi sewa film VoD sedang dibekukan - SSOT.
     */
    public function isVodRentalsFrozen(): bool
    {
        return (bool) ($this->getEmergencyControls()['freeze_vod_rentals'] ?? false);
    }

    /**
     * Memeriksa apakah sistem sedang dalam mode maintenance - SSOT.
     */
    public function isMaintenanceMode(): bool
    {
        return (bool) ($this->getEmergencyControls()['is_maintenance_mode'] ?? false);
    }

    /**
     * Mengambil pesan pemeliharaan sistem - SSOT.
     */
    public function getMaintenanceMessage(): string
    {
        $message = (string) ($this->getEmergencyControls()['maintenance_message'] ?? '');

        return ! empty($message)
            ? $message
            : 'Sistem Sinemus sedang dalam pemeliharaan berkala untuk peningkatan performa. Silakan kembali beberapa saat lagi.';
    }

    /**
     * Memperbarui Kebijakan Bisnis & Transaksi.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function updateBusinessPolicies(array $payload, int $adminId): array
    {
        $setting = SystemSetting::updateOrCreate(
            ['group' => SystemSetting::GROUP_BUSINESS_POLICIES],
            [
                'payload' => $payload,
                'updated_by' => $adminId,
            ]
        );

        $this->clearSettingsCache();

        return $setting->payload;
    }

    /**
     * Memperbarui Layanan Kontak Publik & Helpdesk.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function updatePublicContact(array $payload, int $adminId): array
    {
        $setting = SystemSetting::updateOrCreate(
            ['group' => SystemSetting::GROUP_PUBLIC_CONTACT],
            [
                'payload' => $payload,
                'updated_by' => $adminId,
            ]
        );

        $this->clearSettingsCache();

        return $setting->payload;
    }

    /**
     * Memperbarui Kontrol Darurat & Mode Pemeliharaan.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function updateEmergencyControls(array $payload, int $adminId): array
    {
        $setting = SystemSetting::updateOrCreate(
            ['group' => SystemSetting::GROUP_EMERGENCY_CONTROLS],
            [
                'payload' => $payload,
                'updated_by' => $adminId,
            ]
        );

        $this->clearSettingsCache();

        return $setting->payload;
    }

    /**
     * Membersihkan cache settings publik.
     */
    public function clearSettingsCache(): void
    {
        Cache::forget(self::PUBLIC_SETTINGS_CACHE_KEY);
    }

    /**
     * Nilai default kebijakan bisnis jika belum ada di database.
     *
     * @return array<string, mixed>
     */
    protected function getDefaultBusinessPolicies(): array
    {
        return [
            'seat_lock_duration_minutes' => 15,
            'vod_rental_duration_hours' => 48,
            'platform_service_fee' => 0,
            'max_tickets_per_order' => 8,
            'enable_ticket_cancellation' => false,
        ];
    }

    /**
     * Nilai default kontak publik jika belum ada di database.
     *
     * @return array<string, mixed>
     */
    protected function getDefaultPublicContact(): array
    {
        return [
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
        ];
    }

    /**
     * Nilai default kontrol darurat jika belum ada di database.
     *
     * @return array<string, mixed>
     */
    protected function getDefaultEmergencyControls(): array
    {
        return [
            'is_maintenance_mode' => false,
            'maintenance_message' => 'Sistem Sinemus sedang dalam pemeliharaan berkala untuk peningkatan performa. Silakan kembali beberapa saat lagi.',
            'freeze_cinema_ticket_sales' => false,
            'freeze_vod_rentals' => false,
            'emergency_alert_banner' => [
                'is_active' => false,
                'message' => '',
                'type' => 'warning',
            ],
        ];
    }
}
