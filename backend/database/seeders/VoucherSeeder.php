<?php

namespace Database\Seeders;

use App\Models\EventTransaction;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\Schedule;
use App\Models\SeatLock;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Database\Seeder;

class VoucherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Dapatkan / Buat Demo User untuk pengetesan Postman
        $demoUser = User::firstOrCreate(
            ['email' => 'customer.test@sinemus.id'],
            [
                'google_id' => 'demo-google-customer-001',
                'name' => 'Budi Santoso (Customer Test)',
                'phone_number' => '081299998888',
                'is_phone_locked' => true,
                'role' => 'customer',
            ]
        );

        // Buat Sanctum token tetap untuk memudahkan import Postman
        $demoUser->tokens()->where('name', 'postman-test-token')->delete();
        $token = $demoUser->createToken('postman-test-token')->plainTextToken;

        // 2. Seed Ragam Voucher Promo Realistis
        $vouchers = [
            [
                'code' => 'SINEMUSHEMAT',
                'discount_type' => 'percentage',
                'discount_value' => 20.00,
                'min_purchase' => 50000.00,
                'max_discount' => 25000.00,
                'item_type' => 'all',
                'quota_total' => 100,
                'quota_used' => 0,
                'valid_from' => now()->subMonth(),
                'valid_until' => now()->addYear(),
                'is_active' => true,
            ],
            [
                'code' => 'TIKETXXI25K',
                'discount_type' => 'fixed',
                'discount_value' => 25000.00,
                'min_purchase' => 50000.00,
                'max_discount' => null,
                'item_type' => 'ticket',
                'quota_total' => 50,
                'quota_used' => 0,
                'valid_from' => now()->subMonth(),
                'valid_until' => now()->addYear(),
                'is_active' => true,
            ],
            [
                'code' => 'VODSERU10K',
                'discount_type' => 'fixed',
                'discount_value' => 10000.00,
                'min_purchase' => 20000.00,
                'max_discount' => null,
                'item_type' => 'movie_rental',
                'quota_total' => 50,
                'quota_used' => 0,
                'valid_from' => now()->subMonth(),
                'valid_until' => now()->addYear(),
                'is_active' => true,
            ],
            [
                'code' => 'KUPONKEDALUWARSA',
                'discount_type' => 'percentage',
                'discount_value' => 50.00,
                'min_purchase' => 0.00,
                'max_discount' => null,
                'item_type' => 'all',
                'quota_total' => 100,
                'quota_used' => 0,
                'valid_from' => now()->subMonths(2),
                'valid_until' => now()->subDay(),
                'is_active' => true,
            ],
            [
                'code' => 'KUPONHABIS',
                'discount_type' => 'percentage',
                'discount_value' => 15.00,
                'min_purchase' => 0.00,
                'max_discount' => null,
                'item_type' => 'all',
                'quota_total' => 10,
                'quota_used' => 10,
                'valid_from' => now()->subMonth(),
                'valid_until' => now()->addYear(),
                'is_active' => true,
            ],
            [
                'code' => 'MINBELANJA100K',
                'discount_type' => 'fixed',
                'discount_value' => 30000.00,
                'min_purchase' => 100000.00,
                'max_discount' => null,
                'item_type' => 'ticket',
                'quota_total' => 50,
                'quota_used' => 0,
                'valid_from' => now()->subMonth(),
                'valid_until' => now()->addYear(),
                'is_active' => true,
            ],
        ];

        foreach ($vouchers as $voucherData) {
            Voucher::updateOrCreate(
                ['code' => $voucherData['code']],
                $voucherData
            );
        }

        // 3. Seed Demo Order Tiket Bioskop (EventTransaction)
        $schedule = Schedule::first();
        if ($schedule) {
            EventTransaction::updateOrCreate(
                ['order_id' => 'SNM-TKT-DEMO-ORDER'],
                [
                    'user_id' => $demoUser->id,
                    'schedule_id' => $schedule->id,
                    'ticket_quantity' => 2,
                    'gross_amount' => 100000.00,
                    'discount_amount' => 20000.00,
                    'net_amount' => 80000.00,
                    'snap_token' => 'snap_demo_token_tkt_123',
                    'payment_status' => 'paid',
                    'payment_type' => 'qris',
                    'paid_at' => now()->subHours(2),
                    'snapshot_event_data' => [
                        'title' => 'CINTA DAN SEJARAH (Special Cinema Premiere)',
                        'venue' => 'Cinema XXI Plaza Senayan',
                    ],
                ]
            );

            // Seed order expired demo untuk pengetesan webhook expire & rollback kursi
            EventTransaction::updateOrCreate(
                ['order_id' => 'SNM-TKT-DEMO-EXPIRED'],
                [
                    'user_id' => $demoUser->id,
                    'schedule_id' => $schedule->id,
                    'ticket_quantity' => 1,
                    'gross_amount' => 50000.00,
                    'discount_amount' => 0.00,
                    'net_amount' => 50000.00,
                    'snap_token' => 'snap_demo_token_tkt_exp',
                    'payment_status' => 'pending',
                    'payment_type' => null,
                    'paid_at' => null,
                    'snapshot_event_data' => [
                        'title' => 'CINTA DAN SEJARAH (Special Cinema Premiere)',
                        'venue' => 'Cinema XXI Plaza Senayan',
                    ],
                    'snapshot_seats' => [
                        ['id' => 1781, 'seat_code' => 'J3', 'price' => 50000],
                    ],
                ]
            );

            // Kunci kursi 1781 (J3) di seat_locks untuk simulasi pelepasan saat expired
            SeatLock::updateOrCreate(
                ['order_id' => 'SNM-TKT-DEMO-EXPIRED', 'seat_id' => 1781],
                [
                    'schedule_id' => $schedule->id,
                    'user_id' => $demoUser->id,
                    'quantity' => 1,
                    'expires_at' => now()->addMinutes(15),
                ]
            );
        }

        // 4. Seed Demo Order Sewa Film Digital (MovieTransaction)
        $movie = Movie::firstOrCreate(
            ['slug' => 'film-pendek-bumi-nusantara'],
            [
                'title' => 'Bumi Nusantara',
                'synopsis' => 'Dokumenter keindahan alam dan budaya nusantara.',
                'poster_path' => 'posters/bumi-nusantara.jpg',
                'backdrop_path' => 'backdrops/bumi-nusantara.jpg',
                'director' => 'Arya Sena',
                'cast' => ['Narator'],
                'genre' => 'Dokumenter',
                'age_rating' => 'SU',
                'cloudflare_video_uid' => 'cf-video-uid-demo-001',
                'duration_minutes' => 60,
                'price' => 25000.00,
                'release_year' => 2026,
                'is_published' => true,
            ]
        );

        MovieTransaction::updateOrCreate(
            ['order_id' => 'SNM-VOD-DEMO-ORDER'],
            [
                'user_id' => $demoUser->id,
                'movie_id' => $movie->id,
                'gross_amount' => 25000.00,
                'discount_amount' => 0.00,
                'net_amount' => 25000.00,
                'snap_token' => 'snap_demo_token_vod_456',
                'payment_status' => 'pending',
                'payment_type' => null,
                'paid_at' => null,
                'snapshot_movie_data' => [
                    'title' => 'Bumi Nusantara',
                    'price' => 25000.00,
                ],
            ]
        );

        $this->command->info("VoucherSeeder selesai. Demo Token Customer: {$token}");
    }
}
