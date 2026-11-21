<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\User;
use App\Services\Admin\Events\AdminScheduleSeatService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserTicketScenarioSeeder extends Seeder
{
    /**
     * Jalankan database seeds untuk skenario pengujian tiket aktif:
     * - Skenario 1: Tiket event reguler berkursi (assigned_seating, aktif ber-QR code hash).
     * - Skenario 2: Tiket event tanpa kursi / General Admission (general_admission, aktif ber-QR code hash).
     * - Skenario 3: Tiket riwayat yang sudah check-in (checked_in).
     * - Anti-IDOR Test: Tiket rahasia milik User B agar penonton User A dapat menguji penolakan akses IDOR.
     */
    public function run(): void
    {
        // 1. Ambil atau buat akun pengguna utama
        $users = User::all();
        if ($users->isEmpty()) {
            $userA = User::create([
                'name' => 'Sineas Muslim Indonesia',
                'email' => 'sineas@sinemus.id',
                'google_id' => 'google_demo_001',
                'phone_number' => '081234567890',
                'is_phone_locked' => true,
                'role' => 'customer',
            ]);
            $targetUsers = collect([$userA]);
        } else {
            $targetUsers = $users;
        }

        // 2. Ambil atau buat akun User B khusus pengujian Anti-IDOR
        $userB = User::where('email', 'user_b_competitor@example.com')->first();
        if (! $userB) {
            $userB = User::where('id', '!=', $users->first()?->id)->first();
        }
        if (! $userB) {
            $userB = User::create([
                'name' => 'Penonton B (User Lain)',
                'email' => 'user_b_competitor@example.com',
                'google_id' => 'google_demo_user_b',
                'phone_number' => '0899'.rand(10000000, 99999999),
                'is_phone_locked' => true,
                'role' => 'customer',
            ]);
        }

        // 3. Pastikan Event & Schedule referensi tersedia (Assigned Seating)
        $assignedEvent = Event::where('seating_type', 'assigned_seating')->first() ?? Event::first();
        if (! $assignedEvent) {
            $assignedEvent = Event::create([
                'slug' => 'cinta-dan-sejarah-screening-reguler',
                'event_type' => 'regular',
                'seating_type' => 'assigned_seating',
                'title' => 'CINTA DAN SEJARAH (Special Screening)',
                'description' => 'Screening spesial dengan pemilihan kursi auditorium.',
                'synopsis_short' => 'Kisah epik romansa revolusi kemerdekaan.',
                'poster_path' => 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80',
                'director' => 'Baskara Mahendra Putra',
                'cast' => ['Reza Rahadian', 'Laura Basuki'],
                'venue_name' => 'Auditorium IFI Thamrin',
                'venue_address' => 'Jl. M.H. Thamrin No.20, Jakarta Pusat',
                'city' => 'Jakarta Pusat',
                'is_active' => true,
            ]);
        }

        $assignedSchedule = Schedule::where('event_id', $assignedEvent->id)->first();
        if (! $assignedSchedule) {
            $assignedSchedule = Schedule::create([
                'event_id' => $assignedEvent->id,
                'studio_name' => 'Auditorium Utama',
                'show_time' => Carbon::now()->addDays(5)->setHour(19)->setMinute(0),
                'ticket_price' => 55000.00,
                'total_seats' => 140,
                'is_active' => true,
            ]);
        }

        // 4. Pastikan Event & Schedule tanpa kursi (General Admission) tersedia
        $gaEvent = Event::where('seating_type', 'general_admission')->first();
        if (! $gaEvent) {
            $gaEvent = Event::create([
                'slug' => 'suara-dari-hilir-diskusi-terbuka',
                'event_type' => 'regular',
                'seating_type' => 'general_admission',
                'title' => 'SUARA DARI HILIR (Screening & Diskusi Terbuka)',
                'description' => 'Penayangan komunitas tanpa nomor kursi (General Admission / Free Seating).',
                'synopsis_short' => 'Pemutaran dokumenter independen dan diskusi bersama sutradara.',
                'poster_path' => 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80',
                'director' => 'Nadia Larasati',
                'cast' => ['Komunitas Sinema Nusantara'],
                'venue_name' => 'Ruang Eksibisi Sinemus Space',
                'venue_address' => 'Jl. Kemang Raya No.12, Jakarta Selatan',
                'city' => 'Jakarta Selatan',
                'is_active' => true,
            ]);
        }

        $gaSchedule = Schedule::where('event_id', $gaEvent->id)->first();
        if (! $gaSchedule) {
            $gaSchedule = Schedule::create([
                'event_id' => $gaEvent->id,
                'studio_name' => 'Hall Terbuka (Free Seating)',
                'show_time' => Carbon::now()->addDays(7)->setHour(16)->setMinute(0),
                'ticket_price' => 35000.00,
                'total_seats' => 100,
                'is_active' => true,
            ]);
        }

        // 5. Seed tiket untuk setiap akun pengguna aktif
        $idx = 0;
        foreach ($targetUsers as $targetUser) {
            if ($targetUser->id === $userB->id) {
                continue;
            }

            $codeSuffix = ($idx === 0) ? '' : '-U'.$targetUser->id;
            $seatsActive = ($idx === 0) ? ['D8', 'D9'] : ['C8', 'C9'];
            $seatsCheckedIn = ($idx === 0) ? ['B6', 'B7'] : ['C6', 'C7'];

            // Tiket A: Event Reguler Berkursi (Assigned Seating - Aktif Ber-QR Code)
            EventTransaction::updateOrCreate(
                [
                    'order_id' => 'SNM-TKT-20261102-REG-U'.$targetUser->id,
                ],
                [
                    'user_id' => $targetUser->id,
                    'schedule_id' => $assignedSchedule->id,
                    'ticket_quantity' => 2,
                    'gross_amount' => 110000.00,
                    'discount_amount' => 0.00,
                    'net_amount' => 110000.00,
                    'snap_token' => 'snap_simulated_'.Str::random(16),
                    'payment_status' => 'paid',
                    'payment_type' => 'bca_va',
                    'paid_at' => Carbon::now()->subDays(1),
                    'ticket_code' => 'TKT-REG-001'.$codeSuffix,
                    'qr_hash' => bin2hex(random_bytes(16)),
                    'checkin_status' => 'pending',
                    'snapshot_seats' => $seatsActive,
                    'snapshot_event_data' => [
                        'event_title' => $assignedEvent->title,
                        'venue_name' => $assignedEvent->venue_name,
                        'city' => $assignedEvent->city,
                        'show_time' => $assignedSchedule->show_time->toIso8601String(),
                    ],
                ]
            );

            // Tiket B: Event Tanpa Kursi / General Admission (Aktif Ber-QR Code)
            EventTransaction::updateOrCreate(
                [
                    'order_id' => 'SNM-TKT-20261103-GA-U'.$targetUser->id,
                ],
                [
                    'user_id' => $targetUser->id,
                    'schedule_id' => $gaSchedule->id,
                    'ticket_quantity' => 2,
                    'gross_amount' => 70000.00,
                    'discount_amount' => 0.00,
                    'net_amount' => 70000.00,
                    'snap_token' => 'snap_simulated_'.Str::random(16),
                    'payment_status' => 'paid',
                    'payment_type' => 'qris',
                    'paid_at' => Carbon::now()->subHours(10),
                    'ticket_code' => 'TKT-GA-002'.$codeSuffix,
                    'qr_hash' => bin2hex(random_bytes(16)),
                    'checkin_status' => 'pending',
                    'snapshot_seats' => [],
                    'snapshot_event_data' => [
                        'event_title' => $gaEvent->title,
                        'venue_name' => $gaEvent->venue_name,
                        'city' => $gaEvent->city,
                        'show_time' => $gaSchedule->show_time->toIso8601String(),
                    ],
                ]
            );

            // Tiket C: Riwayat Event Reguler (Sudah Check-In)
            EventTransaction::updateOrCreate(
                [
                    'order_id' => 'SNM-TKT-20261103-CHK-U'.$targetUser->id,
                ],
                [
                    'user_id' => $targetUser->id,
                    'schedule_id' => $assignedSchedule->id,
                    'ticket_quantity' => 2,
                    'gross_amount' => 110000.00,
                    'discount_amount' => 0.00,
                    'net_amount' => 110000.00,
                    'snap_token' => 'snap_simulated_'.Str::random(16),
                    'payment_status' => 'paid',
                    'payment_type' => 'gopay',
                    'paid_at' => Carbon::now()->subDays(3),
                    'ticket_code' => 'TKT-CHK-003'.$codeSuffix,
                    'qr_hash' => bin2hex(random_bytes(16)),
                    'checkin_status' => 'checked_in',
                    'checkin_at' => Carbon::now()->subHours(6),
                    'snapshot_seats' => $seatsCheckedIn,
                    'snapshot_event_data' => [
                        'event_title' => $assignedEvent->title,
                        'venue_name' => $assignedEvent->venue_name,
                        'city' => $assignedEvent->city,
                        'show_time' => $assignedSchedule->show_time->toIso8601String(),
                    ],
                ]
            );

            $idx++;
        }

        // 6. Tiket Rahasia Milik User B (Khusus Uji Anti-IDOR)
        EventTransaction::updateOrCreate(
            [
                'order_id' => 'SNM-TKT-SECRET-USER-B',
            ],
            [
                'user_id' => $userB->id,
                'schedule_id' => $assignedSchedule->id,
                'ticket_quantity' => 1,
                'gross_amount' => 55000.00,
                'discount_amount' => 0.00,
                'net_amount' => 55000.00,
                'payment_status' => 'paid',
                'ticket_code' => 'TKT-SECRET-USER-B',
                'qr_hash' => 'secret_qr_hash_belonging_to_user_b',
                'checkin_status' => 'pending',
                'snapshot_seats' => ['A1'],
                'snapshot_event_data' => [
                    'event_title' => $assignedEvent->title,
                    'venue_name' => $assignedEvent->venue_name,
                    'city' => $assignedEvent->city,
                    'show_time' => $assignedSchedule->show_time->toIso8601String(),
                ],
            ]
        );

        // 7. Rekonsiliasi atomik seluruh denah kursi fisik agar 100% sinkron dengan transaksi yang dibuat
        app(AdminScheduleSeatService::class)->reconcileAllSchedules();

        $this->command?->info('Seeder tiket pengujian (Event Reguler Berkursi, General Admission Tanpa Kursi, Riwayat Check-In & Anti-IDOR) berhasil dieksekusi!');
    }
}
