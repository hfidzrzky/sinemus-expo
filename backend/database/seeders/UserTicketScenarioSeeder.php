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
     * Jalankan database seeds untuk skenario pengujian tiket:
     * - Skenario 3.2: Tiket presale bioskop XXI/CGV siap digunakan (fulfilled + M-Tix booking code & passcode).
     * - Skenario 3.3: Uji modal pembesaran kecerahan layar (TicketHighBrightnessModal).
     * - Skenario 3.1: Tiket presale bioskop menunggu injeksi (awaiting_cinema_ticket).
     * - Skenario 2: Tiket screening reguler komunitas (aktif ber-QR code hash).
     * - Anti-IDOR Test: Tiket rahasia milik User B agar penonton User A dapat menguji penolakan akses IDOR.
     */
    public function run(): void
    {
        // 1. Ambil atau buat akun pengguna utama (User A - Penonton saat ini)
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
            // Berikan tiket ke semua user yang terdaftar agar akun browser apa pun langsung memiliki tiket uji
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

        // 3. Pastikan Event & Schedule referensi tersedia
        $presaleEvent = Event::where('event_type', 'presale_cinema')->first();
        if (! $presaleEvent) {
            $presaleEvent = Event::create([
                'slug' => 'cinta-dan-sejarah-xxi-plaza-senayan',
                'event_type' => 'presale_cinema',
                'seating_type' => 'assigned_seating',
                'title' => 'CINTA DAN SEJARAH (Special Cinema Premiere)',
                'description' => 'Premiere resmi di Cinema XXI Plaza Senayan.',
                'synopsis_short' => 'Kisah epik romansa revolusi kemerdekaan.',
                'poster_path' => 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
                'backdrop_path' => 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80',
                'director' => 'Baskara Mahendra Putra',
                'cast' => ['Reza Rahadian', 'Laura Basuki'],
                'venue_name' => 'Cinema XXI Plaza Senayan',
                'cinema_partner' => 'Cinema 21 / XXI',
                'venue_address' => 'Plaza Senayan Lantai 5, Jl. Asia Afrika No.8, Gelora, Tanah Abang, Jakarta Pusat',
                'city' => 'Jakarta Pusat',
                'is_active' => true,
            ]);
        }

        $presaleSchedule = Schedule::where('event_id', $presaleEvent->id)->first();
        if (! $presaleSchedule) {
            $presaleSchedule = Schedule::create([
                'event_id' => $presaleEvent->id,
                'studio_name' => 'Studio 1 (XXI)',
                'show_time' => Carbon::now()->addDays(5)->setHour(19)->setMinute(0),
                'ticket_price' => 55000.00,
                'total_seats' => 140,
                'is_active' => true,
            ]);
        }

        $regularEvent = Event::where('event_type', 'regular')->first() ?? $presaleEvent;
        $regularSchedule = Schedule::where('event_id', $regularEvent->id)->first() ?? $presaleSchedule;

        // 4. Injeksi tiket untuk setiap akun pengguna aktif
        $idx = 0;
        foreach ($targetUsers as $targetUser) {
            if ($targetUser->id === $userB->id) {
                continue;
            }

            $codeSuffix = ($idx === 0) ? '' : '-U'.$targetUser->id;
            $seatsA = ($idx === 0) ? ['D8', 'D9'] : ['C8', 'C9'];
            $seatsB = ($idx === 0) ? ['C5', 'C6'] : ['D5', 'D6'];
            $seatsC = ($idx === 0) ? ['B6', 'B7'] : ['C6', 'C7'];

            // Tiket A: Skenario 3.2 & 3.3 — Presale XXI Siap Pakai (Fulfilled + M-Tix Credentials)
            EventTransaction::updateOrCreate(
                [
                    'order_id' => 'SNM-TKT-20261102-0002-U'.$targetUser->id,
                ],
                [
                    'user_id' => $targetUser->id,
                    'schedule_id' => $presaleSchedule->id,
                    'ticket_quantity' => 2,
                    'gross_amount' => 110000.00,
                    'discount_amount' => 0.00,
                    'net_amount' => 110000.00,
                    'snap_token' => 'snap_simulated_'.Str::random(16),
                    'payment_status' => 'paid',
                    'payment_type' => 'bca_va',
                    'paid_at' => Carbon::now()->subDays(1),
                    'ticket_code' => 'TKT-CDS-002'.$codeSuffix,
                    'qr_hash' => bin2hex(random_bytes(16)),
                    'checkin_status' => 'pending',
                    'fulfillment_status' => 'fulfilled',
                    'cinema_booking_code' => 'MTX-849201',
                    'cinema_passcode' => '382910',
                    'cinema_qr_image_path' => 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=MTX-849201-382910&format=png',
                    'cinema_ticket_notes' => 'Pencetakan karcis fisik di Self-Service Ticketing Kiosk XXI.',
                    'fulfilled_at' => Carbon::now()->subHours(12),
                    'snapshot_seats' => $seatsA,
                    'snapshot_event_data' => [
                        'event_title' => $presaleEvent->title,
                        'venue_name' => $presaleEvent->venue_name,
                        'city' => $presaleEvent->city,
                        'show_time' => $presaleSchedule->show_time->toIso8601String(),
                    ],
                ]
            );

            // Tiket B: Skenario 3.1 — Presale XXI Menunggu Injeksi (awaiting_cinema_ticket)
            EventTransaction::updateOrCreate(
                [
                    'order_id' => 'SNM-TKT-20261101-0001-U'.$targetUser->id,
                ],
                [
                    'user_id' => $targetUser->id,
                    'schedule_id' => $presaleSchedule->id,
                    'ticket_quantity' => 2,
                    'gross_amount' => 110000.00,
                    'discount_amount' => 0.00,
                    'net_amount' => 110000.00,
                    'snap_token' => 'snap_simulated_'.Str::random(16),
                    'payment_status' => 'paid',
                    'payment_type' => 'qris',
                    'paid_at' => Carbon::now()->subDays(2),
                    'ticket_code' => 'TKT-CDS-001'.$codeSuffix,
                    'qr_hash' => bin2hex(random_bytes(16)),
                    'checkin_status' => 'pending',
                    'fulfillment_status' => 'awaiting_cinema_ticket',
                    'cinema_booking_code' => null,
                    'cinema_passcode' => null,
                    'cinema_qr_image_path' => null,
                    'snapshot_seats' => $seatsB,
                    'snapshot_event_data' => [
                        'event_title' => $presaleEvent->title,
                        'venue_name' => $presaleEvent->venue_name,
                        'city' => $presaleEvent->city,
                        'show_time' => $presaleSchedule->show_time->toIso8601String(),
                    ],
                ]
            );

            // Tiket C: Skenario 2 — Screening Reguler Komunitas (Aktif Ber-QR Code)
            EventTransaction::updateOrCreate(
                [
                    'order_id' => 'SNM-TKT-20261103-0003-U'.$targetUser->id,
                ],
                [
                    'user_id' => $targetUser->id,
                    'schedule_id' => $regularSchedule->id,
                    'ticket_quantity' => 2,
                    'gross_amount' => 70000.00,
                    'discount_amount' => 0.00,
                    'net_amount' => 70000.00,
                    'snap_token' => 'snap_simulated_'.Str::random(16),
                    'payment_status' => 'paid',
                    'payment_type' => 'gopay',
                    'paid_at' => Carbon::now()->subHours(6),
                    'ticket_code' => 'TKT-IMT-003'.$codeSuffix,
                    'qr_hash' => bin2hex(random_bytes(16)),
                    'checkin_status' => 'pending',
                    'fulfillment_status' => 'fulfilled',
                    'snapshot_seats' => $seatsC,
                    'snapshot_event_data' => [
                        'event_title' => $regularEvent->title,
                        'venue_name' => $regularEvent->venue_name,
                        'city' => $regularEvent->city,
                        'show_time' => $regularSchedule->show_time->toIso8601String(),
                    ],
                ]
            );

            $idx++;
        }

        // 5. Tiket Rahasia Milik User B (Khusus Uji Anti-IDOR)
        EventTransaction::updateOrCreate(
            [
                'order_id' => 'SNM-TKT-SECRET-USER-B',
            ],
            [
                'user_id' => $userB->id,
                'schedule_id' => $presaleSchedule->id,
                'ticket_quantity' => 1,
                'gross_amount' => 55000.00,
                'discount_amount' => 0.00,
                'net_amount' => 55000.00,
                'payment_status' => 'paid',
                'ticket_code' => 'TKT-SECRET-USER-B',
                'qr_hash' => 'secret_qr_hash_belonging_to_user_b',
                'checkin_status' => 'pending',
                'fulfillment_status' => 'fulfilled',
                'cinema_booking_code' => 'MTX-SECRET',
                'cinema_passcode' => '999999',
                'snapshot_seats' => ['A1'],
                'snapshot_event_data' => [
                    'event_title' => $presaleEvent->title,
                    'venue_name' => $presaleEvent->venue_name,
                    'city' => $presaleEvent->city,
                    'show_time' => $presaleSchedule->show_time->toIso8601String(),
                ],
            ]
        );

        // 6. Fulfill pesanan spesifik jika ada di database (seperti SNM-TKT-20260925-HWJD2W dari screenshot penonton)
        $specificOrderIds = ['SNM-TKT-20260925-HWJD2W', 'SNM-TKT-20260924-RW3CVD'];
        foreach ($specificOrderIds as $specificOrderId) {
            $order = EventTransaction::where('order_id', $specificOrderId)->first();
            if ($order) {
                $order->update([
                    'fulfillment_status' => 'fulfilled',
                    'cinema_booking_code' => 'MTX-918234',
                    'cinema_passcode' => '572911',
                    'cinema_qr_image_path' => 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=MTX-918234-572911&format=png',
                    'cinema_ticket_notes' => 'Pencetakan karcis fisik di Self-Service Ticketing Kiosk XXI Plaza Senayan.',
                    'fulfilled_at' => Carbon::now(),
                ]);
                $this->command?->info("Pesanan spesifik {$specificOrderId} berhasil di-fulfill dengan kredensial M-Tix!");
            }
        }

        // 7. Rekonsiliasi atomik seluruh denah kursi fisik agar 100% sinkron dengan transaksi yang dibuat
        app(AdminScheduleSeatService::class)->reconcileAllSchedules();

        $this->command?->info('Seeder tiket pengujian skenario 3.2 (Presale QR M-Tix) & Skenario 2 (Tiket Reguler QR Sinemus) berhasil dieksekusi dan denah kursi disinkronkan!');
    }
}
